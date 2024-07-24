import {CardData} from "./preload";
import Elements from "./elements";

const renderCardData = (cardData: CardData) => {

    //card data
    Elements.DocumentNumberInput.value = cardData.documentData.DocumentNumber;

    Elements.DocumentTypeInput.value = cardData.documentData.DocumentType;

    Elements.DocumentSerialNumberInput.value = cardData.documentData.DocumentSerialNumber;

    Elements.DocumentIssuingDateInput.value = cardData.documentData.IssuingDate;

    Elements.DocumentExpiryDateInput.value = cardData.documentData.ExpiryDate;

    Elements.DocumentIssuingAuthorityInput.value = cardData.documentData.IssuingAuthority;

    //personal data

    Elements.PersonalNumberInput.value = cardData.personalData.PersonalNumber;

    Elements.SurnameInput.value = cardData.personalData.Surname;

    Elements.GivenNameInput.value = cardData.personalData.GivenName;

    Elements.ParentGivenNameInput.value = cardData.personalData.ParentGivenName;

    Elements.SexInput.value = cardData.personalData.Sex;

    Elements.PlaceOfBirthInput.value = cardData.personalData.PlaceOfBirth;

    Elements.CommunityOfBirthInput.value = cardData.personalData.CommunityOfBirth;

    Elements.StateOfBirthInput.value = cardData.personalData.StateOfBirth;

    Elements.DateOfBirthInput.value = cardData.personalData.DateOfBirth;

    //residence data

    Elements.State.value = cardData.residenceData.State;

    Elements.Community.value = cardData.residenceData.Community;

    Elements.Place.value = cardData.residenceData.Place;

    Elements.Street.value = cardData.residenceData.Street;

    Elements.AddressNumber.value = cardData.residenceData.AddressNumber;

    Elements.AddressLetter.value = cardData.residenceData.AddressLetter;

    Elements.AddressEntrance.value = cardData.residenceData.AddressEntrance;

    Elements.AddressFloor.value = cardData.residenceData.AddressFloor;

    Elements.AddressApartmentNumber.value = cardData.residenceData.AddressApartmentNumber;

    Elements.AddressDate.value = cardData.residenceData.AddressDate;

    //image

    Elements.UserImage.src = `data:image/jpeg;base64, ${cardData.image}`

    //mailto setup

    //show card data section
    Elements.CardDataSection.style.display = 'block'

    //show fieldset card data
    Elements.CardDataWrapperDiv.style.display = 'block'
    Elements.CardDataCollapseButton.innerText = ' - ';

    //show fieldset personal data
    Elements.PersonalDataWrapperDiv.style.display = 'block'
    Elements.PersonalDataCollapseButton.innerText = ' - ';
    //show fieldset residence data
    Elements.ResidenceDataWrapperDiv.style.display = 'block'
    Elements.ResidenceDataCollapseButton.innerText = ' - ';

    //show read card data button
    Elements.ReadPersonalIDButtonDiv.style.display = 'block'

    //hide loading div
    Elements.LoadingCardDiv.style.display = 'none'
}

const clearCardData = () => {

    //hide error display div
    Elements.ErrorDiv.style.display = 'none'


    //hide card data section

    Elements.CardDataSection.style.display = 'none'

    //hide read card data button
    Elements.ReadPersonalIDButtonDiv.style.display = 'none'

    //card data
    Elements.DocumentNumberInput.value = '';

    Elements.DocumentTypeInput.value = '';

    Elements.DocumentSerialNumberInput.value = '';

    Elements.DocumentIssuingDateInput.value = '';

    Elements.DocumentExpiryDateInput.value = '';

    Elements.DocumentIssuingAuthorityInput.value = '';

    //personal data

    Elements.PersonalNumberInput.value = '';

    Elements.SurnameInput.value = '';

    Elements.GivenNameInput.value = '';

    Elements.ParentGivenNameInput.value = '';

    Elements.SexInput.value = '';

    Elements.PlaceOfBirthInput.value = '';

    Elements.CommunityOfBirthInput.value = '';

    Elements.StateOfBirthInput.value = '';

    Elements.DateOfBirthInput.value = '';

    //residence data

    Elements.State.value = '';

    Elements.Community.value = '';

    Elements.Place.value = '';

    Elements.Street.value = '';

    Elements.AddressNumber.value = '';

    Elements.AddressLetter.value = '';

    Elements.AddressEntrance.value = '';

    Elements.AddressFloor.value = '';

    Elements.AddressApartmentNumber.value = '';

    Elements.AddressDate.value = ''
    //image

    Elements.UserImage.src = ''


}

const showInsertCardIntoReader = () => {
    Elements.InsertCardReaderIntoDeviceDiv.style.display = 'none'
    Elements.InsertCardIntoReaderDiv.style.display = 'block'
    Elements.CancelCardReadDiv.style.display = 'block'
}

const hideInsertCardIntoReader = () => {
    Elements.InsertCardIntoReaderDiv.style.display = 'none'
    Elements.InsertCardReaderIntoDeviceDiv.style.display = 'none'
    Elements.LoadingCardDiv.style.display = 'block'
    Elements.CancelCardReadDiv.style.display = 'none'
}

const showInsertCardReaderIntoDevice = () => {
    Elements.InsertCardReaderIntoDeviceDiv.style.display = 'block'
    Elements.CancelCardReadDiv.style.display = 'block'
}

const displayError = () => {
    Elements.LoadingCardDiv.style.display = 'none'
    Elements.InsertCardIntoReaderDiv.style.display = 'none'
    Elements.InsertCardReaderIntoDeviceDiv.style.display = 'none'
    Elements.ErrorDiv.style.display = 'block'
    Elements.ReadPersonalIDButtonDiv.style.display = 'block'

}

const cancelCardRead = () => {
    Elements.InsertCardReaderIntoDeviceDiv.style.display = 'none'
    Elements.InsertCardIntoReaderDiv.style.display = 'none'
    Elements.CancelCardReadDiv.style.display = 'none'
    Elements.ReadPersonalIDButtonDiv.style.display = 'block'
}
export {renderCardData, clearCardData, showInsertCardIntoReader, hideInsertCardIntoReader, showInsertCardReaderIntoDevice, displayError, cancelCardRead}