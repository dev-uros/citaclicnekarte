import './index.css';
import Elements from "./elements";

console.log('👋 This message is being logged by "renderer.ts", included via Vite');


Elements.ReadPersonalIdButton.addEventListener('click', () => {
     window.api.initializeIDCardReader()
         .catch(e => {
              console.log(e)
         });
})

Elements.DownloadPdfButton.addEventListener('click', () => {
     window.api.downloadPdf();
})

Elements.CardDataCollapseButton.addEventListener('click', () => {
     if(Elements.CardDataWrapperDiv.style.display === 'block'){
          Elements.CardDataWrapperDiv.style.display = 'none'
          Elements.CardDataCollapseButton.innerText = ' + ';
     }else{
          Elements.CardDataWrapperDiv.style.display = 'block'
          Elements.CardDataCollapseButton.innerText = ' - ';

     }
})


Elements.PersonalDataCollapseButton.addEventListener('click', () => {
     if(Elements.PersonalDataWrapperDiv.style.display === 'block'){
          Elements.PersonalDataWrapperDiv.style.display = 'none'
          Elements.PersonalDataCollapseButton.innerText = ' + ';
     }else{
          Elements.PersonalDataWrapperDiv.style.display = 'block'
          Elements.PersonalDataCollapseButton.innerText = ' - ';

     }
})


Elements.ResidenceDataCollapseButton.addEventListener('click', () => {
     if(Elements.ResidenceDataWrapperDiv.style.display === 'block'){
          Elements.ResidenceDataWrapperDiv.style.display = 'none'
          Elements.ResidenceDataCollapseButton.innerText = ' + ';
     }else{
          Elements.ResidenceDataWrapperDiv.style.display = 'block'
          Elements.ResidenceDataCollapseButton.innerText = ' - ';

     }
})

Elements.CancelCardReadButton.addEventListener('click', ()=> {
     window.api.cancelCardReader();
})

Elements.PrintButton.addEventListener('click', () => {
     window.api.printPdf()
})