import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFileDocumentData} from "./readFileDocumentData";


export async function handleCardData(pcsc, reader, protocol, browserWindow) {
    const cardDataLocation = Buffer.from([0x0F, 0x02])

    let cardDataLocationApdu
    try {
        cardDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, cardDataLocation, 4)
    } catch (e) {
        log.error('Error(', reader.name, '):', e.message)

        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }
    //select file

    try {
        await selectFile(reader, protocol, cardDataLocationApdu)
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
        console.log('LOGUJEM NIZ CARD DATA')
        return await readFileDocumentData(reader, apu, protocol);

    } catch (e) {
        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

}