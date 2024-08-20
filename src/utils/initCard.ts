import log from "electron-log/main";
import {buildAPDU} from "./buildApdu";

export async function initCard(pcsc, reader, protocol, browserWindow){
    log.info('Protocol(', reader.name, '):', protocol)

    // Init card

    const data = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x49, 0x44, 0x01])
    let apu;
    try {
        apu = await buildAPDU(0x00, 0xA4, 0x04, 0x00, data, 0)
    } catch (e) {
        log.error('Error(', reader.name, '):', e.message)

        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

    try {
        await transmitCardInit(reader, protocol, apu)

    }catch (e){
        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

}

async function transmitCardInit(reader, protocol, apu){
    return new Promise((resolve, reject)=>{
        reader.transmit(apu, 256, protocol, async (err, data) => {
            if (err) {
                log.error('Error(', reader.name, '):', err.message)

                return reject(err);
            }else{
                console.log('init')
                return resolve(true);
            }
        });
    })
}