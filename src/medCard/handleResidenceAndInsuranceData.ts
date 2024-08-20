import {buildAPDU} from "../utils/buildApdu";
import log from "electron-log/main";
import {selectFile} from "./selectFile";
import {readFilePersonalData} from "./readFilePersonalData";
import {readFileResidenceAndInsuranceData} from "./readFileResidenceAndInsuranceData";


export async function handleResidenceAndInsuranceData(pcsc, reader, protocol) {
    const residenceAndInsuranceLocation = Buffer.from([0x0D, 0x04])

    const residenceAndInsuranceLocationApdu = await buildAPDU(0x00, 0xA4, 0x00, 0x00, residenceAndInsuranceLocation, 0)

    //select file

    await selectFile(reader, protocol, residenceAndInsuranceLocationApdu)

    //generate read file apu
    const readSize = Math.min(4, 0xFF)
    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)


    //read file

    console.log('dodjem do generisanja personal data')
    console.log('LOGUJEM NIZ PERSONAL DATA')

    return await readFileResidenceAndInsuranceData(reader, apu, protocol);


}