import fs from "fs";
import {join} from "path";
import {PDFDocument} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import {CardData} from "../preload";
import {getCurrentDate} from "../utils/getCurrentDate";

export async function createPdf(allData: CardData) {
    const fontBytes = await fs.readFileSync(join(__dirname, 'fonts', 'DejaVuSans.ttf'));

    const pdfDoc = await PDFDocument.create()
    pdfDoc.registerFontkit(fontkit);
    const customFont = await pdfDoc.embedFont(fontBytes)

    // Create a new PDFDocument
    // Add a blank page to the document
    const page = pdfDoc.addPage([550, 750])

    pdfDoc.setTitle(allData.personalData.GivenName + ' ' + allData.personalData.Surname)

    //linija naslov - start
    page.drawLine({
        start: {
            x: 50,
            y: 680
        },
        end: {
            x: 500,
            y: 680
        }
    })
    page.drawText('ČITAČ ELEKTRONSKE LIČNE KARTE: ŠTAMPA PODATAKA', {
        x: 50,
        y: 685,
        size: 10,
        font: customFont
    })
    page.drawLine({
        start: {
            x: 50,
            y: 700
        },
        end: {
            x: 500,
            y: 700
        }
    })
    //linija naslov - end

    //ubaciti slku

    const image = allData.image;
    const base64ImageContent = image.split(';base64,').pop();
    const imageBytes = Uint8Array.from(atob(base64ImageContent), c => c.charCodeAt(0));

    const jpgImage = await pdfDoc.embedJpg(imageBytes)
    page.drawImage(jpgImage, {
        x: 50,
        y: 535,
        width: 100,
        height: 135,
    })
    //linija podaci o gradjaninu start

    page.drawLine({
        start: {
            x: 50,
            y: 520
        },
        end: {
            x: 500,
            y: 520
        }
    })
    page.drawText('Podaci o građaninu', {
        x: 50,
        y: 505,
        size: 10,
        font: customFont

    })
    page.drawLine({
        start: {
            x: 50,
            y: 500
        },
        end: {
            x: 500,
            y: 500
        }
    })

    //linija podaci o gradjaninu end

    //serija podataka o gradjaninu - start

    page.drawText('Prezime:', {
        x: 50,
        y: 480,
        size: 10,
        font: customFont

    })

    page.drawText(allData.personalData.Surname, {
        x: 185,
        y: 480,
        size: 10,
        font: customFont

    })
    page.drawText('Ime:', {
        x: 50,
        y: 460,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.GivenName, {
        x: 185,
        y: 460,
        size: 10,
        font: customFont

    })

    page.drawText('Ime jednog roditelja:', {
        x: 50,
        y: 440,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.ParentGivenName, {
        x: 185,
        y: 440,
        size: 10,
        font: customFont

    })
    page.drawText('Datum rođenja:', {
        x: 50,
        y: 420,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.DateOfBirth, {
        x: 185,
        y: 420,
        size: 10,
        font: customFont

    })
    page.drawText('Mesto rođenja, opština i', {
        x: 50,
        y: 400,
        size: 10,
        font: customFont
    })
    const fullBirthLocationData = `${allData.personalData.PlaceOfBirth}, ${allData.personalData.CommunityOfBirth}, ${allData.personalData.StateOfBirth}`;

    if (fullBirthLocationData.length > 50) {
        page.drawText(`${allData.personalData.PlaceOfBirth}, ${allData.personalData.CommunityOfBirth}`, {
            x: 185,
            y: 400,
            size: 10,
            font: customFont

        })
        page.drawText(`${allData.personalData.StateOfBirth}`, {
            x: 185,
            y: 380,
            size: 10,
            font: customFont

        })
    } else {
        page.drawText(fullBirthLocationData, {
            x: 185,
            y: 400,
            size: 10,
            font: customFont

        })
    }

    page.drawText('država:', {
        x: 50,
        y: 380,
        size: 10,
        font: customFont

    })


    page.drawText('Prebivaliste i adresa', {
        x: 50,
        y: 360,
        size: 10,
        font: customFont
    })

    page.drawText('stana:', {
        x: 50,
        y: 340,
        size: 10,
        font: customFont
    })

    const fullResidenceLocationData = `${allData.residenceData.Place}, ${allData.residenceData.Community}, ${allData.residenceData.Street} ${allData.residenceData.AddressNumber}${allData.residenceData.AddressLetter}/${allData.residenceData.AddressFloor}/${allData.residenceData.AddressApartmentNumber}`;

    if (fullResidenceLocationData.length > 50) {
        page.drawText(`${allData.residenceData.Place}, ${allData.residenceData.Community}`, {
            x: 185,
            y: 360,
            size: 10,
            font: customFont
        })
        page.drawText(`${allData.residenceData.Street} ${allData.residenceData.AddressNumber}${allData.residenceData.AddressLetter}/${allData.residenceData.AddressFloor}/${allData.residenceData.AddressApartmentNumber}`, {
            x: 185,
            y: 340,
            size: 10,
            font: customFont
        })
    } else {
        page.drawText(fullResidenceLocationData, {
            x: 185,
            y: 360,
            size: 10,
            font: customFont
        })
    }
    page.drawText('Datum promene adrese:', {
        x: 50,
        y: 320,
        size: 10,
        font: customFont

    })
    page.drawText(allData.residenceData.AddressDate, {
        x: 185,
        y: 320,
        size: 10,
        font: customFont

    })
    page.drawText('JMBG:', {
        x: 50,
        y: 300,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.PersonalNumber, {
        x: 185,
        y: 300,
        size: 10,
        font: customFont

    })
    page.drawText('Pol:', {
        x: 50,
        y: 280,
        size: 10,
        font: customFont

    })
    page.drawText(allData.personalData.Sex, {
        x: 185,
        y: 280,
        size: 10,
        font: customFont

    })
    //serija podataka o gradjaninu - end

    //linija podaci o dokumentu - start

    page.drawLine({
        start: {
            x: 50,
            y: 260
        },
        end: {
            x: 500,
            y: 260
        }
    })
    page.drawText('Podaci o dokumentu', {
        x: 50,
        y: 245,
        size: 10,
        font: customFont

    })
    page.drawLine({
        start: {
            x: 50,
            y: 240
        },
        end: {
            x: 500,
            y: 240
        }
    })

    //linija podaci o dokumentu - end

    //serija podataka o dokumentu - start
    page.drawText('Dokument izdaje:', {
        x: 50,
        y: 220,
        size: 10,
        font: customFont

    })

    page.drawText(allData.documentData.IssuingAuthority, {
        x: 185,
        y: 220,
        size: 10,
        font: customFont

    })
    page.drawText('Broj dokumenta:', {
        x: 50,
        y: 200,
        size: 10,
        font: customFont

    })
    page.drawText(allData.documentData.DocumentNumber, {
        x: 185,
        y: 200,
        size: 10,
        font: customFont

    })
    page.drawText('Datum izdavanja:', {
        x: 50,
        y: 180,
        size: 10,
        font: customFont

    })
    page.drawText(allData.documentData.IssuingDate, {
        x: 185,
        y: 180,
        size: 10,
        font: customFont

    })
    page.drawText('Važi do:', {
        x: 50,
        y: 160,
        size: 10,
        font: customFont

    })
    page.drawText(allData.documentData.ExpiryDate, {
        x: 185,
        y: 160,
        size: 10,
        font: customFont

    })
    //serija podataka o dokumentu - end

    //dve linije za datum stampe - start
    page.drawLine({
        start: {
            x: 50,
            y: 140
        },
        end: {
            x: 500,
            y: 140
        }
    })
    page.drawLine({
        start: {
            x: 50,
            y: 135
        },
        end: {
            x: 500,
            y: 135
        }
    })
    //dve linije za datum stampe - end

    //datum stampe - start
    page.drawText('Datum štampe:', {
        x: 50,
        y: 120,
        size: 10,
        font: customFont

    })

    page.drawText(getCurrentDate(), {
        x: 185,
        y: 120,
        size: 10,
        font: customFont

    })
    //datum stampe - end

    //linija za footer - start

    page.drawLine({
        start: {
            x: 50,
            y: 100
        },
        end: {
            x: 500,
            y: 100
        }
    })


    //text footer-a

    page.drawText('1. U čipu lične karte, podaci o imenu i prezimenu imaoca lične karte ispisani su na nacionalnom pismu onako kako su', {
        x: 50,
        y: 80,
        size: 7.5,
        font: customFont

    })
    page.drawText('ispisani na samom obrascu lične karte, dok su ostali podaci ispisani latiničkim pismom.', {
        x: 50,
        y: 70,
        size: 7.5,
        font: customFont

    })
    page.drawText('2. Ako se ime lica sastoji od dve reči čija je ukupna dužina između 20 i 30 karaktera ili prezimena od dve reči čija je', {
        x: 50,
        y: 60,
        size: 7.5,
        font: customFont

    })

    page.drawText('ukupna dužina između 30 i 36 karaktera, u čipu lične karte izdate pre 18.08.2014. godine, druga reč u imenu ili', {
        x: 50,
        y: 50,
        size: 7.5,
        font: customFont

    })

    page.drawText('prezimenu skraćuje se na prva dva karaketra.', {
        x: 50,
        y: 40,
        size: 7.5,
        font: customFont

    })

    page.drawLine({
        start: {
            x: 50,
            y: 30
        },
        end: {
            x: 500,
            y: 30
        }
    })

    return await pdfDoc.save()
}
