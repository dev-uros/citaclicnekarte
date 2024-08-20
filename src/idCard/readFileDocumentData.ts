import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import {formatDateString} from "../utils/formateDateString";

export async function readFileDocumentData(reader, apu, protocol) {
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
                    DocumentNumber: '',
                    DocumentType: '',
                    DocumentSerialNumber: '',
                    IssuingDate: '',
                    ExpiryDate: '',
                    IssuingAuthority:''
                }

                const DocumentNumber = {value: ''}
                await assignField(parsedData, 1546, DocumentNumber)
                log.info('DocumentNumber:', DocumentNumber.value)
                dataObject.DocumentNumber = DocumentNumber.value

                const DocumentType = {value: ''}
                await assignField(parsedData, 1547, DocumentType)
                log.info('DocumentType:', DocumentType.value)
                dataObject.DocumentType = DocumentType.value


                const DocumentSerialNumber = {value: ''}
                await assignField(parsedData, 1548, DocumentSerialNumber)
                log.info('DocumentSerialNumber:', DocumentSerialNumber.value)
                dataObject.DocumentSerialNumber = DocumentSerialNumber.value

                const IssuingDate = {value: ''}
                await assignField(parsedData, 1549, IssuingDate)
                log.info('IssuingDate:', formatDateString(IssuingDate.value))
                dataObject.IssuingDate = formatDateString(IssuingDate.value)

                const ExpiryDate = {value: ''}
                await assignField(parsedData, 1550, ExpiryDate)
                log.info('ExpiryDate:', formatDateString(ExpiryDate.value))
                dataObject.ExpiryDate = formatDateString(ExpiryDate.value)


                const IssuingAuthority = {value: ''}
                await assignField(parsedData, 1551, IssuingAuthority)
                log.info('IssuingAuthority:', IssuingAuthority.value)
                dataObject.IssuingAuthority = IssuingAuthority.value

                return resolve(dataObject)
            }catch (e){
                return reject(e);
            }

        })
    })

}