export async function assignField(fields, tag, target) {
    if (fields.hasOwnProperty(tag)) {
        target.value = Buffer.from(fields[tag]).toString('utf8')
    } else {
        target.value = ''
    }
}
