import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFileDocumentData} from "./readFileDocumentData";


export async function handleCardData(pcsc, reader, protocol) {
    const cardDataLocation = Buffer.from([0x0F, 0x02])

    const cardDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, cardDataLocation, 4)

    //select file

    await selectFile(reader, protocol, cardDataLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)

    //read file
    return await readFileDocumentData(reader, apu, protocol);


}