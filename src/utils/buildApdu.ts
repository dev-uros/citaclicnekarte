export async function buildAPDU(cla, ins, p1, p2, data, ne) {

    let length = data.length

    if (length > 0xFFFF) {
        throw new Error('APDU command length too large')
    }

    let apdu = Buffer.from([cla, ins, p1, p2])

    if (length === 0) {
        if (ne !== 0) {
            if (ne <= 256) {
                let l = ne === 256 ? 0x00 : ne
                apdu = Buffer.concat([apdu, Buffer.from([l])])
            } else {
                let l1 = ne === 65536 ? 0x00 : ne >> 8
                let l2 = ne === 65536 ? 0x00 : ne & 0xFF
                apdu = Buffer.concat([apdu, Buffer.from([l1, l2])])
            }
        }
    } else {
        if (ne === 0) {
            if (length <= 255) {
                apdu = Buffer.concat([apdu, Buffer.from([length]), Buffer.from(data)])
            } else {
                apdu = Buffer.concat([apdu, Buffer.from([0x00, length >> 8, length & 0xFF]), Buffer.from(data)])
            }
        } else {
            if (length <= 255 && ne <= 256) {
                apdu = Buffer.concat([apdu, Buffer.from([length]), Buffer.from(data)])
                let l = ne === 256 ? 0x00 : ne
                apdu = Buffer.concat([apdu, Buffer.from([l])])
            } else {
                apdu = Buffer.concat([apdu, Buffer.from([0x00, length >> 8, length & 0xFF]), Buffer.from(data)])
                if (ne !== 65536) {
                    let neB = Buffer.from([ne >> 8, ne & 0xFF])
                    apdu = Buffer.concat([apdu, neB])
                }
            }
        }
    }

    return apdu
}
