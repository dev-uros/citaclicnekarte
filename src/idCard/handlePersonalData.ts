import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";


export async function handlePersonalData(pcsc, reader, protocol) {
    const personalDataLocation = Buffer.from([0x0F, 0x03])

    const personalDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, personalDataLocation, 4)

    //select file

    await selectFile(reader, protocol, personalDataLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)


    //read file

    console.log('dodjem do generisanja personal data')
    console.log('LOGUJEM NIZ PERSONAL DATA')

    return await readFilePersonalData(reader, apu, protocol);


}