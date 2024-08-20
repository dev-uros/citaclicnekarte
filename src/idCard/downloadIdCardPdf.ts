import {BrowserWindow, dialog} from "electron";
import fs from "fs";

export async function downloadIdCardPdf(browserWindow: BrowserWindow, givenName: string, surname: string, pdfFile: Uint8Array){
    const {canceled, filePath} = await dialog.showSaveDialog(browserWindow, {
        filters: [{name: 'PDFs', extensions: ['pdf']}],
        defaultPath: `${givenName.toLowerCase()}_${surname.toLowerCase()}.pdf`,
    });

    if (!canceled && filePath) {
        fs.writeFileSync(filePath, pdfFile);
        return filePath;
    }
    return null;
}
