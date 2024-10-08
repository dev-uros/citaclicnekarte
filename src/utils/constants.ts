export const GEMALTO_ATR_1 = Buffer.from(
    [0x3B, 0xFF, 0x94, 0x00, 0x00, 0x81, 0x31, 0x80,
        0x43, 0x80, 0x31, 0x80, 0x65, 0xB0, 0x85, 0x02,
        0x01, 0xF3, 0x12, 0x0F, 0xFF, 0x82, 0x90, 0x00,
        0x79]
);

// Available since January 2023 (maybe). Replaced very soon with an even newer version.
export const GEMALTO_ATR_2 = Buffer.from(
    [0x3B, 0xF9, 0x96, 0x00, 0x00, 0x80, 0x31, 0xFE,
        0x45, 0x53, 0x43, 0x45, 0x37, 0x20, 0x47, 0x43,
        0x4E, 0x33, 0x5E
    ]
);

// Available since July 2023.
export const GEMALTO_ATR_3 = Buffer.from([
    0x3B, 0x9E, 0x96, 0x80, 0x31, 0xFE, 0x45, 0x53,
    0x43, 0x45, 0x20, 0x38, 0x2E, 0x30, 0x2D, 0x43,
    0x31, 0x56, 0x30, 0x0D, 0x0A, 0x6F
])

// Available since June 2024.
export const GEMALTO_ATR_4 = Buffer.from([
    0x3B, 0x9E, 0x96, 0x80, 0x31, 0xFE, 0x45, 0x53,
    0x43, 0x45, 0x20, 0x38, 0x2E, 0x30, 0x2D, 0x43,
    0x32, 0x56, 0x30, 0x0D, 0x0A, 0x6C
]);


// Possibly the first version of the medical card. Newer version has the GEMALTO_ATR_2 for the ATR.
export const MEDICAL_ATR = Buffer.from([
    0x3B, 0xF4, 0x13, 0x00, 0x00, 0x81, 0x31, 0xFE,
    0x45, 0x52, 0x46, 0x5A, 0x4F, 0xED
]);

// Apollo is the type of the first smart ID cards.
// Apollo cards are not manufactured anymore, and this code could be removed in the future.
export const APOLLO_ATR = Buffer.from([
    0x3B, 0xB9, 0x18, 0x00, 0x81, 0x31, 0xFE, 0x9E, 0x80,
    0x73, 0xFF, 0x61, 0x40, 0x83, 0x00, 0x00, 0x00, 0xDF,
]);