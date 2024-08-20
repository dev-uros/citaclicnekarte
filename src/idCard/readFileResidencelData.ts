import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import {formatDateString} from "../utils/formateDateString";

export async function readFileResidencelData(reader, apu, protocol) {
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
                State: '',
                Community: '',
                Place: '',
                Street: '',
                AddressNumber: '',
                AddressLetter: '',
                AddressEntrance: '',
                AddressFloor: '',
                AddressApartmentNumber: '',
                AddressDate: ''
            }

            const State = {value: ''}
            await assignField(parsedData, 1568, State)
            log.info('State:', State.value)
            dataObject.State = State.value

            const Community = {value: ''}
            await assignField(parsedData, 1569, Community)
            log.info('Community:', Community.value)
            dataObject.Community = Community.value



            const Place = {value: ''}
            await assignField(parsedData, 1570, Place)
            log.info('Place:', Place.value)
            dataObject.Place = Place.value


            const Street = {value: ''}
            await assignField(parsedData, 1571, Street)
            log.info('Street:', Street.value)
            dataObject.Street = Street.value

            const AddressNumber = {value: ''}
            await assignField(parsedData, 1572, AddressNumber)
            log.info('AddressNumber:', AddressNumber.value)
            dataObject.AddressNumber = AddressNumber.value


            const AddressLetter = {value: ''}
            await assignField(parsedData, 1573, AddressLetter)
            log.info('AddressLetter:', AddressLetter.value)
            dataObject.AddressLetter = AddressLetter.value


            const AddressEntrance = {value: ''}
            await assignField(parsedData, 1574, AddressEntrance)
            log.info('AddressEntrance:', AddressEntrance.value)
            dataObject.AddressEntrance = AddressEntrance.value


            const AddressFloor = {value: ''}
            await assignField(parsedData, 1575, AddressFloor)
            log.info('AddressFloor:', AddressFloor.value)
            dataObject.AddressFloor = AddressFloor.value

            const AddressApartmentNumber = {value: ''}
            await assignField(parsedData, 1578, AddressApartmentNumber)
            log.info('AddressApartmentNumber:', AddressApartmentNumber.value)
            dataObject.AddressApartmentNumber = AddressApartmentNumber.value


            const AddressDate = {value: ''}
            await assignField(parsedData, 1580, AddressDate)
            log.info('AddressDate:',  AddressDate.value === '01010001' ? 'NEDOSTUPAN' : formatDateString(AddressDate.value))
            dataObject.AddressDate = AddressDate.value === '01010001' ? 'NEDOSTUPAN' : formatDateString(AddressDate.value)


            return resolve(dataObject)
        })
    })

}