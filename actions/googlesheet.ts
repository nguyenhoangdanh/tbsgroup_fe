"use server";
import { google } from "googleapis";
import path from "path";

export const appendToGoogleSheet = async (values: any[][]) => {
  try {
    // Load the service account key JSON file
    const keyFilePath = path.join(
      process.cwd(),
      process.env.SERVICE_ACCOUNT_KEY_PATH || ""
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

export const updateGoogleSheetCell = async (range: string, value: string) => {
  try {
    // Load the service account key JSON file
    const keyFilePath = path.join(
      process.cwd(),
      process.env.SERVICE_ACCOUNT_KEY_PATH || ""
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const request = {
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range, // Adjust the range to the cell you want to update
      valueInputOption: "RAW",
      resource: {
        values: [[value]],
      },
    };

    await sheets.spreadsheets.values.update(request);
  } catch (error) {
    console.error("Failed to update Google Sheets cell:", error);
  }
};

export const readFromGoogleSheet = async (range: string) => {
  try {
    // Load the service account key JSON file
    const keyFilePath = path.join(
      process.cwd(),
      process.env.SERVICE_ACCOUNT_KEY_PATH || ""
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: range, // Specify the range to read data from
    });

    return response.data.values;
  } catch (error) {
    console.error("Failed to read data from Google Sheets:", error);
    return null;
  }
};
