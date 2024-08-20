import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";
import {readFileResidencelData} from "./readFileResidencelData";


export async function handleResidenceData(pcsc, reader, protocol, browserWindow) {
    const residenceDataLocation = Buffer.from([0x0F, 0x04])

    let residenceDataLocationApdu;
    try {
        residenceDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, residenceDataLocation, 4)
    } catch (e) {
        log.error('Error(', reader.name, '):', e.message)

        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }
    //select file

    try {
        await selectFile(reader, protocol, residenceDataLocationApdu)
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
        console.log('LOGUJEM NIZ Residence DATA')

        return await readFileResidencelData(reader, apu, protocol);

    } catch (e) {
        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

}