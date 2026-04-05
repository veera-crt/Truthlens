import os
import json
import random
import time
from datetime import datetime
import pytz
from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv
import google.generativeai as genai
from flask_apscheduler import APScheduler
from flask import session
import hashlib
import math # Used for the simple Euclidean match
from cryptography.fernet import Fernet

load_dotenv()

# India Standard Time setup
IST = pytz.timezone('Asia/Kolkata')

from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
app.secret_key = os.environ.get("SECRET_KEY", "TRUTHLENS-BIO-SHIELD-X92-2026")

# Essential Session Security for Cross-Origin (Render Frontend -> Render Backend)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_HTTPONLY=True,
    PERMANENT_SESSION_LIFETIME=240 # 4 Minutes
)

# Enable CORS globally with explicit origins and methods to satisfy browser preflight checks
CORS(app, resources={r"/api/*": {
    "origins": [
        "http://127.0.0.1:5500", 
        "http://localhost:5500", 
        "https://truthlens-1-bp8s.onrender.com",
        "https://truthlens-vyp1.onrender.com"
    ],
    "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"]
}}, supports_credentials=True)

# The specific Google Sheet Document ID
SHEET_ID = os.environ.get("SHEET_ID")

# Authentication Helper
def is_logged_in():
    return session.get("logged_in") == True

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.json
    if not data: return jsonify({"error": "No data"}), 400
    
    # 1. Input Data
    input_user = data.get("username", "")
    input_pass = data.get("password", "")
    
    # 2. Vault Settings
    user_hash_stored = os.environ.get("ADMIN_USER_HASH")
    pass_hash_stored = os.environ.get("ADMIN_PASS_HASH")
    user_aes_stored = os.environ.get("ADMIN_USER_AES")
    pass_aes_stored = os.environ.get("ADMIN_PASS_AES")
    encryption_key = os.environ.get("ENCRYPTION_KEY")
    
    try:
        # PHASE A: Hash Validation (O(1) fast check)
        input_user_hash = hashlib.sha256(input_user.encode()).hexdigest()
        input_pass_hash = hashlib.sha256(input_pass.encode()).hexdigest()
        
        if input_user_hash != user_hash_stored or input_pass_hash != pass_hash_stored:
            return jsonify({"error": "Phase A: Bio-Shield Hash Mismatch"}), 401
            
        # PHASE B: AES-256 Decryption Validation (Deep Check)
        cipher = Fernet(encryption_key.encode())
        decrypted_user = cipher.decrypt(user_aes_stored.encode()).decode()
        decrypted_pass = cipher.decrypt(pass_aes_stored.encode()).decode()
        
        if input_user == decrypted_user and input_pass == decrypted_pass:
            # PHASE 1 CLEARED: Store temporary verification state
            session["phase1_verified"] = True
            session.permanent = True
            return jsonify({
                "status": "partial_success", 
                "message": "Phase 1 Cleared: Credentials Match. Biometric Scan required."
            })
            
    except Exception as e:
        print(f"[!] Bio-Shield Logic Error: {e}")
        return jsonify({"error": "Bio-Shield Integrity Failure"}), 500
        
    return jsonify({"error": "Invalid Bio-Shield Credentials"}), 401

@app.route("/api/auth/verify-face", methods=["POST"])
def auth_verify_face():
    if not session.get("phase1_verified"):
        return jsonify({"error": "Phase 1 must be completed first"}), 403
    
    data = request.json
    if not data or 'descriptor' not in data:
        return jsonify({"error": "No biometric data transmitted."}), 400
        
    try:
        # Load the Master Profile: Prefer .env, fallback to vault file
        master_desc_raw = os.environ.get("ADMIN_BIO_DESCRIPTOR")
        if master_desc_raw:
            master_desc = json.loads(master_desc_raw)
        else:
            vault_path = os.path.join(os.path.dirname(__file__), ".bioshield_vault.json")
            if not os.path.exists(vault_path):
                return jsonify({"error": "No face registered. Bio-Shield Locked."}), 404
            with open(vault_path, "r") as f:
                vault = json.load(f)
                master_desc = vault['descriptor']
            
        live_desc = data['descriptor']
        
        # Pure Python Euclidean Distance Comparison
        # formula: sqrt(sum((x - y)^2 for x, y in zip(master, live)))
        distance = math.sqrt(sum((x - y)**2 for x, y in zip(master_desc, live_desc)))
        
        # 0.65 is a more reliable threshold for varies lighting conditions
        if distance < 0.65:
            session["logged_in"] = True
            session.pop("phase1_verified", None)
            return jsonify({
                "status": "success", 
                "message": f"MATCH DETECTED (Δ:{round(distance, 3)}). ACCESS GRANTED."
            })
        else:
            return jsonify({
                "status": "fail", 
                "message": f"MATCH REJECTED (Δ:{round(distance, 3)}). BIO-SHIELD ENGAGED."
            }), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"status": "logged_out"})

@app.route("/api/auth/register-biometrics", methods=["POST"])
def auth_register_biometrics():
    """Captures and archives the initial authorized face profile."""
    if not session.get("phase1_verified"):
        return jsonify({"error": "Auth phase 1 required"}), 403
    
    data = request.json
    if not data or 'descriptor' not in data:
        return jsonify({"error": "No biometric data to archive"}), 400
        
    try:
        vault_path = os.path.join(os.path.dirname(__file__), ".bioshield_vault.json")
        with open(vault_path, "w") as f:
            json.dump({"descriptor": data['descriptor'], "timestamp": str(datetime.now())}, f)
            
        # Create the legacy marker for backward compatibility checks
        marker_path = os.path.join(os.path.dirname(__file__), ".bioshield_registered")
        with open(marker_path, "w") as m: m.write("veerapandi-authorized")
        
        session["logged_in"] = True
        session.pop("phase1_verified", None)
        
        # LOGGING FOR PERSISTENCE: Print to Render logs so the user can save to .env
        print(f"\n[BIO-VAULT-EXPORT] Copy this to your Render 'ADMIN_BIO_DESCRIPTOR' env variable:")
        print(json.dumps(data['descriptor']))
        print("-" * 50 + "\n")
        
        return jsonify({
            "status": "success", 
            "message": "Biometric Identity Archived.",
            "vault_descriptor": data['descriptor'] # Also returned so you can see it in Browser Inspect -> Network
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/auth/check-registration", methods=["GET"])
def auth_check_registration():
    """Check if a biometric profile already exists in the vault or .env."""
    if os.environ.get("ADMIN_BIO_DESCRIPTOR"):
        return jsonify({"registered": True})
    vault_path = os.path.join(os.path.dirname(__file__), ".bioshield_vault.json")
    return jsonify({"registered": os.path.exists(vault_path)})

@app.route("/api/auth/check", methods=["GET"])
def auth_check():
    return jsonify({"logged_in": is_logged_in()})
GEMINI_KEYS = [os.environ.get("GEMINI_KEY_1"), os.environ.get("GEMINI_KEY_2")]

SCOPE = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive"
]

# Scheduler Setup
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

# In-Memory Cache (TTL)
APP_CACHE = {}
CACHE_TTL = 30 # Seconds to keep data safe in memory before a fresh fetch

def get_sheet(worksheet_name=None):
    """Authenticate and return the targeted Google Sheet."""
    if not SHEET_ID:
        return None
        
    try:
        # Load from .env JSON string
        gcp_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
        if not gcp_json:
            print("[!] Bio-Shield Error: GOOGLE_SERVICE_ACCOUNT_JSON missing from .env")
            return None
            
        creds_info = json.loads(gcp_json)
        creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_info, SCOPE)
            
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key(SHEET_ID)
        
        if worksheet_name:
            try:
                sheet = spreadsheet.worksheet(worksheet_name)
            except gspread.exceptions.WorksheetNotFound:
                print(f"[*] Creating new worksheet: {worksheet_name}")
                if worksheet_name == 'blog':
                    sheet = spreadsheet.add_worksheet(title=worksheet_name, rows="1000", cols="8")
                    sheet.append_row(["ID", "Title", "Category", "Author", "Date", "Excerpt", "Image URL", "Content"])
                elif worksheet_name == 'schedules':
                    sheet = spreadsheet.add_worksheet(title=worksheet_name, rows="1000", cols="5")
                    sheet.append_row(["Timestamp", "Status", "Triggered By", "Result", "Post ID"])
                elif worksheet_name == 'settings':
                    sheet = spreadsheet.add_worksheet(title=worksheet_name, rows="10", cols="5")
                    sheet.append_row(["Enabled", "Time"])
                elif worksheet_name == 'upcomings':
                    sheet = spreadsheet.add_worksheet(title=worksheet_name, rows="1000", cols="9")
                    sheet.append_row(["ID", "Title", "Category", "Author", "Date", "Excerpt", "Image URL", "Content", "Scheduled_IST"])
                else:
                    sheet = spreadsheet.add_worksheet(title=worksheet_name, rows="1000", cols="10")
            return sheet
        else:
            return spreadsheet.sheet1
    except Exception as e:
        print(f"[!] Sheets Error: {e}")
        return None

def call_gemini(prompt):
    """Call Gemini with fallback between keys and models."""
    # Prioritizing the latest Gemini 2.0 Flash Lite model
    models_to_try = [
        'gemini-2.0-flash-lite-preview-02-05',
        'gemini-flash-lite-latest',
        'gemini-2.0-flash', 
        'gemini-1.5-flash',
        'gemini-pro'
    ]
    
    for key in GEMINI_KEYS:
        if not key: continue
        try:
            genai.configure(api_key=key)
            
            for model_name in models_to_try:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    
                    if response and response.text:
                        return response.text
                except Exception as model_err:
                    print(f"[*] Tried model {model_name}... failed: {str(model_err)[:100]}")
                    continue
        except Exception as key_err:
            print(f"[!] Key initialization failed: {key_err}")
            continue
    return None

def generate_autopilot_post():
    """Use AI to generate a creative historical/trending blog post."""
    theme = random.choice(["World War 2 hidden secrets", "Ancient Roman mysteries", "Modern Cyber Warfare", "Cold War Espionage", "The Future of AI ethics"])
    category = random.choice(["wars-history", "technology", "current-affairs"])
    
    prompt = f"""
    Write a high-quality, professional, and viral blog post about: {theme}.
    The style should be authoritative but engaging, like a leading modern editorial site.
    
    CRITICAL FORMATTING RULES:
    1. Use semantic HTML only. Wrap everything in <p> tags.
    2. Use <h2> and <h3> for clear, professional section headings.
    3. Use <b> elements for bold emphasis on key names, dates, or concepts.
    4. Include at least TWO <blockquote> elements for impactful quotes.
    5. Mention helpful external topics with <a> links (use placeholder URLs like #).
    6. Include [[IMAGE_HERE]] at least twice at natural breaking points in the text for visual flow.
    7. Minimum word count: 400.
    
    Return ONLY a JSON object with these EXACT keys:
    "title": "a catchy, viral-style title UNDER 50 CHARACTERS",
    "excerpt": "a 1-2 sentence extremely engaging summary UNDER 150 CHARACTERS",
    "content": "the full HTML content string following all rules above",
    "keyword": "one single highly descriptive word for background image generation"
    """
    
    response_text = call_gemini(prompt)
    if not response_text: return None
    
    try:
        # Clean potential markdown backticks from gemini
        clean_json = response_text.replace('```json', '').replace('```', '').strip()
        data = json.loads(clean_json)
        data['category'] = category
        
        # Replace image placeholders with actual random source images
        # We use different seeds to ensure variety
        content_html = data['content']
        image_seeds = [f"seed-{int(time.time())}-1", f"seed-{int(time.time())}-2", f"seed-{int(time.time())}-3"]
        for seed in image_seeds:
            img_html = f'<div class="post-inline-image"><img src="https://picsum.photos/seed/{seed}/900/500" alt="Viral Blog Illustration" style="width: 100%; border-radius: 8px; margin: 2rem 0;" /></div>'
            content_html = content_html.replace('[[IMAGE_HERE]]', img_html, 1)
            
        data['content'] = content_html
        return data
    except Exception as e:
        print(f"[!] Autopilot cleaning error: {e}")
        return None

def get_settings():
    """Retrieve autopilot settings with 30s caching."""
    now = time.time()
    if "settings" in APP_CACHE and now - APP_CACHE["settings"]["time"] < CACHE_TTL:
        return APP_CACHE["settings"]["data"]

    try:
        sheet = get_sheet("settings")
        if not sheet: return {"enabled": False, "time": "18:00"}
        values = sheet.get_all_values()
        if len(values) > 1 and len(values[1]) >= 2:
            data = { "enabled": str(values[1][0]).upper() == "TRUE", "time": str(values[1][1]) }
            APP_CACHE["settings"] = {"time": now, "data": data}
            return data
    except Exception as e:
        print(f"[!] Settings fetch error: {e}")
    return {"enabled": False, "time": "18:00"}

def autopilot_job():
    """The 'Sentinel' check running every minute, locked to IST."""
    now = datetime.now(IST)
    print(f"[*] IST Sentinel Wake-up: {now.strftime('%H:%M')}")
    
    settings = get_settings()
    if not settings.get("enabled", False):
        print("[*] Autopilot is OFF. Sleeping.")
        return

    # Check if we have met or crossed the exact scheduled time for TODAY
    try:
        # Create a datetime object for today at the scheduled time
        sched_time_str = settings.get("time", "18:00")
        target_time = datetime.strptime(sched_time_str, "%H:%M").time()
        target_dt = IST.localize(datetime.combine(now.date(), target_time))
        
        if now < target_dt:
            print(f"[*] Waiting until {sched_time_str} IST. Total gap: {(target_dt - now)}")
            return
            
    except Exception as e:
        print(f"[!] Time parse error: {e}")
        return

    print(f"[*] Window Active! Searching for publications...")
    blog_sheet = get_sheet("blog")
    sched_sheet = get_sheet("schedules")
    upcoming_sheet = get_sheet("upcomings")
    today_str = now.strftime("%b %d, %Y")
    
    try:
        # 1. CHECK SCHEDULED (UPCOMINGS) - Highest Priority
        all_up = upcoming_sheet.get_all_values() if upcoming_sheet else []
        if len(all_up) > 1:
            for idx, row in enumerate(all_up[1:]):
                # Row Structure: [ID, Title, Category, Author, Date, Excerpt, Image, Content, TargetIST]
                if len(row) >= 9:
                    target_time_str = row[8] # HH:MM
                    try:
                        target_t = datetime.strptime(target_time_str, "%H:%M").time()
                        if now.time() >= target_t:
                            # MOVE TO BLOG
                            new_blog_row = row[:8] # First 8 columns
                            blog_sheet.append_row(new_blog_row)
                            # REMOVE FROM UPCOMING (Excel is 1-indexed, +1 for header, +1 for row)
                            upcoming_sheet.delete_rows(idx + 2)
                            # LOG SUCCESS
                            if sched_sheet: 
                                sched_sheet.append_row([str(now.strftime("%Y-%m-%d %H:%M:%S")), "Success", "Scheduled-Manual", f"Published Upcoming: {row[1]}", row[0]])
                            print(f"[*] UPCOMING PUBLISHED SUCCESS: {row[1]}")
                            return # Mission completed for this window
                    except: continue

        # 2. CHECK ALREADY PUBLISHED TODAY (LOGS)
        all_sched = sched_sheet.get_all_values() if sched_sheet else []
        already_auto_success = False
        if len(all_sched) > 1:
            for row in all_sched[1:]:
                if len(row) >= 2:
                    if str(row[0]).startswith(now.strftime("%Y-%m-%d")) and row[1] == "Success":
                        already_auto_success = True
                        break
        
        if already_auto_success:
            print(f"[*] Success logged for {now.strftime('%Y-%m-%d')}. Rest Mode.")
            return

        # 3. CHECK BLOG (MANUAL OVERRIDE)
        all_blogs = blog_sheet.get_all_values() if blog_sheet else []
        already_posted_manual = False
        if len(all_blogs) > 1:
            for row in all_blogs[1:]:
                if len(row) >= 5 and str(row[4]).strip() == today_str:
                    already_posted_manual = True
                    break
        
        if already_posted_manual:
            print("[*] Today's blog is already on the sheet. Skipping.")
            return
            
        # 3. All clear? Let's write.
        print("[*] Scan confirmed: Generating a high-performance Gemini post...")
        post_data = generate_autopilot_post()
        if post_data:
            post_id = f"auto-{int(time.time())}"
            image_url = f"https://picsum.photos/seed/{post_id}/800/500"
            new_row = [post_id, post_data['title'], post_data['category'], "Veerapandi", today_str, post_data['excerpt'], image_url, post_data['content']]
            blog_sheet.append_row(new_row)
            
            if sched_sheet: 
                sched_sheet.append_row([str(now.strftime("%Y-%m-%d %H:%M:%S")), "Success", "Autopilot", f"Posted: {post_data['title']}", post_id])
            print(f"[*] AUTO-PUBLISH SUCCESS: {post_data['title']}")
    except Exception as e:
        print(f"[!] Sentinel Scan Error: {e}")

# Routes
@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "Truthlens AI Autopilot",
        "timezone": "IST",
        "message": "Backend API is running and synchronized."
    })

@app.route("/api/autopilot/settings", methods=["GET", "POST"])
def manage_settings():
    sheet = get_sheet("settings")
    if not sheet: return jsonify({"error": "No sheet"}), 500
    
    if request.method == "POST":
        data = request.json
        if not data: return jsonify({"error": "No data"}), 400
        
        try:
            # We enforce a single-row "Singleton" settings pattern
            enabled_val = str(data.get('enabled', False)).upper()
            time_val = data.get('time', '18:00')
            
            # Use sheet.update to precisely set Row 1 (Headers) and Row 2 (Data)
            # This wipes everything and ensures only 2 rows exist
            sheet.update('A1:B2', [
                ["Enabled", "Time"],
                [enabled_val, time_val]
            ])
            
            return jsonify({"status": "success", "message": "Settings locked and unique."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
            
    # GET
    return jsonify(get_settings())

@app.route("/api/blog/data", methods=["GET"])
def get_blog_posts():
    """Fetch all blog posts from Sheet with 30s cache."""
    now = time.time()
    if "blog_data" in APP_CACHE and now - APP_CACHE["blog_data"]["time"] < CACHE_TTL:
        return jsonify({"status": "success", "data": APP_CACHE["blog_data"]["data"]})

    sheet = get_sheet("blog")
    if not sheet: return jsonify({"error": "No sheet"}), 500
    try:
        records = sheet.get_all_records()
        APP_CACHE["blog_data"] = {"time": now, "data": records}
        return jsonify({"status": "success", "data": records})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/blog/add", methods=["POST"])
def add_blog_post():
    sheet = get_sheet("blog")
    data = request.json
    if not sheet or not data: return jsonify({"error": "Invalid"}), 400
    sheet.append_row(data['values'])
    return jsonify({"status": "success"})

@app.route("/api/blog/schedule", methods=["POST"])
def schedule_blog_post():
    APP_CACHE.clear()
    sheet = get_sheet("upcomings")
    data = request.json
    if not sheet or not data: return jsonify({"error": "Invalid"}), 400
    sheet.append_row(data['values'])
    return jsonify({"status": "success", "message": "Post queued in upcomings."})

@app.route("/api/add", methods=["POST"])
def add_newsletter():
    """Generic endpoint for newsletter and other small data streams."""
    sheet = get_sheet("newsletter")
    data = request.json
    if not sheet or not data: return jsonify({"error": "Invalid"}), 400
    try:
        sheet.append_row(data['values'])
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/blog/upcomings", methods=["GET"])
def get_upcoming_posts():
    """Fetch all upcoming posts from Sheet with 30s cache."""
    now = time.time()
    if "upcomings" in APP_CACHE and now - APP_CACHE["upcomings"]["time"] < CACHE_TTL:
        return jsonify({"status": "success", "data": APP_CACHE["upcomings"]["data"]})

    sheet = get_sheet("upcomings")
    if not sheet: return jsonify({"error": "No sheet"}), 500
    try:
        values = sheet.get_all_values()
        if len(values) <= 1: return jsonify({"status": "success", "data": []})
        headers = values[0]
        data = []
        for row in values[1:]:
            if not row or not any(row): continue
            obj = {h: row[i] if i < len(row) else "" for i, h in enumerate(headers)}
            data.append(obj)
        
        APP_CACHE["upcomings"] = {"time": now, "data": data}
        return jsonify({"status": "success", "data": data})
    except Exception as e:
        print(f"[!] Upcomings fetch error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/blog/edit", methods=["POST"])
def edit_blog_post():
    APP_CACHE.clear()
    sheet = get_sheet("blog")
    data = request.json
    if not sheet or not data or 'id' not in data: return jsonify({"error": "Invalid"}), 400
    try:
        cell = sheet.find(str(data['id']), in_column=1)
        if cell:
            row = cell.row
            cells = sheet.range(row, 1, row, len(data['values']))
            for i, val in enumerate(data['values']): cells[i].value = str(val)
            sheet.update_cells(cells)
            return jsonify({"status": "success"})
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/blog/delete", methods=["POST"])
def delete_blog_post():
    APP_CACHE.clear()
    sheet = get_sheet("blog")
    data = request.json
    if not sheet or not data or 'id' not in data: return jsonify({"error": "Invalid"}), 400
    try:
        cell = sheet.find(str(data['id']), in_column=1)
        if cell:
            sheet.delete_rows(cell.row)
            return jsonify({"status": "success"})
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/ai/generate", methods=["POST"])
def manual_ai_generate():
    """Manual drafting endpoint for the dashboard."""
    data = generate_autopilot_post()
    if data:
        return jsonify({"status": "success", "data": data})
    return jsonify({"error": "AI could not generate content. Check logs."}), 500

@app.route("/api/autopilot/trigger", methods=["GET", "POST"])
def manual_trigger():
    """Force an autopilot run immediately."""
    autopilot_job()
    return jsonify({"status": "success", "message": "Autopilot routine executed. Check Sheets."})

# Initial Schedule (Default 6 PM - will be updated by settings)
# Run the Sentinel every 1 minute to ensure high precision
scheduler.add_job(id='autopilot_sentinel', func=autopilot_job, trigger='interval', minutes=1)

if __name__ == "__main__":
    print(f"[*] Starting Truthlens Backend Server on port 5001")
    app.run(debug=True, port=5001, use_reloader=False) # use_reloader=False prevents double scheduler trigger
