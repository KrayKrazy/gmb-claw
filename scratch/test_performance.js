import { google } from 'googleapis';
import { config } from '../config.js';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');
const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));

const oauth2Client = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret
);
oauth2Client.setCredentials(tokens);

const businessprofileperformance = google.businessprofileperformance({
    version: 'v1',
    auth: oauth2Client
});

async function test() {
    try {
        const res = await businessprofileperformance.locations.getDailyMetricsTimeSeries({
            name: 'locations/6026374336492365578', // CFGIFTS presentes
            dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
            'dailyRange.endDate.year': 2026,
            'dailyRange.endDate.month': 5,
            'dailyRange.endDate.day': 12,
            'dailyRange.startDate.year': 2026,
            'dailyRange.startDate.month': 4,
            'dailyRange.startDate.day': 12,
        });
        console.log("Success:", JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error("Error getDailyMetricsTimeSeries 1:", error.message);
    }
    
    try {
        const res = await businessprofileperformance.locations.getDailyMetricsTimeSeries({
            name: 'locations/6026374336492365578',
            dailyMetric: 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS',
            dailyRange: {
                endDate: { year: 2026, month: 5, day: 12 },
                startDate: { year: 2026, month: 4, day: 12 }
            }
        });
        console.log("Success:", JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error("Error getDailyMetricsTimeSeries 2:", error.message);
    }
    
    try {
        const res = await businessprofileperformance.locations.searchkeywords.impressions.monthly.list({
            parent: 'locations/6026374336492365578',
            'monthlyRange.startMonth.year': 2026,
            'monthlyRange.startMonth.month': 1,
            'monthlyRange.endMonth.year': 2026,
            'monthlyRange.endMonth.month': 5
        });
        console.log("Success Keywords 1:", JSON.stringify(res.data, null, 2));
    } catch(e) {
        console.error("Error keywords 1:", e.message);
    }

    try {
        const res = await businessprofileperformance.locations.searchkeywords.impressions.monthly.list({
            parent: 'locations/6026374336492365578'
        });
        console.log("Success Keywords 2:", JSON.stringify(res.data, null, 2));
    } catch(e) {
        console.error("Error keywords 2:", e.message);
    }
}
test();
