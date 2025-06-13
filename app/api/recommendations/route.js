// route.js — API handler for /api/recommendations (Next.js App Router)

import { google } from 'googleapis';

function fuzzyMatch(input = '', target = '', threshold = 0.6) {
  if (!input || !target) return false;
  input = input.toLowerCase();
  target = target.toLowerCase();

  let matches = 0;
  let i = 0, j = 0;

  while (i < input.length && j < target.length) {
    if (input[i] === target[j]) {
      matches++;
      i++;
    }
    j++;
  }

  const score = matches / input.length;
  return score >= threshold;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const theme = searchParams.get('theme');
  const name = searchParams.get('name');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const description = searchParams.get('description');

  if (!theme && !name && !description && !(lat && lng)) {
    return new Response(JSON.stringify({ error: 'Missing search parameters' }), { status: 400 });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        type: process.env.GOOGLE_TYPE,
        project_id: process.env.GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const spreadsheetId = process.env.SHEET_ID;
    const range = 'Sheet1!A2:E';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    const rows = response.data.values || [];
    console.log("📄 Raw Sheet Rows:", rows);
    console.log("🔍 Search Params:", { theme, name, description, lat, lng });

    const results = rows
      .map(([Name, Theme, Latitude, Longitude, Description]) => ({
        Name,
        Theme,
        Latitude: parseFloat(Latitude),
        Longitude: parseFloat(Longitude),
        Description
      }))
      .filter(row => {
        const matches = [
          theme ? fuzzyMatch(theme, row.Theme) : false,
          name ? fuzzyMatch(name, row.Name) : false,
          description ? fuzzyMatch(description, row.Description) : false,
          lat && lng ? Math.abs(row.Latitude - parseFloat(lat)) < 0.001 && Math.abs(row.Longitude - parseFloat(lng)) < 0.001 : false
        ];
        return matches.some(Boolean);
      });

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('❌ Google Sheets fetch failed:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
