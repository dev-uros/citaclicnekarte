import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";
import {readFileResidencelData} from "./readFileResidencelData";


export async function handleResidenceData(pcsc, reader, protocol) {
    const residenceDataLocation = Buffer.from([0x0F, 0x04])

    const residenceDataLocationApdu = await buildAPDU(0x00, 0xA4, 0x08, 0x00, residenceDataLocation, 4)

    //select file

    await selectFile(reader, protocol, residenceDataLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)

    //read file
    console.log('dodjem do generisanja personal data')
    console.log('LOGUJEM NIZ Residence DATA')

    return await readFileResidencelData(reader, apu, protocol);


}