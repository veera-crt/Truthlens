import os
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

# Load env vars from .env
load_dotenv()

# Config
KEYFILE = 'jarvis-489818-06812802bc0e.json'
SHEET_ID = os.environ.get("SHEET_ID")
SCOPE = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']

def init_upcoming_sheet():
    print(f"[*] Initializing 'upcomings' tab in Spreadsheet: {SHEET_ID}")
    try:
        if not SHEET_ID:
            print("[!] Error: SHEET_ID not found in .env file.")
            return

        creds = ServiceAccountCredentials.from_json_keyfile_name(KEYFILE, SCOPE)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SHEET_ID)
        
        # Check if worksheet already exists
        try:
            spreadsheet.worksheet("upcomings")
            print("[!] 'upcomings' tab already exists. No action needed.")
        except gspread.exceptions.WorksheetNotFound:
            print("[*] Creating 'upcomings' worksheet...")
            sheet = spreadsheet.add_worksheet(title="upcomings", rows="1000", cols="9")
            # Set Headers
            headers = ["ID", "Title", "Category", "Author", "Date", "Excerpt", "Image URL", "Content", "Scheduled_IST"]
            sheet.append_row(headers)
            print("[+] Success: 'upcomings' tab created with correct headers.")

    except Exception as e:
        print(f"[!] Critical Error: {e}")

if __name__ == "__main__":
    init_upcoming_sheet()
