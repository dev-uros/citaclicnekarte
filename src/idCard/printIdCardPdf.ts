import {BrowserWindow} from "electron";

export async function printIdCardPdf(pdfBase64: string) {
    const printWindow = new BrowserWindow({show: true});

    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    try {
        await printWindow.loadURL(pdfDataUrl);


    } catch (error) {
        console.error('Failed to load URL:', error);
    }


}
