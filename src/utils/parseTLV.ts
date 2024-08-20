export async function parseTLV(data) {

    if (data.length === 0) {
        throw new Error('Invalid data length')
    }

    const m = {}
    let offset = 0

    while (offset < data.length) {
        const tag = data.readUInt16LE(offset)
        const length = data.readUInt16LE(offset + 2)

        offset += 4

        if (offset + length > data.length) {
            throw new Error('Invalid length')
        }

        const value = data.slice(offset, offset + length)
        m[tag] = value
        offset += length
    }

    return m
}
