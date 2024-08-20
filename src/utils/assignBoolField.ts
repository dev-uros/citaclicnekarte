export function assignBoolField(fields, tag, target) {
    const val = fields[tag];
    if (val && val.length === 1 && val[0] === 0x31) {
        target.value = true;
    } else {
        target.value = false;
    }
}