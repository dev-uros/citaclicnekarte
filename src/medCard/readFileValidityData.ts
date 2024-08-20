import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import {formatDateString} from "../utils/formateDateString";
import {descramble} from "../utils/descramble";
import {assignBoolField} from "../utils/assignBoolField";

export async function readFileValidityData(reader, apu, protocol) {
    return new Promise((resolve, reject) => {

        reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {

            if (err) {
                log.error('Error reading header:', err.message)
                return reject(err);

            }

            try {
                const rsp = data.subarray(0, data.length - 2)
                let offset = rsp.length
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
                    ValidUntil: '',
                    PermanentlyValid: '',
                }



                const ValidUntil = {value: ''}
                await assignField(parsedData, 1586, ValidUntil)
                dataObject.ValidUntil = formatDateString(ValidUntil.value)


                const PermanentlyValid = {value: ''}
                assignBoolField(parsedData, 1587, PermanentlyValid)
                dataObject.PermanentlyValid = PermanentlyValid.value

                return resolve(dataObject)
            }catch (e){
                return reject(e);
            }

        })
    })

}