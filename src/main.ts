import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import {join} from 'path';
import pcsclite from 'pcsclite'
import {PDFDocument} from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit';
import Jimp from "jimp";
import * as fs from "fs";
import log from 'electron-log/main';
import {updateElectronApp, UpdateSourceType} from "update-electron-app";
import iconv from 'iconv-lite';
import {APOLLO_ATR, GEMALTO_ATR_1, GEMALTO_ATR_2, GEMALTO_ATR_3, GEMALTO_ATR_4, MEDICAL_ATR} from "./utils/constants";
import {testGemalto} from "./utils/testGemalto";
import {testMedCard} from "./utils/testMedCard";
import {handleIDCard} from "./idCard/handleIDCard";
import {downloadIdCardPdf} from "./idCard/downloadIdCardPdf";
import {CardData} from "./preload";
import {printIdCardPdf} from "./idCard/printIdCardPdf";
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

    console.log(app.isPackaged)
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools({
            mode: 'detach',
        });
    }

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

let pcsc;
let cardReader;
let cardType;
let allData: CardData;
// Function to determine the card type
async function determineCardType(smartCardAtr: Buffer, reader, protocol) {
    let card;
    let tempIdCard;
    let tempMedCard;

    log.info('Determining inserted card type')
    try {
        log.info('Testing is gemalto')

        await testGemalto(reader, protocol);

        log.info('Card determined - gemalto')

        tempIdCard = true;
    } catch (e) {
        log.info('Card not gemalto')
        tempIdCard = false;
    }
    try {
        log.info('Testing is med card')

        tempMedCard = await testMedCard(reader, protocol);

        if (tempMedCard) {
            log.info('Card determined - med card')
        } else {
            log.info('Card not med card')
        }

    } catch (e) {
        log.info('Card not med card')
        tempMedCard = false;
    }

    log.info('Checking smart card atr')
    if (smartCardAtr.equals(GEMALTO_ATR_1)) {
        log.info('Smart card atr detected: GEMALTO_ATR_1')

        log.info('Checking is card possible id card')

        if (tempIdCard) {
            log.info('Card is id card')

            card = 'ID_CARD'
        } else {
            log.info('Card is vehicle card')

            card = 'VEHICLE_CARD'
        }
    } else if (smartCardAtr.equals(GEMALTO_ATR_2)) {
        log.info('Smart card atr detected: GEMALTO_ATR_2')

        log.info('Checking is card possible med card or id card or vehicle card')

        if (tempMedCard) {
            log.info('Card is med card')

            card = 'MED_CARD'
        } else if (tempIdCard) {

            log.info('Card is id card')

            card = 'ID_CARD'
        } else {
            log.info('Card is vehicle card')

            card = 'VEHICLE_CARD'
        }
    } else if (smartCardAtr.equals(GEMALTO_ATR_3)) {
        log.info('Smart card atr detected: GEMALTO_ATR_3')

        log.info('Checking is card possible med card or id card or vehicle card')

        if (tempMedCard) {
            log.info('Card is med card')

            card = 'MED_CARD'
        } else if (tempIdCard) {

            log.info('Card is id card')

            card = 'ID_CARD'
        } else {
            log.info('Card is vehicle card')

            card = 'VEHICLE_CARD'
        }
    } else if (smartCardAtr.equals(GEMALTO_ATR_4)) {
        log.info('Smart card atr detected: GEMALTO_ATR_4')

        log.info('Checking is card possible med card or id card or vehicle card')

        if (tempMedCard) {
            log.info('Card is med card')

            card = 'MED_CARD'
        } else if (tempIdCard) {

            log.info('Card is id card')

            card = 'ID_CARD'
        } else {
            log.info('Card is vehicle card')

            card = 'VEHICLE_CARD'
        }
    } else if (smartCardAtr.equals(APOLLO_ATR)) {
        log.info('Smart card atr detected: APOLLO_ATR')

        log.info('Checking is card possible med card or id card or vehicle card')

        if (tempMedCard) {
            log.info('Card is med card')

            card = 'MED_CARD'
        } else if (tempIdCard) {

            log.info('Card is id card')

            card = 'ID_CARD'
        } else {
            log.info('Card is vehicle card')

            card = 'VEHICLE_CARD'
        }
    } else if (smartCardAtr.equals(MEDICAL_ATR)) {
        log.info('Smart card atr detected: MEDICAL_ATR')
        card = 'MED_CARD'
    } else {
        throw new Error(`Unknown card type`);
    }

    return card;
}

const initializeIDCardReader = async (browserWindow: BrowserWindow) => {

    log.info('Initializing card read')
    pcsc = await pcsclite()


    browserWindow.webContents.send('insert-card-reader-into-device');

    pcsc.on('reader', reader => {

        cardReader = reader;

        log.info('New reader detected', reader.name)

        reader.on('error', err => {
            log.error('Error(', reader.name, '):', err.message)
        })

        reader.on('status', (status) => {
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
                            return;
                        }
                    })
                } else if ((changes & reader.SCARD_STATE_PRESENT) && (status.state & reader.SCARD_STATE_PRESENT)) {
                    //emituj event loading
                    console.log('LOGUJEM STATUS')
                    console.log();
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
                            try {
                                cardType = await determineCardType(status.atr, reader, protocol)
                                if(cardType === 'ID_CARD'){

                                    try {
                                        allData = await handleIDCard(pcsc, reader, protocol, browserWindow)

                                        return;
                                    }catch (e){
                                        log.error('Error(', reader.name, '):', e)

                                        browserWindow.webContents.send('display-error');
                                        reader.close()
                                        pcsc.close()
                                        return;
                                    }

                                }else if(cardType === 'MED_CARD'){

                                }else{
                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                    return;
                                }
                            } catch (e) {
                                console.log(e);
                                browserWindow.webContents.send('display-error');
                                reader.close()
                                pcsc.close()
                                return;
                            }

                        }

                        // if (err) {

                        // } else {
                        //     log.info('Protocol(', reader.name, '):', protocol)
                        //
                        //     // Init card
                        //
                        //     const data = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x49, 0x44, 0x01])
                        //     let apu;
                        //     try {
                        //         apu = buildAPDU(0x00, 0xA4, 0x04, 0x00, data, 0)
                        //     } catch (e) {
                        //         log.error('Error(', reader.name, '):', err.message)
                        //
                        //         browserWindow.webContents.send('display-error');
                        //         reader.close()
                        //         pcsc.close()
                        //         return;
                        //     }
                        //
                        //     reader.transmit(apu, 256, protocol, async (err, data) => {
                        //         if (err) {
                        //             log.error('Error(', reader.name, '):', err.message)
                        //
                        //             browserWindow.webContents.send('display-error');
                        //             reader.close()
                        //             pcsc.close()
                        //             return;
                        //         }
                        //
                        //         if(cardType === 'ID_CARD'){
                        //             //PERSONAL CARD
                        //             const cardDataLocation = Buffer.from([0x0F, 0x02])
                        //
                        //             let cardDataLocationApdu
                        //             try {
                        //                 cardDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, cardDataLocation, 4)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //             try {
                        //                 await generateCardData(reader, protocol, cardDataLocation, cardDataLocationApdu, 'DOCUMENT')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //
                        //             const personalDataLocation = Buffer.from([0x0F, 0x03])
                        //             let personalDataLocationApdu;
                        //             try {
                        //                 personalDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, personalDataLocation, 4)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //                 await generateCardData(reader, protocol, personalDataLocation, personalDataLocationApdu, 'PERSONAL')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //
                        //             const residenceDataLocation = Buffer.from([0x0F, 0x04])
                        //
                        //             let residenceDataLocationApdu;
                        //             try {
                        //                 residenceDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, residenceDataLocation, 4)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //                 await generateCardData(reader, protocol, residenceDataLocation, residenceDataLocationApdu, 'RESIDENCE')
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             const imageDataLocation = Buffer.from([0x0F, 0x06])
                        //
                        //             let imageDataLocationApdu;
                        //
                        //             try {
                        //                 imageDataLocationApdu = buildAPDU(0x00, 0xA4, 0x08, 0x00, imageDataLocation, 4)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //                 await generateCardData(reader, protocol, imageDataLocation, imageDataLocationApdu, 'IMAGE')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //             }
                        //
                        //             try {
                        //                 allData.pdf = await createPdf();
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //                 allData.pdfBase64 = uint8ArrayToBase64(allData.pdf);
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             reader.close()
                        //             pcsc.close()
                        //             browserWindow.webContents.send('card-data-loaded', allData);
                        //         }else if(cardType === 'MED_CARD'){
                        //             const s1 = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x56, 0x53, 0x5A, 0x4B, 0x01]);
                        //             const apu = buildAPDU(0x00, 0xA4, 0x04, 0x00, s1, 0)
                        //
                        //             let e;
                        //             await transmitAsync(reader, protocol, apu)
                        //                 .catch(err => {
                        //                     e = err;
                        //                 })
                        //
                        //             if (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             const medicalCardDataFileLocation = Buffer.from([0x0D, 0x01]);
                        //
                        //             let medicalCardDataFileLocationApdu;
                        //             try {
                        //                 medicalCardDataFileLocationApdu = buildAPDU(0x00, 0xA4, 0x00, 0x00, medicalCardDataFileLocation, 0)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //
                        //                 await generateCardData(reader, protocol, medicalCardDataFileLocation, medicalCardDataFileLocationApdu, 'MEDICAL_CARD_DATA')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //
                        //             const medicalCardPersonalDataFileLocation = Buffer.from([0x0D, 0x02]);
                        //
                        //             let medicalCardPersonalDataFileLocationApdu;
                        //             try {
                        //                 medicalCardPersonalDataFileLocationApdu = buildAPDU(0x00, 0xA4, 0x00, 0x00, medicalCardPersonalDataFileLocation, 0)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //
                        //                 await generateCardData(reader, protocol, medicalCardPersonalDataFileLocation, medicalCardPersonalDataFileLocationApdu, 'MEDICAL_PERSONAL_DATA')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //
                        //             const medicalCardValidityDataFileLocation = Buffer.from([0x0D, 0x03]);
                        //
                        //             let medicalCardValidityDataFileLocationApdu;
                        //             try {
                        //                 medicalCardValidityDataFileLocationApdu = buildAPDU(0x00, 0xA4, 0x00, 0x00, medicalCardValidityDataFileLocation, 0)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //
                        //                 await generateCardData(reader, protocol, medicalCardValidityDataFileLocation, medicalCardValidityDataFileLocationApdu, 'MEDICAL_VALIDITY_DATA')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //
                        //             const medicalCardResidenceAndInsuranceDataFileLocation = Buffer.from([0x0D, 0x04]);
                        //
                        //             let medicalCardResidenceAndInsuranceDataFileLocationApdu;
                        //             try {
                        //                 medicalCardResidenceAndInsuranceDataFileLocationApdu = buildAPDU(0x00, 0xA4, 0x00, 0x00, medicalCardResidenceAndInsuranceDataFileLocation, 0)
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //             try {
                        //
                        //                 await generateCardData(reader, protocol, medicalCardResidenceAndInsuranceDataFileLocation, medicalCardResidenceAndInsuranceDataFileLocationApdu, 'MEDICAL_RESIDENCE_AND_INSURANCE_DATA')
                        //
                        //             } catch (e) {
                        //                 log.error('Error(', reader.name, '):', e.message)
                        //
                        //                 browserWindow.webContents.send('display-error');
                        //                 reader.close()
                        //                 pcsc.close()
                        //                 return;
                        //             }
                        //
                        //         }else{
                        //             browserWindow.webContents.send('display-error');
                        //             reader.close()
                        //             pcsc.close()
                        //             return;
                        //         }
                        //
                        //     })
                        //
                        // }
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
                    return reject(err) // Reject promise on error
                } else {
                    return resolve(data) // Resolve with data on success
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

                    reject(err)
                    return;
                }

                const readSize = Math.min(4, 0xFF)
                let apu
                try {
                    apu = buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject(err);
                    return;
                }

                //read file
                if (dataType === 'DOCUMENT') {
                    log.info('udje document')
                    let fileDocumentData;
                    try {
                        let error = null
                        fileDocumentData = await readFileDocumentData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)
                            throw new Error(error);
                        }

                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e)
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'PERSONAL') {
                    let fileDocumentData;
                    let error = null

                    log.info('udje licni podaci')

                    try {
                        fileDocumentData = await readFilePersonalData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'RESIDENCE') {
                    let fileDocumentData;
                    let error = null;
                    log.info('udje podaci prebivalista')

                    try {
                        fileDocumentData = await readFileResidenceData(reader, apu, protocol)
                            .catch(err => error = err)


                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'IMAGE') {
                    log.info('udje slika')

                    let fileDocumentData;
                    let error;
                    try {
                        fileDocumentData = await readFileImageData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(fileDocumentData)
                } else if (dataType === 'MEDICAL_CARD_DATA') {

                    let medicalCardData;
                    let error;
                    try {
                        medicalCardData = await readMedicalCardData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(medicalCardData)
                } else if (dataType === 'MEDICAL_PERSONAL_DATA') {
                    let medicalPersonalData;
                    let error;
                    try {
                        medicalPersonalData = await readMedicalPersonalData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(medicalPersonalData)
                } else if (dataType === 'MEDICAL_VALIDITY_DATA') {
                    let medicalValidityData;
                    let error;
                    try {
                        medicalValidityData = await readMedicalValidityData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(medicalValidityData)
                } else if (dataType === 'MEDICAL_RESIDENCE_AND_INSURANCE_DATA') {
                    let medicalResidenceAndInsuranceData;
                    let error;
                    try {
                        medicalResidenceAndInsuranceData = await readMedicalResidenceAndValidityData(reader, apu, protocol)
                            .catch(err => error = err)

                        if (error) {
                            log.error(error)

                            throw new Error(error);
                        }
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e);
                        return;
                    }
                    resolve(medicalResidenceAndInsuranceData)
                }
            })
        })
    }

    function readFileDocumentData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {

            reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {

                if (err) {
                    log.error('Error reading header:', err.message)
                    reject(err);
                    return
                }

                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                log.info('ovo je offset')
                log.info(offset)
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

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
                    log.info({readSize, apu})

                    let data;
                    try {

                        data = await transmitAsync(reader, protocol, apu)
                        console.log('ovde')

                    } catch (e) {
                        console.log('ovde 2')
                        log.error('Error(', reader.name, '):', e.message)
                        reject('error')
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
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
                    reject(err);
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;
                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize);
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    log.info({readSize, apu})

                    let data;

                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
                let parsedData;
                try {
                    parsedData = parseTLV(Buffer.from(output));
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    resolve(e.message);
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
                    reject(err);
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
                let parsedData;

                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject(e.message);
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
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
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

                        reject(e.message);
                        return;
                    }
                    // log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
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

    function readMedicalCardData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject(err);
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
                let parsedData;

                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject(e.message);
                    return;
                }


                const dataArray = []

                const InsurerName = {value: ''}
                descramble(parsedData, 1553)
                assignField(parsedData, 1553, InsurerName)
                dataArray.push({InsurerName: InsurerName.value})

                const InsurerID = {value: ''}
                assignField(parsedData, 1554, InsurerID)
                dataArray.push({InsurerID: InsurerID.value})

                const CardId = {value: ''}
                assignField(parsedData, 1555, CardId)
                dataArray.push({CardId: CardId.value})


                const CardIssueDate = {value: ''}
                assignField(parsedData, 1557, CardIssueDate)
                dataArray.push({CardIssueDate: formatDateString(CardIssueDate.value)})


                const CardExpiryDate = {value: ''}
                assignField(parsedData, 1558, CardExpiryDate)
                dataArray.push({CardExpiryDate: formatDateString(CardExpiryDate.value)})


                const Language = {value: ''}
                assignField(parsedData, 1560, Language)
                dataArray.push({Language: Language.value})

                console.log(dataArray);
                resolve()
            })
        })

    }

    function readMedicalPersonalData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject(err);
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
                let parsedData;

                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject(e.message);
                    return;
                }


                const dataArray = []


                const SurnameCyrl = {value: ''}
                descramble(parsedData, 1570)
                assignField(parsedData, 1570, SurnameCyrl)
                dataArray.push({SurnameCyrl: SurnameCyrl.value})


                const Surname = {value: ''}
                descramble(parsedData, 1571)
                assignField(parsedData, 1571, Surname)
                dataArray.push({Surname: Surname.value})


                const GivenNameCyrl = {value: ''}
                descramble(parsedData, 1572)
                assignField(parsedData, 1572, GivenNameCyrl)
                dataArray.push({GivenNameCyrl: GivenNameCyrl.value})


                const GivenName = {value: ''}
                descramble(parsedData, 1573)
                assignField(parsedData, 1573, GivenName)
                dataArray.push({GivenName: GivenName.value})


                const DateOfBirth = {value: ''}
                assignField(parsedData, 1574, DateOfBirth)
                dataArray.push({DateOfBirth: formatDateString(DateOfBirth.value)})


                const InsuranceNumber = {value: ''}
                assignField(parsedData, 1569, InsuranceNumber)
                dataArray.push({InsuranceNumber: InsuranceNumber.value})

                console.log(dataArray);
                resolve()
            })
        })

    }

    function readMedicalValidityData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject(err);
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
                let parsedData;

                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject(e.message);
                    return;
                }


                const dataArray = []

                const ValidUntil = {value: ''}
                assignField(parsedData, 1586, ValidUntil)
                dataArray.push({ValidUntil: formatDateString(ValidUntil.value)})


                const PermanentlyValid = {value: ''}
                assignBoolField(parsedData, 1587, PermanentlyValid)
                dataArray.push({ValidUntil: PermanentlyValid.value})

                console.log(dataArray);
                resolve()
            })
        })

    }

    function readMedicalResidenceAndValidityData(reader, apu, protocol) {
        return new Promise((resolve, reject) => {
            reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
                if (err) {
                    log.error('Error reading header:', err.message)
                    reject(err);
                    return
                }
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    reject('error');
                    return
                }
                log.info('ovo je offset');
                log.info(offset)
                let length = rsp.readUInt16LE(2)


                log.info('Data read:', length)

                const output = []
                while (length > 0) {
                    log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    let apu;

                    try {
                        apu = buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    log.info({readSize, apu})

                    let data;
                    try {
                        data = await transmitAsync(reader, protocol, apu)
                    } catch (e) {
                        log.error('Error(', reader.name, '):', e.message)

                        reject(e.message);
                        return;
                    }
                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                log.info('ovo je output')
                log.info(output)
                let parsedData;

                try {
                    parsedData = parseTLV(Buffer.from(output))
                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    reject(e.message);
                    return;
                }


                const dataArray = []


                const ParentNameCyrl = {value: ''}
                descramble(parsedData, 1601)
                assignField(parsedData, 1601, ParentNameCyrl)
                dataArray.push({ParentNameCyrl: ParentNameCyrl.value})


                const ParentName = {value: ''}
                descramble(parsedData, 1602)
                assignField(parsedData, 1602, ParentName)
                dataArray.push({ParentName: ParentNameCyrl.value})


                if (parsedData[1603].toString() === "01") {
                    dataArray.push({Sex: 'Мушко'})
                } else {
                    dataArray.push({Sex: 'Женско'})
                }


                const PersonalNumber = {value: ''}
                assignField(parsedData, 1604, PersonalNumber)
                dataArray.push({PersonalNumber: PersonalNumber.value})


                const AddressStreet = {value: ''}
                descramble(parsedData, 1605)
                assignField(parsedData, 1605, AddressStreet)
                dataArray.push({AddressStreet: AddressStreet.value})


                const AddressMunicipality = {value: ''}
                descramble(parsedData, 1607)
                assignField(parsedData, 1607, AddressMunicipality)
                dataArray.push({AddressMunicipality: AddressMunicipality.value})


                const AddressTown = {value: ''}
                descramble(parsedData, 1608)
                assignField(parsedData, 1608, AddressTown)
                dataArray.push({AddressTown: AddressTown.value})


                const AddressNumber = {value: ''}
                descramble(parsedData, 1610)
                assignField(parsedData, 1610, AddressNumber)
                dataArray.push({AddressNumber: AddressNumber.value})


                const AddressApartmentNumber = {value: ''}
                descramble(parsedData, 1612)
                assignField(parsedData, 1612, AddressApartmentNumber)
                dataArray.push({AddressApartmentNumber: AddressApartmentNumber.value})


                const InsuranceReason = {value: ''}
                assignField(parsedData, 1614, InsuranceReason)
                dataArray.push({InsuranceReason: InsuranceReason.value})


                const InsuranceDescription = {value: ''}
                descramble(parsedData, 1615)
                assignField(parsedData, 1615, InsuranceDescription)
                dataArray.push({InsuranceDescription: InsuranceDescription.value})


                const InsuranceHolderRelation = {value: ''}
                descramble(parsedData, 1616)
                assignField(parsedData, 1616, InsuranceHolderRelation)
                dataArray.push({InsuranceHolderRelation: InsuranceHolderRelation.value})


                const InsuranceHolderIsFamilyMember = {value: ''}
                assignBoolField(parsedData, 1617, InsuranceHolderIsFamilyMember)
                dataArray.push({InsuranceHolderIsFamilyMember: InsuranceHolderIsFamilyMember.value})


                const InsuranceHolderPersonalNumber = {value: ''}
                assignField(parsedData, 1618, InsuranceHolderPersonalNumber)
                dataArray.push({InsuranceHolderPersonalNumber: InsuranceHolderPersonalNumber.value})


                const InsuranceHolderInsuranceNumber = {value: ''}
                assignField(parsedData, 1619, InsuranceHolderInsuranceNumber)
                dataArray.push({InsuranceHolderInsuranceNumber: InsuranceHolderInsuranceNumber.value})


                const InsuranceHolderSurnameCyrl = {value: ''}
                descramble(parsedData, 1620)
                assignField(parsedData, 1620, InsuranceHolderSurnameCyrl)
                dataArray.push({InsuranceHolderSurnameCyrl: InsuranceHolderSurnameCyrl.value})


                const InsuranceHolderSurname = {value: ''}
                descramble(parsedData, 1621)
                assignField(parsedData, 1621, InsuranceHolderSurname)
                dataArray.push({InsuranceHolderSurname: InsuranceHolderSurname.value})


                const InsuranceHolderNameCyrl = {value: ''}
                descramble(parsedData, 1622)
                assignField(parsedData, 1622, InsuranceHolderNameCyrl)
                dataArray.push({InsuranceHolderNameCyrl: InsuranceHolderNameCyrl.value})


                const InsuranceHolderName = {value: ''}
                descramble(parsedData, 1623)
                assignField(parsedData, 1623, InsuranceHolderName)
                dataArray.push({InsuranceHolderName: InsuranceHolderName.value})

                const InsuranceStartDate = {value: ''}
                assignField(parsedData, 1624, InsuranceStartDate)
                dataArray.push({InsuranceStartDate: formatDateString(InsuranceStartDate.value)})


                const AddressState = {value: ''}
                descramble(parsedData, 1626)
                assignField(parsedData, 1626, AddressState)
                dataArray.push({AddressState: AddressState.value})


                const ObligeeName = {value: ''}
                descramble(parsedData, 1630)
                assignField(parsedData, 1630, ObligeeName)
                dataArray.push({ObligeeName: ObligeeName.value})


                const ObligeePlace = {value: ''}
                descramble(parsedData, 1631)
                assignField(parsedData, 1631, ObligeePlace)
                dataArray.push({ObligeePlace: ObligeePlace.value})


                const ObligeeIdNumber = {value: ''}
                assignField(parsedData, 1632, ObligeeIdNumber)
                dataArray.push({ObligeeIdNumber: ObligeeIdNumber.value})


                if (ObligeeIdNumber.value.length === 0) {
                    assignField(parsedData, 1633, ObligeeIdNumber.value)
                    dataArray.push({ObligeeIdNumber: ObligeeIdNumber.value})

                }

                const ObligeeActivity = {value: ''}
                assignField(parsedData, 1634, ObligeeActivity)
                dataArray.push({ObligeeActivity: ObligeeActivity.value})

                console.log(dataArray)
                resolve()
            })
        })

    }

    function descramble(fields, tag) {
        const bs = fields[tag];
        if (bs) {
            try {
                // Decode the UTF-16 (LE) encoded buffer
                const utf8 = iconv.decode(bs, 'utf16-le');
                fields[tag] = Buffer.from(utf8, 'utf8');
                return;
            } catch (err) {
                // Handle the error if needed
            }
        }

        // If decoding fails, set an empty buffer
        fields[tag] = Buffer.from('');
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

    function assignBoolField(fields, tag, target) {
        const val = fields[tag];
        if (val && val.length === 1 && val[0] === 0x31) {
            target.value = true;
        } else {
            target.value = false;
        }
    }


}

ipcMain.on('cancel-card-reader', () => {
    cancelCardRead();
})
const cancelCardRead = () => {
    if (pcsc) {
        pcsc.close();
    }
    if (cardReader) {
        cardReader.close()
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

ipcMain.on('download-pdf', async (event) => {
    const browserWindow = BrowserWindow.fromWebContents(event.sender);
    await downloadIdCardPdf(browserWindow, allData.personalData.GivenName, allData.personalData.Surname, allData.pdf)

})



ipcMain.on('print-pdf', async () => {
    await printIdCardPdf(allData.pdfBase64);
})