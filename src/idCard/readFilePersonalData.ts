import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import {formatDateString} from "../utils/formateDateString";

export async function readFilePersonalData(reader, apu, protocol) {
    return new Promise((resolve, reject) => {

        reader.transmit(Buffer.from(apu), 256, protocol, async (err, data) => {

            if (err) {
                log.error('Error reading header:', err.message)
                return reject(err);

            }

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
                let apu;
                try {
                    apu = await buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)

                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)

                    return reject('apdu');

                }

                let data;
                try {

                    data = await transmitAsync(reader, protocol, apu)

                } catch (e) {
                    log.error('Error(', reader.name, '):', e.message)
                    return reject('error')

                }
                const rsp = data.subarray(0, data.length - 2)
                offset += rsp.length
                length -= rsp.length
                output.push(...rsp)

            }


            let parsedData
            try {
                parsedData = await parseTLV(Buffer.from(output))
            } catch (e) {
                log.error('Error(', reader.name, '):', e.message)

                return reject('ne radi')

            }

            const dataObject = {
                PersonalNumber: '',
                Surname: '',
                GivenName: '',
                ParentGivenName: '',
                Sex: '',
                PlaceOfBirth: '',
                CommunityOfBirth: '',
                StateOfBirth: '',
                DateOfBirth: '',

            }

            const PersonalNumber = {value: ''}
            await assignField(parsedData, 1558, PersonalNumber)
            log.info('PersonalNumber:', PersonalNumber.value)
            dataObject.PersonalNumber = PersonalNumber.value

            const Surname = {value: ''}
            await assignField(parsedData, 1559, Surname)

            log.info('Surname:', Surname.value)
            dataObject.Surname = Surname.value


            const GivenName = {value: ''}
            await assignField(parsedData, 1560, GivenName)

            log.info('GivenName:', GivenName.value)
            dataObject.GivenName = GivenName.value

            const ParentGivenName = {value: ''}
            await assignField(parsedData, 1561, ParentGivenName)
            log.info('ParentGivenName:', ParentGivenName.value)

            dataObject.ParentGivenName = ParentGivenName.value

            const Sex = {value: ''}
            await assignField(parsedData, 1562, Sex)
            log.info('Sex:', Sex.value)

            dataObject.Sex = Sex.value

            const PlaceOfBirth = {value: ''}
            await assignField(parsedData, 1563, PlaceOfBirth)
            log.info('PlaceOfBirth:', PlaceOfBirth.value)
            dataObject.PlaceOfBirth = PlaceOfBirth.value


            const CommunityOfBirth = {value: ''}
            await assignField(parsedData, 1564, CommunityOfBirth)
            log.info('CommunityOfBirth:', CommunityOfBirth.value)
            dataObject.CommunityOfBirth = CommunityOfBirth.value


            const StateOfBirth = {value: ''}
            await assignField(parsedData, 1565, StateOfBirth)
            dataObject.StateOfBirth = StateOfBirth.value
            log.info('StateOfBirth:', StateOfBirth.value)

            const DateOfBirth = {value: ''}
            await assignField(parsedData, 1566, DateOfBirth)
            dataObject.DateOfBirth = formatDateString(DateOfBirth.value)

            log.info('DateOfBirth:', DateOfBirth.value)

            return resolve(dataObject)
        })
    })

}