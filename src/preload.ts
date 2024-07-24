import {ipcRenderer, contextBridge} from 'electron'
import {
    cancelCardRead,
    clearCardData,
    displayError,
    hideInsertCardIntoReader,
    renderCardData,
    showInsertCardIntoReader,
    showInsertCardReaderIntoDevice
} from "./cardDataRenderer";

export type CardData = {
    documentData: {
        DocumentNumber: string,
        DocumentType: string,
        DocumentSerialNumber: string,
        IssuingDate: string,
        ExpiryDate: string,
        IssuingAuthority: string
    },
    personalData: {
        PersonalNumber: string,
        Surname: string,
        GivenName: string,
        ParentGivenName: string,
        Sex: string,
        PlaceOfBirth: string,
        CommunityOfBirth: string,
        StateOfBirth: string,
        DateOfBirth: string
    },
    residenceData: {
        State: string,
        Community: string,
        Place: string,
        Street: string,
        AddressNumber: string,
        AddressLetter: string,
        AddressEntrance: string,
        AddressFloor: string,
        AddressApartmentNumber: string,
        AddressDate: string
    },
    image: string,
    pdf: Uint8Array,
    pdfBase64: string
}
ipcRenderer.on('insert-card-into-reader', () => {
    showInsertCardIntoReader();
})

ipcRenderer.on('insert-card-reader-into-device', () => {
    showInsertCardReaderIntoDevice();
})
ipcRenderer.on('card-inserted-into-reader', () => {
    hideInsertCardIntoReader();
})
ipcRenderer.on('card-data-loaded', (_, cardData: CardData) => {
    console.log(cardData);
    renderCardData(cardData)
})

ipcRenderer.on('display-error', () => {
    displayError()
})
contextBridge.exposeInMainWorld('api', {
    initializeIDCardReader: async () => {
        clearCardData()
        await ipcRenderer.send('initialize-id-card-reader');
    },
    downloadPdf: async () => {
        await ipcRenderer.send('download-pdf');
    },
    cancelCardReader: ()=>{
        cancelCardRead()
        ipcRenderer.send('cancel-card-reader')
    },
    printPdf: () => {
        ipcRenderer.send('print-pdf')
    }
})