import log from "electron-log/main";
import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";
import {parseTLV} from "../utils/parseTLV";
import {assignField} from "../utils/assignField";
import Jimp from "jimp";

export async function readImage(reader, apu, protocol) {
    return new Promise((resolve, reject) => {
        reader.transmit(Buffer.from(apu), 1024, protocol, async (err, data) => {
            if (err) {
                log.info('Error reading header:', err)
                return reject('error');

            }
            let rsp = data.subarray(0, data.length - 2)
            let offset = rsp.length
            if (offset < 3) {
                log.error('Offset too short:', offset)
                return reject('error');

            }
            log.info('ovo je offset');
            log.info(offset)


            try {
                let length = rsp.readUInt16LE(2)



                const output = []
                while (length > 0) {
                    // log.info('udje u while')
                    const readSize = Math.min(length, 0xFF)
                    const apu = await buildAPDU(0x00, 0xB0, (0xFF00 & offset) >> 8, offset & 0xFF, [], readSize)

                    // log.info({readSize, apu})

                    const data = await transmitAsync(reader, protocol, apu)

                    const rsp = data.subarray(0, data.length - 2)
                    offset += rsp.length
                    length -= rsp.length
                    output.push(...rsp)

                }
                const imageBuffer = Buffer.from(output.slice(4)); // Slice the first 4 bytes if needed

                // log.info('Final image buffer length:', imageBuffer.length);
                // log.info('First few bytes of the image buffer:', imageBuffer.subarray(0, 10));

                // Process image buffer using sharp
                await Jimp.read(imageBuffer)
                    .then((image) => {
                        image.getBuffer(Jimp.MIME_JPEG, (err, decodedImageBuffer) => {
                            if (err) {
                                log.error('Error decoding image with Jimp:', err);
                                return reject(err);
                            } else {
                                console.log('dosao do slike')
                                return resolve(decodedImageBuffer.toString('base64'));
                            }
                        });
                    })
                    .catch((err) => {

                        log.error('Error reading image with Jimp:', err);
                        return reject(err);
                    });
            }catch (e){
                return reject(e);
            }



        })
    })

}