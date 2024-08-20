import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import {formatDateString} from "../utils/formateDateString";
import {descramble} from "../utils/descramble";

export async function readFilePersonalData(reader, apu, protocol) {
    return new Promise((resolve, reject) => {

        reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {

            if (err) {
                log.error('Error reading header:', err.message)
                return reject(err);

            }

            try {
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
                log.info('ovo je offset')
                log.info(offset)
                if (offset < 3) {
                    log.error('Offset too short:', offset)
                    return reject('Offset too short:' + offset);

                }
                let length = rsp.readUInt16LE(2)


                const output = []
                while (length > 0) {
                    const readSize = Math.min(length, 0xFF)
                    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)


                    const data = await transmitAsync(reader, protocol, apu)


                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }


                const parsedData = await parseTLV(Buffer.from(output))


                const dataObject = {
                    SurnameCyrl: '',
                    Surname: '',
                    GivenNameCyrl: '',
                    GivenName: '',
                    DateOfBirth: '',
                    InsuranceNumber: '',
                }

                const SurnameCyrl = {value: ''}
                await descramble(parsedData, 1570)
                await assignField(parsedData, 1570, SurnameCyrl)
                dataObject.SurnameCyrl = SurnameCyrl.value


                const Surname = {value: ''}
                await descramble(parsedData, 1571)
                await assignField(parsedData, 1571, Surname)
                dataObject.Surname = Surname.value



                const GivenNameCyrl = {value: ''}
                await descramble(parsedData, 1572)
                await assignField(parsedData, 1572, GivenNameCyrl)
                dataObject.GivenNameCyrl = GivenNameCyrl.value


                const GivenName = {value: ''}
                await descramble(parsedData, 1573)
                await assignField(parsedData, 1573, GivenName)
                dataObject.GivenName = GivenName.value


                const DateOfBirth = {value: ''}
                await assignField(parsedData, 1574, DateOfBirth)
                dataObject.DateOfBirth = formatDateString(DateOfBirth.value)


                const InsuranceNumber = {value: ''}
                await assignField(parsedData, 1569, InsuranceNumber)
                dataObject.InsuranceNumber = InsuranceNumber.value


                return resolve(dataObject)
            } catch (e) {
                return reject(e);
            }

        })
    })

}