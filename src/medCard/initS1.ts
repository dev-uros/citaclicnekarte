import {buildAPDU} from "../utils/buildApdu";
import {transmitAsync} from "../utils/transmitAsync";

export async function initS1(reader, protocol) {
    const s1 = Buffer.from([0xF3, 0x81, 0x00, 0x00, 0x02, 0x53, 0x45, 0x52, 0x56, 0x53, 0x5A, 0x4B, 0x01]);
    const apu = await buildAPDU(0x00, 0xA4, 0x04, 0x00, s1, 0)

    await transmitAsync(reader, protocol, apu)
}