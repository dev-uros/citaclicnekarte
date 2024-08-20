import log from "electron-log/main";
import {descramble} from "./descramble";
import {parseTLV} from "./parseTLV";
import {assignField} from "./assignField";
import {transmitAsync} from "./transmitAsync";
import {buildAPDU} from "./buildApdu";

export async function testMedCard(reader, protocol) {
    const s1 = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x56, 0x53, 0x5A, 0x4B, 0x01]);
    let apu;
    try {
        apu = await buildAPDU(0x00, 0xA4, 0x04, 0x00, s1, 0)

    }catch (e){
        // log.error('Error(', reader.name, '):', e)
        throw new Error(e);

    }

    try {
        await transmitAsync(reader, protocol, apu)
    }catch (e) {
        // log.error('Error(', reader.name, '):', e)

        throw new Error(e);
    }

    const fileLocation = Buffer.from([0x0D, 0x01]);

    let fileLocationApdu;
    try {
        fileLocationApdu = await buildAPDU(0x00, 0xA4, 0x00, 0x00, fileLocation, 0)
    } catch (e) {
        // log.error('Error(', reader.name, '):', e)
        throw new Error(e);
    }

    try {
        return await generateCardData(reader, protocol, fileLocation, fileLocationApdu)

    } catch (e) {
        // log.error('Error(', reader.name, '):', e)

        throw new Error(e)
    }
}

async function generateCardData(reader, protocol, dataLocation, dataApdu) {
    return new Promise((resolve, reject) => {
        //select file
        reader.transmit(Buffer.from(dataApdu), 1024, protocol, async (err) => {
            if (err) {
                // log.error('Error(', reader.name, '):', err.message)
                return reject(err)
            }

            const readSize = Math.min(4, 0xFF)

            let apu
            try {
                apu = await buildAPDU(0x00, 0xB0, (0xFF00 & 0) >> 8, 0 & 0xFF, [], readSize)
            } catch (e) {
                // log.error('Error(', reader.name, '):', e)

                return reject(err);
            }


            try {
                return resolve(await readFileMedicalTest(reader, apu, protocol))

            } catch (e) {
                // log.error('Error(', reader.name, '):', e)

                return reject(e);
            }


        })
    })
}

async function readFileMedicalTest(reader, apu, protocol) {
    return new Promise((resolve, reject) => {
        reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
            if (err) {
                // log.error('Error reading header:', err.message)
                return reject(err);
            }
            const rsp = data.subarray(0, data.length - 2)
            let offset = rsp.length

            if(offset < 3){
                // log.error('Offset too short:', offset)
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
                    // log.error('Error(', reader.name, '):', e)

                    return reject(e);

                }
                log.info({readSize, apu})

                let data;
                try {
                    data = await transmitAsync(reader, protocol, apu)
                } catch (e) {
                    // log.error('Error(', reader.name, '):', e)

                    return reject(e);
                }
                const rsp = data.subarray(0, data.length - 2)
                offset += rsp.length
                length -= rsp.length
                output.push(...rsp)

            }
            log.info('ovo je output')
            log.info(output)
            let parsedData;

            try {
                parsedData = await parseTLV(Buffer.from(output))
            } catch (e) {
                // log.error('Error(', reader.name, '):', e)

                return reject(e);
            }



            const InsurerName = {value: ''}

            await descramble(parsedData, 1553)
            await assignField(parsedData, 1553, InsurerName)

            console.log(InsurerName)
            return resolve(InsurerName.value === "Републички фонд за здравствено осигурање");

        })
    })

}



