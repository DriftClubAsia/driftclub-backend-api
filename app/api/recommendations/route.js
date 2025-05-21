import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GOOGLE_SHEETS_CREDENTIALS = process.env.GOOGLE_SHEETS_CREDENTIALS;
const SHEET_ID = process.env.SHEET_ID;

function getGoogleSheetsClient() {
  if (!GOOGLE_SHEETS_CREDENTIALS) {
    throw new Error('Missing GOOGLE_SHEETS_CREDENTIALS environment variable');
  }
  try {
    const credentials = JSON.parse(GOOGLE_SHEETS_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
  } catch (err) {
    console.error('Failed to parse GOOGLE_SHEETS_CREDENTIALS:', err.message);
    throw err;
  }
}

export async function GET(req) {
  try {
    const sheets = getGoogleSheetsClient();
    const { searchParams } = new URL(req.url, 'http://localhost');
    const theme = searchParams.get('theme');
    const region = searchParams.get('region');

    const range = 'Sheet1!A1:Z1000';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range,
    });

    const rows = response.data.values;
    const headers = rows[0];
    const data = rows.slice(1).map((row) => {
      const item = {};
      headers.forEach((header, i) => {
        item[header.trim()] = row[i];
      });
      const allowedFields = ['Name', 'Theme', 'Latitude', 'Longitude', 'Description'];
      const filteredItem = Object.fromEntries(
        Object.entries(item).filter(([key]) => allowedFields.includes(key))
      );
      return filteredItem;
    });

    const filtered = data.filter((item) => {
      const themeMatch = theme ? item.Theme?.toLowerCase().includes(theme.toLowerCase()) : true;
      const regionMatch = region ? (
        item.Latitude?.toLowerCase().includes(region.toLowerCase()) ||
        item.Longitude?.toLowerCase().includes(region.toLowerCase())
      ) : true;
      return themeMatch && regionMatch;
    });

    return NextResponse.json({ results: filtered });
  } catch (err) {
    console.error('Google Sheets ERROR:', err.message);
    console.error(err.stack);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
