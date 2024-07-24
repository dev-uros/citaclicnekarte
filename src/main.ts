import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import {join} from 'path';
import pcsclite from 'pcsclite'
import {PDFDocument} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit';
import Jimp from "jimp";
import * as fs from "fs";
import log from 'electron-log/main';
import {updateElectronApp, UpdateSourceType} from "update-electron-app";
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}
updateElectronApp({
    updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: 'dev-uros/citaclicnekarte',
        host: 'https://update.electronjs.org'
    },
    updateInterval: '1 hour',
    logger: log
})
const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.focus();
        // showOpenDialog(mainWindow);
    })
    mainWindow.webContents.openDevTools({
        mode: 'detach',
    });


    return mainWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
const allData = {
    documentData: {
        DocumentNumber: '',
        DocumentType: '',
        DocumentSerialNumber: '',
        IssuingDate: '',
        ExpiryDate: '',
        IssuingAuthority: ''
    },
    personalData: {
        PersonalNumber: '',
        Surname: '',
        GivenName: '',
        ParentGivenName: '',
        Sex: '',
        PlaceOfBirth: '',
        CommunityOfBirth: '',
        StateOfBirth: '',
        DateOfBirth: ''
    },
    residenceData: {
        State: '',
        Community: '',
        Place: '',
        Street: '',
        AddressNumber: '',
        AddressLetter: '',
        AddressEntrance: '',
        AddressFloor: '',
        AddressApartmentNumber: '',
        AddressDate: ''
    },
    image: '',
    pdf: '',
    pdfBase64: ''
}

let pcsc;
let cardReader;

const initializeIDCardReader = async (browserWindow: BrowserWindow) => {

    log.info('ulazim u citanje kartice')
    pcsc = await pcsclite()


    browserWindow.webContents.send('insert-card-reader-into-device');

    pcsc.on('reader', reader => {

        cardReader = reader;

        log.info('New reader detected', reader.name)

        reader.on('error', err => {
            log.error('Error(', reader.name, '):', err.message)
        })

        reader.on('status', status => {
            log.info('Status(', reader.name, '):', status)
            const changes = reader.state ^ status.state
            if (changes) {
                if ((changes & reader.SCARD_STATE_EMPTY) && (status.state & reader.SCARD_STATE_EMPTY)) {
                    //emituj event - Molimo ubacite licnu kartu u citac
                    browserWindow.webContents.send('insert-card-into-reader');

                    log.info('Card removed')
                    reader.disconnect(reader.SCARD_LEAVE_CARD, err => {
                        if (err) {
                            log.error('Error(', reader.name, '):', err.message)
                            browserWindow.webContents.send('display-error');
                            reader.close()
                            pcsc.close()
                            return;
                        } else {
                            log.info('Disconnected')
                        }
                    })
                } else if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
                    //emituj event loading
                    log.info('Card inserted')
                    browserWindow.webContents.send('card-inserted-into-reader');

                    reader.connect({share_mode: reader.SCARD_SHARE_SHARED}, async (err, protocol) => {
                        if (err) {
                            log.error('Error(', reader.name, '):', err.message)

                            browserWindow.webContents.send('display-error');
                            reader.close()
                            pcsc.close()
                            return;
                        } else {
                            log.info('Protocol(', reader.name, '):', protocol)

                            // Init card

                            const data = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x49, 0x44, 0x01])
                            let apu;
                            try {
                                apu = buildAPDU(0x00, 0xA4, 0x04, 0x00, data, 0)
                            } catch (e) {
                                log.error('Error(', reader.name, '):', err.message)

                                browserWindow.webContents.send('display-error');
                                reader.close()
                                pcsc.close()
                                return;
                            }

                            reader.transmit(apu, 256, protocol, async (err, data) => {
                                if (err) {
                                    log.error('Error(', reader.name, '):', err.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                const cardDataLocation = Buffer.from([0x0F, 0x02])

                                let cardDataLocationApdu
                                try {
                                    cardDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, cardDataLocation, 4)
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }
                                try {
                                    await generateCardData(reader, protocol, cardDataLocation, cardDataLocationApdu, 'DOCUMENT')

                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }


                                const personalDataLocation = Buffer.from([0x0F, 0x03])
                                let personalDataLocationApdu;
                                try {
                                    personalDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, personalDataLocation, 4)
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                try {
                                    await generateCardData(reader, protocol, personalDataLocation, personalDataLocationApdu, 'PERSONAL')

                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }


                                const residenceDataLocation = Buffer.from([0x0F, 0x04])

                                let residenceDataLocationApdu;
                                try {
                                    residenceDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, residenceDataLocation, 4)
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                try {
                                    await generateCardData(reader, protocol, residenceDataLocation, residenceDataLocationApdu, 'RESIDENCE')
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                const imageDataLocation = Buffer.from([0x0F, 0x06])

                                let imageDataLocationApdu;

                                try {
                                    imageDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, imageDataLocation, 4)
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                try {
                                    await generateCardData(reader, protocol, imageDataLocation, imageDataLocationApdu, 'IMAGE')

                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                }

                                try {
                                    allData.pdf = await createPdf();
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                try {
                                    allData.pdfBase64 = uint8ArrayToBase64(allData.pdf);
                                } catch (e) {
                                    log.error('Error(', reader.name, '):', e.message)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }

                                // log.info(allData);
                                reader.close()
                                pcsc.close()
                                browserWindow.webContents.send('card-data-loaded', allData);
                            })

                        }
                    })
                }
            }
        })

        reader.on('end', () => {
            log.info('Reader', reader.name, 'removed')
        })
    })


    pcsc.on('error', err => {

        log.info('PCSC error', err.message)
        // reader.close()
        pcsc.close()
    })

    function buildAPDU(cla, ins, p1, p2, data, ne) {

        let length = data.length

        if (length > 0xFFFF) {
            throw new Error('APDU command length too large')
        }

        let apdu = Buffer.from([cla, ins, p1, p2])

        if (length === 0) {
            if (ne !== 0) {
                if (ne <= 256) {
                    let l = ne === 256 ? 0x00 : ne
                    apdu = Buffer.concat([apdu, Buffer.from([l])])
                } else {
                    let l1 = ne === 65536 ? 0x00 : ne >> 8
                    let l2 = ne === 65536 ? 0x00 : ne & 0xFF
                    apdu = Buffer.concat([apdu, Buffer.from([l1, l2])])
                }
            }
        } else {
            if (ne === 0) {
                if (length <= 255) {
                    apdu = Buffer.concat([apdu, Buffer.from([length]), Buffer.from(data)])
                } else {
                    apdu = Buffer.concat([apdu, Buffer.from([0x00, length >> 8, length & 0xFF]), Buffer.from(data)])
                }
            } else {
                if (length <= 255 && ne <= 256) {
                    apdu = Buffer.concat([apdu, Buffer.from([length]), Buffer.from(data)])
                    let l = ne === 256 ? 0x00 : ne
                    apdu = Buffer.concat([apdu, Buffer.from([l])])
                } else {
                    apdu = Buffer.concat([apdu, Buffer.from([0x00, length >> 8, length & 0xFF]), Buffer.from(data)])
                    if (ne !== 65536) {
                        let neB = Buffer.from([ne >> 8, ne & 0xFF])
                        apdu = Buffer.concat([apdu, neB])
                    }
                }
            }
        }

        return apdu
    }


// Example usage:

    function transmitAsync(reader, protocol, apu) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 1024, protocol, (err, data) => {
                if (err) {
                    reject(err) // Reject promise on error
                } else {
                    resolve(data) // Resolve with data on success
                }
            })
        })
    }

    function generateCardData(reader, protocol, dataLocation, dataApdu, dataType) {
        return new Promise((resolve, reject) => {
            //select file
            reader.transmit(Buffer.from(dataApdu), 1024, protocol, async (err, data) => {
                if (err) {
                    log.error('Error(', reader.name, '):', err.message)

                    reject('error')
                    return;
                }

                const readSize = Math.min(4, 0xFF)
                let apu
                try {
                    apu = buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject('error');
                    return;
                }

                //read file
                if (dataType === 'DOCUMENT') {
                    log.info('udje document')
                    let fileDocumentData;
                    try {
                        fileDocumentData = await readFileDocumentData(reader, apu, protocol)

                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e)
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'PERSONAL') {
                    let fileDocumentData;
                    try {
                        fileDocumentData = await readFilePersonalData(reader, apu, protocol)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'RESIDENCE') {
                    let fileDocumentData;
                    try {
                        fileDocumentData = await readFileResidenceData(reader, apu, protocol)

                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'IMAGE') {
                    let fileDocumentData;
                    try {
                        fileDocumentData = await readFileImageData(reader, apu, protocol)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    resolve(fileDocumentData)
                }
            })
        })
    }

    function readFileDocumentData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {

            reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject('error');
                    return
                }

                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                // log.info('ovo je offset')
                // log.info(offset)
                let length = rsp.readUInt16LE(2)


                // log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;
                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)

                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('apdu');
                        return;
                    }
                    // log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)

                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)
                        reject('error')
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                // log.info('ovo je output')
                // log.info(output)
                let parsedData
                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject('ne radi')
                    return;
                }

                const dataArray = []

                const DocumentNumber = {value: ''}
                assignField(parsedData, 1546, DocumentNumber)
                log.info('DocumentNumber:', DocumentNumber.value)
                allData.documentData.DocumentNumber = DocumentNumber.value
                dataArray.push({DocumentNumber: DocumentNumber.value})


                const DocumentType = {value: ''}
                assignField(parsedData, 1547, DocumentType)
                log.info('DocumentType:', DocumentType.value)
                allData.documentData.DocumentType = DocumentType.value

                dataArray.push({DocumentType: DocumentType.value})

                const DocumentSerialNumber = {value: ''}
                assignField(parsedData, 1548, DocumentSerialNumber)
                log.info('DocumentSerialNumber:', DocumentSerialNumber.value)
                allData.documentData.DocumentSerialNumber = DocumentSerialNumber.value

                dataArray.push({DocumentSerialNumber: DocumentSerialNumber.value})

                const IssuingDate = {value: ''}
                assignField(parsedData, 1549, IssuingDate)
                log.info('IssuingDate:', IssuingDate.value)
                allData.documentData.IssuingDate = formatDateString(IssuingDate.value)

                dataArray.push({IssuingDate: IssuingDate.value})

                const ExpiryDate = {value: ''}
                assignField(parsedData, 1550, ExpiryDate)
                log.info('ExpiryDate:', ExpiryDate.value)
                allData.documentData.ExpiryDate = formatDateString(ExpiryDate.value)

                dataArray.push({ExpiryDate: ExpiryDate.value})

                const IssuingAuthority = {value: ''}
                assignField(parsedData, 1551, IssuingAuthority)
                log.info('IssuingAuthority:', IssuingAuthority.value)
                dataArray.push({IssuingAuthority: IssuingAuthority.value})
                allData.documentData.IssuingAuthority = IssuingAuthority.value

                resolve(allData)
            })
        })

    }

    function readFilePersonalData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject('error');
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                let length = rsp.readUInt16LE(2)


                // log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    // log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;
                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize);
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    // log.info({readSize, apu})

                    let data;

                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                // log.info('ovo je output')
                // log.info(output)
                let parsedData;
                try {
                    parsedData = parseTLV(Buffer.from(output));
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    resolve('error');
                    return;
                }

                const dataArray = []

                const PersonalNumber = {value: ''}
                assignField(parsedData, 1558, PersonalNumber)
                log.info('PersonalNumber:', PersonalNumber.value)
                allData.personalData.PersonalNumber = PersonalNumber.value
                dataArray.push({PersonalNumber: PersonalNumber.value})

                const Surname = {value: ''}
                assignField(parsedData, 1559, Surname)
                allData.personalData.Surname = Surname.value

                log.info('Surname:', Surname.value)
                dataArray.push({Surname: Surname.value})


                const GivenName = {value: ''}
                assignField(parsedData, 1560, GivenName)
                allData.personalData.GivenName = GivenName.value

                log.info('GivenName:', GivenName.value)
                dataArray.push({GivenName: GivenName.value})

                const ParentGivenName = {value: ''}
                assignField(parsedData, 1561, ParentGivenName)
                log.info('ParentGivenName:', ParentGivenName.value)
                allData.personalData.ParentGivenName = ParentGivenName.value

                dataArray.push({ParentGivenName: ParentGivenName.value})

                const Sex = {value: ''}
                assignField(parsedData, 1562, Sex)
                log.info('Sex:', Sex.value)
                allData.personalData.Sex = Sex.value

                dataArray.push({Sex: Sex.value})

                const PlaceOfBirth = {value: ''}
                assignField(parsedData, 1563, PlaceOfBirth)
                log.info('PlaceOfBirth:', PlaceOfBirth.value)
                allData.personalData.PlaceOfBirth = PlaceOfBirth.value

                dataArray.push({PlaceOfBirth: PlaceOfBirth.value})

                const CommunityOfBirth = {value: ''}
                assignField(parsedData, 1564, CommunityOfBirth)
                log.info('CommunityOfBirth:', CommunityOfBirth.value)
                allData.personalData.CommunityOfBirth = CommunityOfBirth.value

                dataArray.push({CommunityOfBirth: CommunityOfBirth.value})

                const StateOfBirth = {value: ''}
                assignField(parsedData, 1565, StateOfBirth)
                allData.personalData.StateOfBirth = StateOfBirth.value

                log.info('StateOfBirth:', StateOfBirth.value)
                dataArray.push({StateOfBirth: StateOfBirth.value})

                const DateOfBirth = {value: ''}
                assignField(parsedData, 1566, DateOfBirth)
                allData.personalData.DateOfBirth = formatDateString(DateOfBirth.value)

                log.info('DateOfBirth:', DateOfBirth.value)
                dataArray.push({DateOfBirth: DateOfBirth.value})

                resolve()
            })
        })

    }

    function readFileResidenceData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject('error');
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                let length = rsp.readUInt16LE(2)


                // log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    // log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    // log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                // log.info('ovo je output')
                // log.info(output)
                let parsedData;

                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject('error');
                    return;
                }

                const dataArray = []

                const State = {value: ''}
                assignField(parsedData, 1568, State)
                allData.residenceData.State = State.value
                log.info('State:', State.value)
                dataArray.push({State: State.value})

                const Community = {value: ''}
                assignField(parsedData, 1569, Community)
                log.info('Community:', Community.value)
                allData.residenceData.Community = Community.value

                dataArray.push({Community: Community.value})


                const Place = {value: ''}
                assignField(parsedData, 1570, Place)
                log.info('Place:', Place.value)
                allData.residenceData.Place = Place.value

                dataArray.push({Place: Place.value})

                const Street = {value: ''}
                assignField(parsedData, 1571, Street)
                log.info('Street:', Street.value)
                allData.residenceData.Street = Street.value

                dataArray.push({Street: Street.value})

                const AddressNumber = {value: ''}
                assignField(parsedData, 1572, AddressNumber)
                log.info('AddressNumber:', AddressNumber.value)
                allData.residenceData.AddressNumber = AddressNumber.value

                dataArray.push({AddressNumber: AddressNumber.value})

                const AddressLetter = {value: ''}
                assignField(parsedData, 1573, AddressLetter)
                log.info('AddressLetter:', AddressLetter.value)
                allData.residenceData.AddressLetter = AddressLetter.value

                dataArray.push({AddressLetter: AddressLetter.value})

                const AddressEntrance = {value: ''}
                assignField(parsedData, 1574, AddressEntrance)
                log.info('AddressEntrance:', AddressEntrance.value)
                allData.residenceData.AddressEntrance = AddressEntrance.value

                dataArray.push({AddressEntrance: AddressEntrance.value})

                const AddressFloor = {value: ''}
                assignField(parsedData, 1575, AddressFloor)
                log.info('AddressFloor:', AddressFloor.value)
                allData.residenceData.AddressFloor = AddressFloor.value

                dataArray.push({AddressFloor: AddressFloor.value})

                const AddressApartmentNumber = {value: ''}
                assignField(parsedData, 1578, AddressApartmentNumber)
                log.info('AddressApartmentNumber:', AddressApartmentNumber.value)
                allData.residenceData.AddressApartmentNumber = AddressApartmentNumber.value

                dataArray.push({AddressApartmentNumber: AddressApartmentNumber.value})

                const AddressDate = {value: ''}
                assignField(parsedData, 1580, AddressDate)
                log.info('AddressDate:', AddressDate.value)
                allData.residenceData.AddressDate = AddressDate.value === '01010001' ? 'NEDOSTUPAN' : formatDateString(AddressDate.value)

                dataArray.push({AddressDate: AddressDate.value})

                resolve()
            })
        })

    }

    function readFileImageData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
                if (err) {
                    log.info('Error reading header:', err)
                    reject('error');
                    return
                }
                let rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                let length = rsp.readUInt16LE(2)


                // log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    // log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    // log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject('error');
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                const imageBuffer = Buffer.from(output.slice(4)); // Slice the first 4 bytes if needed

                // log.info('Final image buffer length:', imageBuffer.length);
                // log.info('First few bytes of the image buffer:', imageBuffer.subarray(0, 10));

                // Process image buffer using sharp
                Jimp.read(imageBuffer)
                    .then((image) => {
                        image.getBuffer(Jimp.MIME_JPEG, (err, decodedImageBuffer) => {
                            if (err) {
                                log.error('Error decoding image with Jimp:', err);
                                reject(err);
                            } else {
                                allData.image = decodedImageBuffer.toString('base64');
                                resolve();
                            }
                        });
                    })
                    .catch((err) => {

                        log.error('Error reading image with Jimp:', err);
                        reject(err);
                    });


            })
        })

    }

    function parseTLV(data) {

        if (data.length === 0) {
            throw new Error('Invalid data length')
        }

        const m = {}
        let offset = 0

        while (offset < data.length) {
            const tag = data.readUInt16LE(offset)
            const length = data.readUInt16LE(offset + 2)

            offset += 4

            if (offset + length > data.length) {
                throw new Error('Invalid length')
            }

            const value = data.slice(offset, offset + length)
            m[tag] = value
            offset += length
        }

        return m
    }

    function assignField(fields, tag, target) {
        if (fields.hasOwnProperty(tag)) {
            target.value = Buffer.from(fields[tag]).toString('utf8')
        } else {
            target.value = ''
        }
    }


}

ipcMain.on('cancel-card-reader', () => {
    cancelCardRead();
})
const cancelCardRead = () => {
    if (cardReader) {
        cardReader.close();
    }
    if (pcsc) {
        pcsc.close();
    }

}
ipcMain.on('initialize-id-card-reader', async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    try {
        await initializeIDCardReader(browserWindow);

    } catch (e) {

        log.error(e);
    }


})

ipcMain.on('download-pdf', (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    downloadPdf(browserWindow)

})

const downloadPdf = async (browserWindow: BrowserWindow) => {
    const {canceled, filePath} = await dialog.showSaveDialog(browserWindow, {
        filters: [{name: 'PDFs', extensions: ['pdf']}],
        defaultPath: `${allData.personalData.GivenName.toLowerCase()}_${allData.personalData.Surname.toLowerCase()}.pdf`,
    });

    if (!canceled && filePath) {
        fs.writeFileSync(filePath, allData.pdf);
        return filePath;
    }
    return null;
}

function formatDateString(dateString: string) {

    // Extract day, month, and year from the input string
    const day = dateString.slice(0, 2);
    const month = dateString.slice(2, 4);
    const year = dateString.slice(4, 8);

    // Return formatted date string
    return `${day}.${month}.${year}`;
}


async function createPdf() {
    const fontBytes = await fs.readFileSync(join(__dirname, 'fonts', 'DejaVuSans.ttf'));

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes)

    // Create a new PDFDocument
    // Add a blank page to the document
    const page = pdfDoc.addPage([550, 750])

    //linija naslov - start
    page.drawLine({
        start: {
            x: 50,
            y: 680
        },
        end: {
            x: 500,
            y: 680
        }
    })
    page.drawText('ČITAČ ELEKTRONSKE LIČNE KARTE: ŠTAMPA PODATAKA', {
        x: 50,
        y: 685,
        size: 10,
        font: customFont
    })
    page.drawLine({
        start: {
            x: 50,
            y: 700
        },
        end: {
            x: 500,
            y: 700
        }
    })
    //linija naslov - end

    //ubaciti slku

    const image = allData.image;
    const base64ImageContent = image.split(';base64,').pop();
    const imageBytes = Uint8Array.from(atob(base64ImageContent), c => c.charCodeAt(0));

    const jpgImage = await pdfDoc.embedJpg(imageBytes)
    page.drawImage(jpgImage, {
        x: 50,
        y: 535,
        width: 100,
        height: 135,
    })
    //linija podaci o gradjaninu start

    page.drawLine({
        start: {
            x: 50,
            y: 520
        },
        end: {
            x: 500,
            y: 520
        }
    })
    page.drawText('Podaci o građaninu', {
        x: 50,
        y: 505,
        size: 10,
        font: customFont

    })
    page.drawLine({
        start: {
            x: 50,
            y: 500
        },
        end: {
            x: 500,
            y: 500
        }
    })

    //linija podaci o gradjaninu end

    //serija podataka o gradjaninu - start

    page.drawText('Prezime:', {
        x: 50,
        y: 480,
        size: 10,
        font: customFont

    })

    page.drawText(allData.personalData.Surname, {
        x: 185,
        y: 480,
        size: 10,
        font: customFont

    })
    page.drawText('Ime:', {
        x: 50,
        y: 460,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.GivenName, {
        x: 185,
        y: 460,
        size: 10,
        font: customFont

    })

    page.drawText('Ime jednog roditelja:', {
        x: 50,
        y: 440,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.ParentGivenName, {
        x: 185,
        y: 440,
        size: 10,
        font: customFont

    })
    page.drawText('Datum rođenja:', {
        x: 50,
        y: 420,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.DateOfBirth, {
        x: 185,
        y: 420,
        size: 10,
        font: customFont

    })
    page.drawText('Mesto rođenja, opština i', {
        x: 50,
        y: 400,
        size: 10,
        font: customFont
    })
    const fullBirthLocationData = `${allData.personalData.PlaceOfBirth}, ${allData.personalData.CommunityOfBirth}, ${allData.personalData.StateOfBirth}`;

    if (fullBirthLocationData.length > 50) {
        page.drawText(`${allData.personalData.PlaceOfBirth}, ${allData.personalData.CommunityOfBirth}`, {
            x: 185,
            y: 400,
            size: 10,
            font: customFont

        })
        page.drawText(`${allData.personalData.StateOfBirth}`, {
            x: 185,
            y: 380,
            size: 10,
            font: customFont

        })
    } else {
        page.drawText(fullBirthLocationData, {
            x: 185,
            y: 400,
            size: 10,
            font: customFont

        })
    }

    page.drawText('država:', {
        x: 50,
        y: 380,
        size: 10,
        font: customFont

    })


    page.drawText('Prebivaliste i adresa', {
        x: 50,
        y: 360,
        size: 10,
        font: customFont
    })

    page.drawText('stana:', {
        x: 50,
        y: 340,
        size: 10,
        font: customFont
    })

    const fullResidenceLocationData = `${allData.residenceData.Place}, ${allData.residenceData.Community}, ${allData.residenceData.Street} ${allData.residenceData.AddressNumber}${allData.residenceData.AddressLetter}/${allData.residenceData.AddressFloor}/${allData.residenceData.AddressApartmentNumber}`;

    if (fullResidenceLocationData.length > 50) {
        page.drawText(`${allData.residenceData.Place}, ${allData.residenceData.Community}`, {
            x: 185,
            y: 360,
            size: 10,
            font: customFont
        })
        page.drawText(`${allData.residenceData.Street} ${allData.residenceData.AddressNumber}${allData.residenceData.AddressLetter}/${allData.residenceData.AddressFloor}/${allData.residenceData.AddressApartmentNumber}`, {
            x: 185,
            y: 340,
            size: 10,
            font: customFont
        })
    } else {
        page.drawText(fullResidenceLocationData, {
            x: 185,
            y: 360,
            size: 10,
            font: customFont
        })
    }
    page.drawText('Datum promene adrese:', {
        x: 50,
        y: 320,
        size: 10,
        font: customFont

    })
    page.drawText(allData.residenceData.AddressDate, {
        x: 185,
        y: 320,
        size: 10,
        font: customFont

    })
    page.drawText('JMBG:', {
        x: 50,
        y: 300,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.PersonalNumber, {
        x: 185,
        y: 300,
        size: 10,
        font: customFont

    })
    page.drawText('Pol:', {
        x: 50,
        y: 280,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.Sex, {
        x: 185,
        y: 280,
        size: 10,
        font: customFont

    })
    //serija podataka o gradjaninu - end

    //linija podaci o dokumentu - start

    page.drawLine({
        start: {
            x: 50,
            y: 260
        },
        end: {
            x: 500,
            y: 260
        }
    })
    page.drawText('Podaci o dokumentu', {
        x: 50,
        y: 245,
        size: 10,
        font: customFont

    })
    page.drawLine({
        start: {
            x: 50,
            y: 240
        },
        end: {
            x: 500,
            y: 240
        }
    })

    //linija podaci o dokumentu - end

    //serija podataka o dokumentu - start
    page.drawText('Dokument izdaje:', {
        x: 50,
        y: 220,
        size: 10,
        font: customFont

    })

    page.drawText(allData.documentData.IssuingAuthority, {
        x: 185,
        y: 220,
        size: 10,
        font: customFont

    })
    page.drawText('Broj dokumenta:', {
        x: 50,
        y: 200,
        size: 10,
        font: customFont

    })
    page.drawText(allData.documentData.DocumentNumber, {
        x: 185,
        y: 200,
        size: 10,
        font: customFont

    })
    page.drawText('Datum izdavanja:', {
        x: 50,
        y: 180,
        size: 10,
        font: customFont

    })
    page.drawText(allData.documentData.IssuingDate, {
        x: 185,
        y: 180,
        size: 10,
        font: customFont

    })
    page.drawText('Važi do:', {
        x: 50,
        y: 160,
        size: 10,
        font: customFont

    })
    page.drawText(allData.documentData.ExpiryDate, {
        x: 185,
        y: 160,
        size: 10,
        font: customFont

    })
    //serija podataka o dokumentu - end

    //dve linije za datum stampe - start
    page.drawLine({
        start: {
            x: 50,
            y: 140
        },
        end: {
            x: 500,
            y: 140
        }
    })
    page.drawLine({
        start: {
            x: 50,
            y: 135
        },
        end: {
            x: 500,
            y: 135
        }
    })
    //dve linije za datum stampe - end

    //datum stampe - start
    page.drawText('Datum štampe:', {
        x: 50,
        y: 120,
        size: 10,
        font: customFont

    })

    page.drawText(getCurrentDate(), {
        x: 185,
        y: 120,
        size: 10,
        font: customFont

    })
    //datum stampe - end

    //linija za footer - start

    page.drawLine({
        start: {
            x: 50,
            y: 100
        },
        end: {
            x: 500,
            y: 100
        }
    })


    //text footer-a

    page.drawText('1. U čipu lične karte, podaci o imenu i prezimenu imaoca lične karte ispisani su na nacionalnom pismu onako kako su', {
        x: 50,
        y: 80,
        size: 7.5,
        font: customFont

    })
    page.drawText('ispisani na samom obrascu lične karte, dok su ostali podaci ispisani latiničkim pismom.', {
        x: 50,
        y: 70,
        size: 7.5,
        font: customFont

    })
    page.drawText('2. Ako se ime lica sastoji od dve reči čija je ukupna dužina između 20 i 30 karaktera ili prezimena od dve reči čija je', {
        x: 50,
        y: 60,
        size: 7.5,
        font: customFont

    })

    page.drawText('ukupna dužina između 30 i 36 karaktera, u čipu lične karte izdate pre 18.08.2014. godine, druga reč u imenu ili', {
        x: 50,
        y: 50,
        size: 7.5,
        font: customFont

    })

    page.drawText('prezimenu skraćuje se na prva dva karaketra.', {
        x: 50,
        y: 40,
        size: 7.5,
        font: customFont

    })

    page.drawLine({
        start: {
            x: 50,
            y: 30
        },
        end: {
            x: 500,
            y: 30
        }
    })

    return await pdfDoc.save()
}


function getCurrentDate() {
    // Create a new Date object
    const today = new Date();

// Get the day, month, and year from the Date object
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = today.getFullYear();

// Format the date as 'dd.mm.yyyy'
    return `${day}.${month}.${year}`;
}

async function printPdf() {
    const printWindow = new BrowserWindow({show: false});
    const base64PDF = allData.pdfBase64

    const pdfDataUrl = `data:application/pdf;base64,${base64PDF}`;

    try {
        await printWindow.loadURL(pdfDataUrl);


        await printWindow.webContents.executeJavaScript('setTimeout(()=>{ window.close() },30000)')
        await printWindow.webContents.executeJavaScript('window.print();');


    } catch (error) {
        console.error('Failed to load URL:', error);
    }


}


function uint8ArrayToBase64(uint8Array) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}


ipcMain.on('print-pdf', async () => {
    await printPdf();
})