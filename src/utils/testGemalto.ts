import {buildAPDU} from "./buildApdu";
import {transmitAsync} from "./transmitAsync";
import log from "electron-log/main";

export async function testGemalto(reader, protocol) {
    const data = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x49, 0x44, 0x01])
    let apu;
    try {
        apu = await buildAPDU(0x00, 0xA4, 0x04, 0x00, data, 0)
    } catch (e) {
        // log.error('Error(', reader.name, '):', e.message)
        throw new Error(e);
    }

    try {
        return await transmitAsync(reader, protocol, apu);

    }catch (e) {
        // log.error('Error(', reader.name, '):', e.message)

        throw new Error(e);
    }


}
