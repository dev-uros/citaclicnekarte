import log from "electron-log/main";
import {buildAPDU} from "./buildApdu";

export async function initCard(pcsc, reader, protocol){
    log.info('Protocol(', reader.name, '):', protocol)

    // Init card

    const data = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x49, 0x44, 0x01])
    const apu =  await buildAPDU(0x00, 0xA4, 0x04, 0x00, data, 0)

    await transmitCardInit(reader, protocol, apu)



}

async function transmitCardInit(reader, protocol, apu){
    return new Promise((resolve, reject)=>{
        reader.transmit(apu, 256, protocol, async (err, data) => {
            if (err) {
                log.error('Error(', reader.name, '):', err.message)
                return reject(err);
            }else{
                return resolve(true);
            }
        });
    })
}