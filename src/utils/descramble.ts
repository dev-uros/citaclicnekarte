import iconv from "iconv-lite";

export async function descramble(fields, tag) {
    const bs = fields[tag];
    if (bs) {
        try {
            // Decode the UTF-16 (LE) encoded buffer
            const utf8 = iconv.decode(bs, 'utf16-le');
            fields[tag] = Buffer.from(utf8, 'utf8');
            return;
        } catch (err) {
            throw new Error('error descramble')
            // Handle the error if needed
        }
    }

    // If decoding fails, set an empty buffer
    fields[tag] = Buffer.from('');
}