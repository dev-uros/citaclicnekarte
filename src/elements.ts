const Elements = {
    get InsertCardIntoReaderDiv(){
      return document.getElementById('insertCardIntoReaderDiv') as HTMLDivElement
    },
    get LoadingCardDiv(){
        return document.getElementById('loadingCardDiv') as HTMLDivElement
    },
    get ReadPersonalIDButtonDiv(){
        return document.getElementById('readPersonalIdButtonDiv') as HTMLDivElement
    },
    get CardDataSection(){
        return document.getElementById('cardDataSection') as HTMLDivElement;
    },
    get ReadPersonalIdButton() {
        return document.getElementById('readPersonalIdButton') as HTMLButtonElement;
    },
    get DocumentNumberInput(){
        return document.getElementById('documentNumber') as HTMLInputElement;
    },
    get DocumentTypeInput(){
        return document.getElementById('documentType') as HTMLInputElement;
    },
    get DocumentSerialNumberInput(){
        return document.getElementById('documentSerialNumber') as HTMLInputElement;
    },
    get DocumentIssuingDateInput(){
        return document.getElementById('issuingDate') as HTMLInputElement;
    },
    get DocumentExpiryDateInput(){
        return document.getElementById('expiryDate') as HTMLInputElement;
    },
    get DocumentIssuingAuthorityInput(){
        return document.getElementById('issuingAuthority') as HTMLInputElement;
    },
    get PersonalNumberInput(){
        return document.getElementById('personalNumber') as HTMLInputElement;
    },
    get SurnameInput(){
        return document.getElementById('surname') as HTMLInputElement;
    },
    get GivenNameInput(){
        return document.getElementById('givenName') as HTMLInputElement;
    },
    get ParentGivenNameInput(){
        return document.getElementById('parentGivenName') as HTMLInputElement;
    },
    get SexInput(){
        return document.getElementById('sex') as HTMLInputElement;
    },
    get PlaceOfBirthInput(){
        return document.getElementById('placeOfBirth') as HTMLInputElement;
    },
    get CommunityOfBirthInput(){
        return document.getElementById('communityOfBirth') as HTMLInputElement;
    },
    get StateOfBirthInput(){
        return document.getElementById('stateOfBirth') as HTMLInputElement;
    },
    get DateOfBirthInput(){
        return document.getElementById('dateOfBirth') as HTMLInputElement;
    },
    get State(){
        return document.getElementById('state') as HTMLInputElement;
    },
    get Community(){
        return document.getElementById('community') as HTMLInputElement;
    },
    get Place(){
        return document.getElementById('place') as HTMLInputElement;
    },
    get Street(){
        return document.getElementById('street') as HTMLInputElement;
    },
    get AddressNumber(){
        return document.getElementById('addressNumber') as HTMLInputElement;
    },
    get AddressLetter(){
        return document.getElementById('addressLetter') as HTMLInputElement;
    },
    get AddressEntrance(){
        return document.getElementById('addressEntrance') as HTMLInputElement;
    },
    get AddressFloor(){
        return document.getElementById('addressFloor') as HTMLInputElement;
    },
    get AddressApartmentNumber(){
        return document.getElementById('addressApartmentNumber') as HTMLInputElement;
    },
    get AddressDate(){
        return document.getElementById('addressDate') as HTMLInputElement;
    },
    get UserImage(){
        return document.getElementById('userImage') as HTMLImageElement
    },

    get CardDataCollapseButton(){
        return document.getElementById('cardDataCollapseButton') as HTMLButtonElement
    },
    get CardDataWrapperDiv(){
        return document.getElementById('cardDataWrapperDiv') as HTMLButtonElement
    },

    get PersonalDataCollapseButton(){
        return document.getElementById('personalDataCollapseButton') as HTMLButtonElement
    },
    get PersonalDataWrapperDiv(){
        return document.getElementById('personalDataWrapperDiv') as HTMLButtonElement
    },

    get ResidenceDataCollapseButton(){
        return document.getElementById('residenceDataCollapseButton') as HTMLButtonElement
    },
    get ResidenceDataWrapperDiv(){
        return document.getElementById('residenceDataWrapperDiv') as HTMLButtonElement
    },
    get DownloadPdfButton(){
        return document.getElementById('downloadPdf') as HTMLButtonElement
    },
    get PrintButton(){
        return document.getElementById('printPdf') as HTMLButtonElement
    },
    get InsertCardReaderIntoDeviceDiv(){
        return document.getElementById('insertCardReaderIntoDeviceDiv') as HTMLDivElement
    },
    get ErrorDiv(){
        return document.getElementById('errorDiv') as HTMLDivElement
    },
    get CancelCardReadDiv(){
        return document.getElementById('cancelCardReadDiv') as HTMLDivElement
    },
    get CancelCardReadButton(){
        return document.getElementById('cancelCardReadButton') as HTMLButtonElement
    }
};

export default Elements;
