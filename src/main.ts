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
import {handleMedCard} from "./medCard/handleMedCard";
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
                            cardType = await determineCardType(status.atr, reader, protocol)
                            console.log('card type')
                            console.log(cardType)
                            if (cardType === 'ID_CARD') {
                                try {
                                    allData = await handleIDCard(pcsc, reader, protocol, browserWindow)
                                } catch (e) {
                                    log.error('usao u error')
                                    log.error(e);
                                    log.error('Error(', reader.name, '):', e)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                }
                                return;
                            }

                            if (cardType === 'MED_CARD') {
                                try {
                                    allData = await handleMedCard(pcsc, reader, protocol, browserWindow)
                                } catch (e) {
                                    log.error('usao u error')
                                    log.error(e);
                                    log.error('Error(', reader.name, '):', e)

                                    browserWindow.webContents.send('display-error');
                                    reader.close()
                                    pcsc.close()
                                }
                                return;
                            }
                            browserWindow.webContents.send('display-error');
                            reader.close()
                            pcsc.close()
                            return;

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

    })


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
    await downloadIdCardPdf(browserWindow, allData.personalData.GivenName, allData.personalData.Surname, allData.pdf as Uint8Array)

})


ipcMain.on('print-pdf', async () => {
    await printIdCardPdf(allData.pdfBase64);
})