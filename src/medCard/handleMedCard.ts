import log from "electron-log/main";
import {initCard} from "../utils/initCard";
import {handleCardData} from "./handleCardData";
// import {handlePersonalData} from "./handlePersonalData";
// import {handleResidenceData} from "./handleResidenceData";
// import {handleImage} from "./handleImage";
// import {createPdf} from "./handlePdf";
import {CardData} from "../preload";
import {initS1} from "./initS1";
import {handlePersonalData} from "./handlePersonalData";
import {handleImage} from "../idCard/handleImage";
import {createPdf} from "../idCard/handlePdf";
import {handleValidityData} from "./handleValidityData";
import {handleResidenceAndInsuranceData} from "./handleResidenceAndInsuranceData";

export async function handleMedCard(pcsc, reader, protocol, browserWindow) {

    log.info('Protocol(', reader.name, '):', protocol)

    log.info('Initializing ID card')
    await initCard(pcsc, reader, protocol);

    log.info('Initializing S1')
    await initS1(reader, protocol);

    //HANDLE CARD DATA
    log.info('Reading Card Data')
    const cardData = await handleCardData(pcsc, reader, protocol)

    console.log(cardData);

    //HANDLE PERSONAL DATA
    log.info('Reading Personal Data')

    const personalData = await handlePersonalData(pcsc, reader, protocol)


    //HANDLE RESIDENCE DATA
    log.info('Reading Validity Data')
    const validityData = await handleValidityData(pcsc, reader, protocol);


    //HANDLE IMAGE
    log.info('Reading Residence and Insurance data')

    const residenceAndInsuranceData = await handleResidenceAndInsuranceData(pcsc, reader, protocol)


    log.info('Formatting card data')
    const allData = formatAllCardData(cardData, personalData, residenceData, image);

    //CREATE PDF
    log.info('Creating PDF')
    allData.pdf = await createPdf(allData);

    //PDF TO BASE64
    log.info('Creating PDF base64')

    allData.pdfBase64 = uint8ArrayToBase64(allData.pdf);


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