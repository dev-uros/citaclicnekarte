export async function transmitAsync(reader, protocol, apu) {
    return new Promise((resolve, reject) => {
        reader.transmit(Buffer.from(apu), 1024, protocol, (err, data) => {
            if (err) {
                return reject(err) // Reject promise on error
            } else {
                return resolve(data) // Resolve with data on success
            }
        })
    })
}