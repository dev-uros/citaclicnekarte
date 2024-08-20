import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import {formatDateString} from "../utils/formateDateString";
import {descramble} from "../utils/descramble";
import {assignBoolField} from "../utils/assignBoolField";

export async function readFileResidenceAndInsuranceData(reader, apu, protocol) {
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
                    ParentNameCyrl: '',
                    ParentName: '',
                    Sex: '',
                    PersonalNumber: '',
                    AddressStreet: '',
                    AddressMunicipality: '',
                    AddressTown: '',
                    AddressNumber: '',
                    AddressApartmentNumber: '',
                    InsuranceReason: '',
                    InsuranceDescription: '',
                    InsuranceHolderRelation: '',
                    InsuranceHolderIsFamilyMember: '',
                    InsuranceHolderPersonalNumber: '',
                    InsuranceHolderInsuranceNumber: '',
                    InsuranceHolderSurnameCyrl: '',
                    InsuranceHolderSurname: '',
                    InsuranceHolderNameCyrl: '',
                    InsuranceHolderName: '',
                    InsuranceStartDate: '',
                    AddressState: '',
                    ObligeeName: '',
                    ObligeePlace: '',
                    ObligeeIdNumber: '',
                    ObligeeActivity: '',
                }



                const ParentNameCyrl = {value: ''}
                await descramble(parsedData, 1601)
                await assignField(parsedData, 1601, ParentNameCyrl)
                dataObject.ParentNameCyrl = ParentNameCyrl.value


                const ParentName = {value: ''}
                await descramble(parsedData, 1602)
                await assignField(parsedData, 1602, ParentName)
                dataObject.ParentName = ParentName.value



                if (parsedData[1603].toString() === "01") {
                    dataObject.Sex = 'Мушко'

                } else {
                    dataObject.Sex = 'Женско'
                }


                const PersonalNumber = {value: ''}
                await assignField(parsedData, 1604, PersonalNumber)
                dataObject.PersonalNumber = PersonalNumber.value


                const AddressStreet = {value: ''}
                await descramble(parsedData, 1605)
                await assignField(parsedData, 1605, AddressStreet)
                dataObject.AddressStreet = AddressStreet.value


                const AddressMunicipality = {value: ''}
                await descramble(parsedData, 1607)
                await assignField(parsedData, 1607, AddressMunicipality)
                dataObject.AddressMunicipality = AddressMunicipality.value



                const AddressTown = {value: ''}
                await descramble(parsedData, 1608)
                await assignField(parsedData, 1608, AddressTown)
                dataObject.AddressTown = AddressTown.value



                const AddressNumber = {value: ''}
                await descramble(parsedData, 1610)
                await assignField(parsedData, 1610, AddressNumber)
                dataObject.AddressNumber = AddressNumber.value


                const AddressApartmentNumber = {value: ''}
                await descramble(parsedData, 1612)
                await assignField(parsedData, 1612, AddressApartmentNumber)
                dataObject.AddressApartmentNumber = AddressApartmentNumber.value



                const InsuranceReason = {value: ''}
                await assignField(parsedData, 1614, InsuranceReason)
                dataObject.InsuranceReason = InsuranceReason.value



                const InsuranceDescription = {value: ''}
                await descramble(parsedData, 1615)
                await assignField(parsedData, 1615, InsuranceDescription)
                dataObject.InsuranceDescription = InsuranceDescription.value


                const InsuranceHolderRelation = {value: ''}
                await descramble(parsedData, 1616)
                await assignField(parsedData, 1616, InsuranceHolderRelation)
                dataObject.InsuranceHolderRelation = InsuranceHolderRelation.value


                const InsuranceHolderIsFamilyMember = {value: ''}
                assignBoolField(parsedData, 1617, InsuranceHolderIsFamilyMember)
                dataObject.InsuranceHolderIsFamilyMember = InsuranceHolderIsFamilyMember.value


                const InsuranceHolderPersonalNumber = {value: ''}
                await assignField(parsedData, 1618, InsuranceHolderPersonalNumber)
                dataObject.InsuranceHolderPersonalNumber = InsuranceHolderPersonalNumber.value


                const InsuranceHolderInsuranceNumber = {value: ''}
                await assignField(parsedData, 1619, InsuranceHolderInsuranceNumber)
                dataObject.InsuranceHolderInsuranceNumber = InsuranceHolderInsuranceNumber.value


                const InsuranceHolderSurnameCyrl = {value: ''}
                await descramble(parsedData, 1620)
                await assignField(parsedData, 1620, InsuranceHolderSurnameCyrl)
                dataObject.InsuranceHolderSurnameCyrl = InsuranceHolderSurnameCyrl.value



                const InsuranceHolderSurname = {value: ''}
                await descramble(parsedData, 1621)
                await assignField(parsedData, 1621, InsuranceHolderSurname)
                dataObject.InsuranceHolderSurname = InsuranceHolderSurname.value



                const InsuranceHolderNameCyrl = {value: ''}
                await descramble(parsedData, 1622)
                await assignField(parsedData, 1622, InsuranceHolderNameCyrl)
                dataObject.InsuranceHolderNameCyrl = InsuranceHolderNameCyrl.value


                const InsuranceHolderName = {value: ''}
                await descramble(parsedData, 1623)
                await assignField(parsedData, 1623, InsuranceHolderName)
                dataObject.InsuranceHolderName = InsuranceHolderName.value

                const InsuranceStartDate = {value: ''}
                await assignField(parsedData, 1624, InsuranceStartDate)
                dataObject.InsuranceStartDate = formatDateString(InsuranceStartDate.value)


                const AddressState = {value: ''}
                await descramble(parsedData, 1626)
                await assignField(parsedData, 1626, AddressState)
                dataObject.AddressState = AddressState.value


                const ObligeeName = {value: ''}
                await descramble(parsedData, 1630)
                await assignField(parsedData, 1630, ObligeeName)
                dataObject.ObligeeName = ObligeeName.value


                const ObligeePlace = {value: ''}
                await descramble(parsedData, 1631)
                await assignField(parsedData, 1631, ObligeePlace)
                dataObject.ObligeePlace = ObligeePlace.value


                const ObligeeIdNumber = {value: ''}
                await assignField(parsedData, 1632, ObligeeIdNumber)
                dataObject.ObligeeIdNumber = ObligeeIdNumber.value


                if (ObligeeIdNumber.value.length === 0) {
                    await assignField(parsedData, 1633, ObligeeIdNumber.value)
                    dataObject.ObligeeIdNumber = ObligeeIdNumber.value

                }

                const ObligeeActivity = {value: ''}
                await assignField(parsedData, 1634, ObligeeActivity)
                dataObject.ObligeeActivity = ObligeeActivity.value


                return resolve(dataObject)
            } catch (e) {
                return reject(e);
            }

        })
    })

}