import log from "electron-log/main";

export async function selectFile(reader, protocol, dataApdu) {
    return new Promise((resolve, reject) => {
        reader.transmit(Buffer.from(dataApdu), 1024, protocol, async (err, data) => {
            if (err) {
                log.error('Error(', reader.name, '):', err.message)

                return reject(err)
            }else{
                return resolve(true);
            }
        });
    })
}