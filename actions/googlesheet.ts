"use server";
import { google } from "googleapis";
import path from "path";


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

export const readFromGoogleSheet = async (sheetId?: string, range: string = 'Sheet1!A1:Z1000') => {
  try {
    // Xác thực với credentials từ biến môi trường
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID_DATA,
      range: range,
    });

    if (!response.data.values || response.data.values.length === 0) {
      console.log("Sheet is empty or no data found in range:", range);
      return [];
    }

    return response.data.values;
  } catch (error) {
    console.error("Failed to read data from Google Sheets:", error);
    return null;
  }
};

export const appendToGoogleSheet = async (values: any[][]): Promise<any> => {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error('Dữ liệu đầu vào không hợp lệ. Yêu cầu mảng 2 chiều.');
  }
  
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "{}"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    
    const sheets = google.sheets({ version: "v4", auth });
    
    const request = {
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A1", // Điều chỉnh range nếu cần
      valueInputOption: "RAW", // hoặc "USER_ENTERED" nếu muốn Google Sheets phân tích cú pháp
      insertDataOption: "INSERT_ROWS",
      resource: {
        values,
      },
    };
    
    const response = await sheets.spreadsheets.values.append(request);
    return response.data;
  } catch (error) {
    console.error("Failed to append data to Google Sheets:", error);
    throw new Error(`Không thể thêm dữ liệu vào Google Sheets: ${error}`);
  }
};