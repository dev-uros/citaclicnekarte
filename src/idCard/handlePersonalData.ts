import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";


export async function handlePersonalData(pcsc, reader, protocol, browserWindow) {
    const personalDataLocation = Buffer.from([0x0F, 0x03])

    let personalDataLocationApdu;
    try {
        personalDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, personalDataLocation, 4)
    } catch (e) {
        log.error('Error(', reader.name, '):', e.message)

        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }
    //select file

    try {
        await selectFile(reader, protocol, personalDataLocationApdu)
    } catch (e) {
        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }


    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    let apu
    try {
        apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)
    } catch (e) {
        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

    //read file
    try {

        console.log('dodjem do generisanja personal data')
        console.log('LOGUJEM NIZ PERSONAL DATA')

        return await readFilePersonalData(reader, apu, protocol);

    } catch (e) {
        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

}