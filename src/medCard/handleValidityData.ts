import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";
import {readFileValidityData} from "./readFileValidityData";


export async function handleValidityData(pcsc, reader, protocol) {
    const validityDataLocation = Buffer.from([0x0D, 0x03])

    const validityDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x00, 0x00, validityDataLocation, 0)

    //select file

    await selectFile(reader, protocol, validityDataLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)


    //read file

    console.log('dodjem do generisanja personal data')
    console.log('LOGUJEM NIZ PERSONAL DATA')

    return await readFileValidityData(reader, apu, protocol);


}