import { google } from "googleapis";
import path from "path";

export const appendToGoogleSheet = async (values: any[][]) => {
  try {
    // Load the service account key JSON file
    const keyFilePath = path.join(
      process.cwd(),
      process.env.SERVICE_ACCOUNT_KEY_PATH
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const request = {
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A1", // Adjust the range as necessary
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values,
      },
    };

    await sheets.spreadsheets.values.append(request);
  } catch (error) {
    console.error("Failed to append data to Google Sheets:", error);
  }
};
