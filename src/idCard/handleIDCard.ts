import log from "electron-log/main";
import {initCard} from "../utils/initCard";
import {handleCardData} from "./handleCardData";
import {handlePersonalData} from "./handlePersonalData";
import {handleResidenceData} from "./handleResidenceData";
import {handleImage} from "./handleImage";
import {createPdf} from "./handlePdf";
import {CardData} from "../preload";

export async function handleIDCard(pcsc, reader, protocol, browserWindow) {

    log.info('Protocol(', reader.name, '):', protocol)


    // INIT CARD
    try {
        await initCard(pcsc, reader, protocol, browserWindow);

    } catch (e) {
        throw new Error(e);
    }
    log.info('ID CARD INITIATED')

    //HANDLE CARD DATA
    let cardData;
    try {
        cardData = await handleCardData(pcsc, reader, protocol, browserWindow)
    } catch (e) {
        throw new Error(e);

    }

    //HANDLE PERSONAL DATA
    let personalData;
    try {
        personalData = await handlePersonalData(pcsc, reader, protocol, browserWindow)
    } catch (e) {
        throw new Error(e);
    }

    //HANDLE RESIDENCE DATA
    let residenceData
    try {
        residenceData = await handleResidenceData(pcsc, reader, protocol, browserWindow)
    } catch (e) {
        throw new Error(e);
    }


    //HANDLE IMAGE
    let image;
    try {
        image = await handleImage(pcsc, reader, protocol, browserWindow)
    } catch (e) {
        throw new Error(e);
    }
    const allData = formatAllCardData(cardData, personalData, residenceData, image);

    //CREATE PDF
    try {
        allData.pdf = await createPdf(allData);
    } catch (e) {
        log.error('Error(', reader.name, '):', e.message)

        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

    //PDF TO BASE64
    try {
        allData.pdfBase64 = uint8ArrayToBase64(allData.pdf);
    } catch (e) {
        log.error('Error(', reader.name, '):', e.message)

        browserWindow.webContents.send('display-error');
        reader.close()
        pcsc.close()
        return;
    }

    reader.close()
    pcsc.close()
    browserWindow.webContents.send('card-data-loaded', allData)
    return allData;
}


function formatAllCardData(cardData, personalData, residenceData, image): CardData {
    return {
        documentData: {
            DocumentNumber: cardData.DocumentNumber,
            DocumentType: cardData.DocumentType,
            DocumentSerialNumber: cardData.DocumentSerialNumber,
            IssuingDate: cardData.IssuingDate,
            ExpiryDate: cardData.ExpiryDate,
            IssuingAuthority: cardData.IssuingAuthority
        },
        personalData: {
            PersonalNumber: personalData.PersonalNumber,
            Surname: personalData.Surname,
            GivenName: personalData.GivenName,
            ParentGivenName: personalData.ParentGivenName,
            Sex: personalData.Sex,
            PlaceOfBirth: personalData.PlaceOfBirth,
            CommunityOfBirth: personalData.CommunityOfBirth,
            StateOfBirth: personalData.StateOfBirth,
            DateOfBirth: personalData.DateOfBirth
        },
        residenceData: {
            State: residenceData.State,
            Community: residenceData.Community,
            Place: residenceData.Place,
            Street: residenceData.Street,
            AddressNumber: residenceData.AddressNumber,
            AddressLetter: residenceData.AddressLetter,
            AddressEntrance: residenceData.AddressEntrance,
            AddressFloor: residenceData.AddressFloor,
            AddressApartmentNumber: residenceData.AddressApartmentNumber,
            AddressDate: residenceData.AddressDate
        },
        image: image,
        pdf: '',
        pdfBase64: ''
    }
}

function uint8ArrayToBase64(uint8Array: Uint8Array) {
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}