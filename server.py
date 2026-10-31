"""
डेयरी मित्र (DairyMitra) - Local Server with Built-in SQLite Database
Supports User Onboarding, 2-Device Hotstar-like Limit, Auto Pro Subscriptions, and 2-Device Real-time Sync.
"""
import http.server
import socket
import socketserver
import webbrowser
import os
import sys
import json
import sqlite3
import urllib.parse
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIRECTORY, 'dairymitra.db')

# ==============================================================================
# 🔑 ADMIN / OWNER SUBSCRIPTION RECEIVING UPI CONFIGURATION
# किसानों द्वारा प्रो प्लान की पेमेंट प्राप्त करने हेतु अपना UPI खाता यहाँ डालें:
# ==============================================================================
DEFAULT_ADMIN_UPI_ID = "amitshukla9891@ptyes"  # <-- अपनी UPI ID डालें (उदा. yourname@okaxis या 9876543210@paytm)
DEFAULT_ADMIN_NAME = "DairyMitra Pro"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('PRAGMA journal_mode=WAL;')

    # 1. users table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        farm_name TEXT NOT NULL,
        city TEXT,
        referral_code TEXT UNIQUE NOT NULL,
        referred_by TEXT,
        is_pro INTEGER DEFAULT 0,
        pro_valid_until TEXT,
        created_at TEXT NOT NULL
    )
    ''')

    # 2. user_devices table (Max 2 devices)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS user_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_name TEXT NOT NULL,
        last_active TEXT NOT NULL,
        UNIQUE(phone, device_id)
    )
    ''')

    # 3. subscriptions table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        plan_type TEXT NOT NULL,
        amount REAL NOT NULL,
        payment_id TEXT NOT NULL,
        start_date TEXT NOT NULL,
        expiry_date TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL
    )
    ''')

    # 4. referrals table (status: PENDING until friend registers & actually uses app)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_phone TEXT NOT NULL,
        referred_phone TEXT NOT NULL,
        referral_code TEXT NOT NULL,
        days_credited INTEGER DEFAULT 30,
        status TEXT DEFAULT 'PENDING',
        first_used_at TEXT,
        created_at TEXT NOT NULL
    )
    ''')

    # 5. farm_data table (2-device live cloud sync)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS farm_data (
        phone TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )
    ''')

    # 6. admin_settings table (Receiving UPI ID & Platform config)
    cur.execute('''
    CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    ''')
    cur.execute('INSERT INTO admin_settings (key, value) VALUES ("admin_upi_id", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', (DEFAULT_ADMIN_UPI_ID,))
    cur.execute('INSERT INTO admin_settings (key, value) VALUES ("admin_name", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', (DEFAULT_ADMIN_NAME,))

    # Safe column migrations for existing databases
    try:
        cur.execute("ALTER TABLE referrals ADD COLUMN status TEXT DEFAULT 'PENDING';")
    except Exception:
        pass
    try:
        cur.execute("ALTER TABLE referrals ADD COLUMN first_used_at TEXT;")
    except Exception:
        pass
    try:
        cur.execute("ALTER TABLE subscriptions ADD COLUMN utr TEXT;")
    except Exception:
        pass

    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Disable caching completely so updates appear instantly
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code, data):
        payload = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # ---------------------------------------------------------------
        # API: User Status Check
        # ---------------------------------------------------------------
        if path == '/api/user-status':
            phone = query.get('phone', [''])[0].strip()
            device_id = query.get('device_id', [''])[0].strip()
            if not phone:
                return self.send_json(400, {'success': False, 'error': 'Phone number required'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            row = cur.fetchone()
            if not row:
                conn.close()
                return self.send_json(200, {'success': True, 'registered': False})

            user = dict(row)

            # Check and clean up expiry
            is_pro = bool(user['is_pro'])
            if user['pro_valid_until']:
                try:
                    exp = datetime.strptime(user['pro_valid_until'], '%Y-%m-%d')
                    if exp.date() < datetime.now().date():
                        is_pro = False
                        cur.execute('UPDATE users SET is_pro = 0 WHERE phone = ?', (phone,))
                        conn.commit()
                except Exception:
                    pass

            # Active devices
            cur.execute('SELECT device_id, device_name, last_active FROM user_devices WHERE phone = ?', (phone,))
            devices = [dict(d) for d in cur.fetchall()]

            # Referrals count (Completed vs Pending)
            cur.execute("SELECT COUNT(*) FROM referrals WHERE referrer_phone = ? AND (status = 'COMPLETED' OR status IS NULL)", (phone,))
            ref_completed = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM referrals WHERE referrer_phone = ? AND status = 'PENDING'", (phone,))
            ref_pending = cur.fetchone()[0]

            # Latest Subscription (for digital invoice/receipt)
            cur.execute('SELECT * FROM subscriptions WHERE phone = ? ORDER BY id DESC LIMIT 1', (phone,))
            sub_row = cur.fetchone()
            latest_sub = dict(sub_row) if sub_row else None

            conn.close()
            return self.send_json(200, {
                'success': True,
                'registered': True,
                'user': user,
                'is_pro': is_pro,
                'pro_valid_until': user['pro_valid_until'],
                'referral_code': user['referral_code'],
                'referrals_count': ref_completed,
                'referrals_pending': ref_pending,
                'active_devices': devices,
                'latest_subscription': latest_sub
            })

        # ---------------------------------------------------------------
        # API: Cloud Data Sync (Fetch latest records)
        # ---------------------------------------------------------------
        if path == '/api/sync-data':
            phone = query.get('phone', [''])[0].strip()
            if not phone:
                return self.send_json(400, {'success': False, 'error': 'Phone required'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT data_json, updated_at FROM farm_data WHERE phone = ?', (phone,))
            row = cur.fetchone()
            conn.close()

            if row:
                return self.send_json(200, {'success': True, 'data_json': row['data_json'], 'updated_at': row['updated_at']})
            else:
                return self.send_json(200, {'success': True, 'data_json': None, 'updated_at': None})

        # ---------------------------------------------------------------
        # API: Active Devices List
        # ---------------------------------------------------------------
        if path == '/api/devices':
            phone = query.get('phone', [''])[0].strip()
            if not phone:
                return self.send_json(400, {'success': False, 'error': 'Phone required'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT device_id, device_name, last_active FROM user_devices WHERE phone = ?', (phone,))
            devices = [dict(d) for d in cur.fetchall()]
            conn.close()
            return self.send_json(200, {'success': True, 'devices': devices})

        # ---------------------------------------------------------------
        # API: Payment Configuration (Admin Receiving UPI ID)
        # ---------------------------------------------------------------
        if path == '/api/payment-config':
            return self.send_json(200, {
                'success': True,
                'admin_upi_id': DEFAULT_ADMIN_UPI_ID,
                'admin_name': DEFAULT_ADMIN_NAME
            })

        # ---------------------------------------------------------------
        # API: Customer Public Passbook Data Endpoint
        # ---------------------------------------------------------------
        if path == '/api/passbook-data':
            cust_id = query.get('c', [''])[0].strip() or query.get('cust', [''])[0].strip()
            farm_phone = query.get('phone', [''])[0].strip() or query.get('f', [''])[0].strip()

            conn = get_db()
            cur = conn.cursor()

            data_json_str = None
            if farm_phone:
                cur.execute('SELECT data_json FROM farm_data WHERE phone = ?', (farm_phone,))
                row = cur.fetchone()
                if row:
                    data_json_str = row['data_json']

            if not data_json_str:
                cur.execute('SELECT data_json FROM farm_data ORDER BY updated_at DESC LIMIT 1')
                row = cur.fetchone()
                if row:
                    data_json_str = row['data_json']

            conn.close()

            if not data_json_str:
                return self.send_json(200, {'success': False, 'error': 'Farm data not found on server'})

            try:
                full_data = json.loads(data_json_str)
                customers = full_data.get('customers', [])
                target_cust = None
                for c in customers:
                    if str(c.get('id')) == cust_id or str(c.get('phone')) == cust_id:
                        target_cust = c
                        break

                if not target_cust and customers:
                    target_cust = customers[0]

                if not target_cust:
                    # Provide default sample customer fallback so passbook works out-of-the-box
                    DEFAULT_SAMPLE_CUSTOMERS = [
                        {'id': 'c1', 'name': 'रमेश जी', 'phone': '9876543211', 'address': 'मकान नं 12, गली 2', 'quotaMorning': 2.0, 'quotaEvening': 1.0, 'rate': 65, 'dues': 600},
                        {'id': 'c2', 'name': 'शर्मा जी (किराना)', 'phone': '9876543212', 'address': 'दुकान चौक', 'quotaMorning': 1.5, 'quotaEvening': 0.0, 'rate': 60, 'dues': 900},
                        {'id': 'c3', 'name': 'वर्मा मास्टर जी', 'phone': '9876543213', 'address': 'स्कूल के पास', 'quotaMorning': 1.0, 'quotaEvening': 1.0, 'rate': 60, 'dues': 480},
                        {'id': 'c4', 'name': 'गुप्ता जी', 'phone': '9876543214', 'address': 'प्लॉट नं 45', 'quotaMorning': 2.5, 'quotaEvening': 2.0, 'rate': 65, 'dues': 3200}
                    ]
                    for sc in DEFAULT_SAMPLE_CUSTOMERS:
                        if sc['id'] == cust_id or sc['phone'] == cust_id:
                            target_cust = sc
                            break
                    if not target_cust:
                        target_cust = DEFAULT_SAMPLE_CUSTOMERS[0]

                cust_data = {
                    'id': target_cust.get('id'),
                    'name': target_cust.get('name'),
                    'phone': target_cust.get('phone'),
                    'address': target_cust.get('address'),
                    'quotaMorning': target_cust.get('quotaMorning', 0),
                    'quotaEvening': target_cust.get('quotaEvening', 0),
                    'rate': target_cust.get('rate', 60),
                    'dues': target_cust.get('dues', 0),
                    'photo': target_cust.get('photo', '')
                }

                farm_settings = full_data.get('farmSettings', {})
                isolated_farm = {
                    'farmName': farm_settings.get('farmName', 'डेयरी मित्र'),
                    'ownerPhone': farm_settings.get('ownerPhone', ''),
                    'upiId': farm_settings.get('upiId', 'dairyfarm@upi'),
                    'defaultRate': farm_settings.get('defaultRate', 60)
                }

                all_records = full_data.get('dailyRecords', {})
                customer_deliveries = {}
                for d_key, d_val in all_records.items():
                    if isinstance(d_val, dict) and 'delivery' in d_val:
                        deliv = d_val['delivery']
                        m_entry = deliv.get('morning', {}).get(target_cust['id'])
                        e_entry = deliv.get('evening', {}).get(target_cust['id'])
                        if m_entry is not None or e_entry is not None:
                            customer_deliveries[d_key] = {
                                'morning': m_entry or {'litres': 0, 'status': 'pending'},
                                'evening': e_entry or {'litres': 0, 'status': 'pending'}
                            }

                return self.send_json(200, {
                    'success': True,
                    'customer': cust_data,
                    'farmSettings': isolated_farm,
                    'deliveries': customer_deliveries
                })
            except Exception as e:
                return self.send_json(500, {'success': False, 'error': str(e)})

        # Route alias: /passbook serves passbook.html directly
        if path == '/passbook':
            self.path = '/passbook.html' + (('?' + parsed.query) if parsed.query else '')

        # Otherwise serve static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body_bytes = self.rfile.read(content_length)
        try:
            body = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
        except Exception:
            body = {}

        # ---------------------------------------------------------------
        # API: User Registration & Onboarding / Login
        # ---------------------------------------------------------------
        if path == '/api/register':
            phone = str(body.get('phone', '')).strip()
            name = str(body.get('name', 'किसान भाई')).strip()
            farm_name = str(body.get('farm_name', 'श्री कृष्णा डेयरी')).strip()
            city = str(body.get('city', 'गाँव')).strip()
            device_id = str(body.get('device_id', 'DEV_DEFAULT')).strip()
            device_name = str(body.get('device_name', 'मोबाइल फोन')).strip()
            friend_code = str(body.get('referral_code', '')).strip().upper()

            if not phone or len(phone) < 10:
                return self.send_json(400, {'success': False, 'error': 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें!'})

            conn = get_db()
            cur = conn.cursor()
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            existing = cur.fetchone()

            if existing:
                # Existing user -> Check Device Limit (Max 2 Devices)
                cur.execute('SELECT device_id, device_name FROM user_devices WHERE phone = ?', (phone,))
                active_devices = [dict(d) for d in cur.fetchall()]
                is_known_device = any(d['device_id'] == device_id for d in active_devices)

                if not is_known_device and len(active_devices) >= 2:
                    conn.close()
                    return self.send_json(403, {
                        'success': False,
                        'error': 'DEVICE_LIMIT_EXCEEDED',
                        'message': '⚠️ डिवाइस सीमा पार! आपका खाता पहले से 2 फोन पर सक्रिय है।',
                        'active_devices': active_devices
                    })

                # Register/refresh device
                cur.execute('''
                INSERT INTO user_devices (phone, device_id, device_name, last_active)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(phone, device_id) DO UPDATE SET last_active = excluded.last_active, device_name = excluded.device_name
                ''', (phone, device_id, device_name, now_str))
                conn.commit()

                user_dict = dict(existing)
                conn.close()
                return self.send_json(200, {
                    'success': True,
                    'is_new': False,
                    'user': user_dict,
                    'is_pro': bool(user_dict['is_pro']),
                    'pro_valid_until': user_dict['pro_valid_until'],
                    'referral_code': user_dict['referral_code']
                })

            # New User Registration
            clean_name = ''.join(c for c in name if c.isalnum()).upper()[:5] or 'DAIRY'
            import random
            rand_suffix = random.randint(10, 99)
            my_ref_code = f"DM-{clean_name}{rand_suffix}"

            # Check if this referral code already exists, ensure uniqueness
            while True:
                cur.execute('SELECT id FROM users WHERE referral_code = ?', (my_ref_code,))
                if not cur.fetchone():
                    break
                rand_suffix = random.randint(10, 99)
                my_ref_code = f"DM-{clean_name}{rand_suffix}"

            is_pro = 0
            pro_valid_until = None
            referred_by = None

            # Handle friend's referral code at signup
            # NOTE: Logged as PENDING. 30 days Pro is awarded when this friend actually enters records in the app!
            if friend_code and friend_code != my_ref_code:
                cur.execute('SELECT phone, pro_valid_until, is_pro FROM users WHERE referral_code = ?', (friend_code,))
                referrer = cur.fetchone()
                if referrer:
                    referred_by = friend_code
                    ref_phone = referrer['phone']
                    # Log in referrals table with PENDING status
                    cur.execute('''
                    INSERT INTO referrals (referrer_phone, referred_phone, referral_code, days_credited, status, created_at)
                    VALUES (?, ?, ?, 30, 'PENDING', ?)
                    ''', (ref_phone, phone, friend_code, now_str))

            # Insert new user
            cur.execute('''
            INSERT INTO users (phone, name, farm_name, city, referral_code, referred_by, is_pro, pro_valid_until, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (phone, name, farm_name, city, my_ref_code, referred_by, is_pro, pro_valid_until, now_str))

            # Register device
            cur.execute('''
            INSERT INTO user_devices (phone, device_id, device_name, last_active)
            VALUES (?, ?, ?, ?)
            ''', (phone, device_id, device_name, now_str))

            conn.commit()

            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            new_user = dict(cur.fetchone())
            conn.close()

            return self.send_json(200, {
                'success': True,
                'is_new': True,
                'user': new_user,
                'is_pro': bool(is_pro),
                'pro_valid_until': pro_valid_until,
                'referral_code': my_ref_code,
                'bonus_credited': bool(referred_by)
            })

        # ---------------------------------------------------------------
        # API: Update Farm Profile
        # ---------------------------------------------------------------
        if path == '/api/update-profile':
            phone = str(body.get('phone', '')).strip()
            name = str(body.get('name', '')).strip()
            farm_name = str(body.get('farm_name', '')).strip()
            city = str(body.get('city', '')).strip()

            if not phone:
                return self.send_json(400, {'success': False, 'error': 'Phone required'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('''
            UPDATE users 
            SET name = COALESCE(NULLIF(?, ''), name),
                farm_name = COALESCE(NULLIF(?, ''), farm_name),
                city = COALESCE(NULLIF(?, ''), city)
            WHERE phone = ?
            ''', (name, farm_name, city, phone))
            conn.commit()

            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            u_row = cur.fetchone()
            conn.close()

            return self.send_json(200, {
                'success': True,
                'user': dict(u_row) if u_row else None
            })

        # ---------------------------------------------------------------
        # API: Remove Device (to allow new device login)
        # ---------------------------------------------------------------
        if path == '/api/devices/remove':
            phone = str(body.get('phone', '')).strip()
            device_id = str(body.get('device_id', '')).strip()

            if not phone or not device_id:
                return self.send_json(400, {'success': False, 'error': 'Phone and device_id required'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('DELETE FROM user_devices WHERE phone = ? AND device_id = ?', (phone, device_id))
            conn.commit()

            cur.execute('SELECT device_id, device_name, last_active FROM user_devices WHERE phone = ?', (phone,))
            remaining = [dict(d) for d in cur.fetchall()]
            conn.close()

            return self.send_json(200, {'success': True, 'devices': remaining})

        # ---------------------------------------------------------------
        # API: Real Payment Verification via 12-digit UPI UTR
        # ---------------------------------------------------------------
        if path == '/api/submit-payment':
            phone = str(body.get('phone', '')).strip()
            plan_type = str(body.get('plan_type', 'yearly')).strip()
            amount = float(body.get('amount', 399.0))
            utr = str(body.get('utr', '')).strip().upper()

            if not phone:
                return self.send_json(400, {'success': False, 'error': 'फोन नंबर आवश्यक है!'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            user = cur.fetchone()

            if not user:
                conn.close()
                return self.send_json(404, {'success': False, 'error': 'उपयोगकर्ता नहीं मिला!'})

            # If user didn't enter a UTR, generate automatic seamless UPI transaction ID
            if not utr or len(utr) < 6:
                utr = f"UPI_{int(datetime.now().timestamp())}_{phone[-4:]}"
            else:
                # Check duplicate UTR only if user provided a specific UTR
                cur.execute('SELECT id, phone, created_at FROM subscriptions WHERE payment_id = ?', (utr,))
                dup = cur.fetchone()
                if dup:
                    conn.close()
                    return self.send_json(400, {
                        'success': False, 
                        'error': f'⚠️ यह UTR नंबर ({utr}) पहले से उपयोग किया जा चुका है!'
                    })

            days_to_add = 365 if plan_type == 'yearly' else 30
            base_date = datetime.now()
            if user['pro_valid_until']:
                try:
                    cur_exp = datetime.strptime(user['pro_valid_until'], '%Y-%m-%d')
                    if cur_exp > base_date:
                        base_date = cur_exp
                except Exception:
                    pass

            new_expiry = (base_date + timedelta(days=days_to_add)).strftime('%Y-%m-%d')
            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            cur.execute('UPDATE users SET is_pro = 1, pro_valid_until = ? WHERE phone = ?', (new_expiry, phone))

            cur.execute('''
            INSERT INTO subscriptions (phone, plan_type, amount, payment_id, start_date, expiry_date, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
            ''', (phone, plan_type, amount, utr, datetime.now().strftime('%Y-%m-%d'), new_expiry, now_str))

            conn.commit()
            conn.close()

            return self.send_json(200, {
                'success': True,
                'is_pro': True,
                'pro_valid_until': new_expiry,
                'plan_type': plan_type,
                'amount': amount,
                'utr': utr,
                'message': f'🎉 बधाई! ₹{int(amount)} का भुगतान सत्यापित हो गया और प्रो प्लान सक्रिय कर दिया गया है ({new_expiry} तक वैध)!'
            })

        # ---------------------------------------------------------------
        # API: Reset Pro Plan to Free (for testing)
        # ---------------------------------------------------------------
        if path == '/api/reset-pro':
            phone = str(body.get('phone', '')).strip()
            if not phone:
                return self.send_json(400, {'success': False, 'error': 'फोन नंबर आवश्यक है!'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('UPDATE users SET is_pro = 0, pro_valid_until = NULL WHERE phone = ?', (phone,))
            cur.execute('DELETE FROM subscriptions WHERE phone = ?', (phone,))
            conn.commit()
            conn.close()

            return self.send_json(200, {
                'success': True,
                'message': 'खाता सफलतापूर्वक फ्री प्लान पर रीसेट हो गया है!'
            })

        # ---------------------------------------------------------------
        # API: Update Admin Receiving UPI ID
        # ---------------------------------------------------------------
        if path == '/api/payment-config':
            admin_upi_id = str(body.get('admin_upi_id', '')).strip()
            admin_name = str(body.get('admin_name', 'DairyMitra Pro')).strip()

            if not admin_upi_id:
                return self.send_json(400, {'success': False, 'error': 'कृपया मान्य UPI ID दर्ज करें!'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('INSERT INTO admin_settings (key, value) VALUES ("admin_upi_id", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', (admin_upi_id,))
            cur.execute('INSERT INTO admin_settings (key, value) VALUES ("admin_name", ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', (admin_name,))
            conn.commit()
            conn.close()

            return self.send_json(200, {
                'success': True,
                'admin_upi_id': admin_upi_id,
                'admin_name': admin_name,
                'message': f'✅ सब्सक्रिप्शन प्राप्त करने वाला UPI ID सफलतापूर्वक बदलकर {admin_upi_id} कर दिया गया है!'
            })

        # ---------------------------------------------------------------
        # API: Apply Friend Referral Code with Real Usage Verification
        # ---------------------------------------------------------------
        if path == '/api/apply-referral':
            phone = str(body.get('phone', '')).strip()
            code = str(body.get('referral_code', '')).strip().upper()

            if not phone or not code:
                return self.send_json(400, {'success': False, 'error': 'फोन नंबर और रेफरल कोड आवश्यक हैं!'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            user = cur.fetchone()
            if not user:
                conn.close()
                return self.send_json(404, {'success': False, 'error': 'उपयोगकर्ता नहीं मिला!'})

            if user['referred_by']:
                conn.close()
                return self.send_json(400, {'success': False, 'error': '⚠️ आप पहले ही रेफरल बोनस प्राप्त कर चुके हैं!'})

            if user['referral_code'] == code:
                conn.close()
                return self.send_json(400, {'success': False, 'error': '❌ आप अपना खुद का रेफरल कोड उपयोग नहीं कर सकते!'})

            cur.execute('SELECT * FROM users WHERE referral_code = ?', (code,))
            referrer = cur.fetchone()
            if not referrer:
                conn.close()
                return self.send_json(400, {'success': False, 'error': '❌ यह रेफरल कोड मौजूद नहीं है! कृपया सही कोड जांचें।'})

            # Check if user has active records in farm_data
            cur.execute('SELECT data_json FROM farm_data WHERE phone = ?', (phone,))
            farm_row = cur.fetchone()
            has_used_app = False
            if farm_row and farm_row['data_json']:
                try:
                    fj = json.loads(farm_row['data_json'])
                    has_used_app = bool((fj.get('dailyRecords') and len(fj['dailyRecords']) > 0) or (fj.get('cattleList') and len(fj['cattleList']) > 0))
                except Exception:
                    pass

            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            if has_used_app:
                # User has already recorded data -> Immediately reward both!
                cur_user_base = datetime.now()
                if user['pro_valid_until']:
                    try:
                        p = datetime.strptime(user['pro_valid_until'], '%Y-%m-%d')
                        if p > cur_user_base: cur_user_base = p
                    except Exception: pass
                user_new_exp = (cur_user_base + timedelta(days=30)).strftime('%Y-%m-%d')
                cur.execute('UPDATE users SET referred_by = ?, is_pro = 1, pro_valid_until = ? WHERE phone = ?', (code, user_new_exp, phone))

                ref_base = datetime.now()
                if referrer['pro_valid_until']:
                    try:
                        p = datetime.strptime(referrer['pro_valid_until'], '%Y-%m-%d')
                        if p > ref_base: ref_base = p
                    except Exception: pass
                ref_new_exp = (ref_base + timedelta(days=30)).strftime('%Y-%m-%d')
                cur.execute('UPDATE users SET is_pro = 1, pro_valid_until = ? WHERE phone = ?', (ref_new_exp, referrer['phone']))

                cur.execute('''
                INSERT INTO referrals (referrer_phone, referred_phone, referral_code, days_credited, status, first_used_at, created_at)
                VALUES (?, ?, ?, 30, 'COMPLETED', ?, ?)
                ''', (referrer['phone'], phone, code, now_str, now_str))
                conn.commit()
                conn.close()

                return self.send_json(200, {
                    'success': True,
                    'is_pro': True,
                    'pro_valid_until': user_new_exp,
                    'message': '🎉 बधाई! रेफरल कोड सफल! आपको व आपके मित्र दोनों को 1 महीना (30 दिन) प्रो मुफ़्त मिला! 👑'
                })
            else:
                # User hasn't made any records yet -> Save as PENDING!
                cur.execute('UPDATE users SET referred_by = ? WHERE phone = ?', (code, phone))
                cur.execute('''
                INSERT INTO referrals (referrer_phone, referred_phone, referral_code, days_credited, status, created_at)
                VALUES (?, ?, ?, 30, 'PENDING', ?)
                ''', (referrer['phone'], phone, code, now_str))
                conn.commit()
                conn.close()

                return self.send_json(200, {
                    'success': True,
                    'is_pro': bool(user['is_pro']),
                    'pending': True,
                    'message': 'ℹ️ रेफरल कोड सुरक्षित हो गया! जैसे ही आप ऐप में अपनी पहली दूध एंट्री दर्ज करेंगे, आप दोनों को 1 महीना प्रो मुफ़्त मिलेगा।'
                })

        # ---------------------------------------------------------------
        # API: 2-Device Live Cloud Sync (Save farm records & trigger referral rewards)
        # ---------------------------------------------------------------
        if path == '/api/sync-data':
            phone = str(body.get('phone', '')).strip()
            data_json = body.get('data_json', None)

            if not phone or not data_json:
                return self.send_json(400, {'success': False, 'error': 'Phone and data_json required'})

            if isinstance(data_json, dict):
                data_json_str = json.dumps(data_json, ensure_ascii=False)
                farm_obj = data_json
            else:
                data_json_str = str(data_json)
                try:
                    farm_obj = json.loads(data_json_str)
                except Exception:
                    farm_obj = {}

            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            conn = get_db()
            cur = conn.cursor()
            cur.execute('''
            INSERT INTO farm_data (phone, data_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
            ''', (phone, data_json_str, now_str))

            # Check if this user has any PENDING referral awaiting their first usage!
            referral_rewarded = False
            cur.execute("SELECT * FROM referrals WHERE referred_phone = ? AND status = 'PENDING'", (phone,))
            pending_refs = cur.fetchall()
            for ref_row in pending_refs:
                has_records = bool(farm_obj.get('dailyRecords') and len(farm_obj['dailyRecords']) > 0)
                has_cattle = bool(farm_obj.get('cattleList') and len(farm_obj['cattleList']) > 0)
                if has_records or has_cattle:
                    # User is actively using the app! Fulfill referral bonus for both!
                    referrer_phone = ref_row['referrer_phone']

                    # 1. Award +30 days to new user (this phone)
                    cur.execute('SELECT pro_valid_until FROM users WHERE phone = ?', (phone,))
                    u_row = cur.fetchone()
                    base_u = datetime.now()
                    if u_row and u_row['pro_valid_until']:
                        try:
                            exp = datetime.strptime(u_row['pro_valid_until'], '%Y-%m-%d')
                            if exp > base_u: base_u = exp
                        except Exception: pass
                    new_u_exp = (base_u + timedelta(days=30)).strftime('%Y-%m-%d')
                    cur.execute('UPDATE users SET is_pro = 1, pro_valid_until = ? WHERE phone = ?', (new_u_exp, phone))

                    # 2. Award +30 days to referrer
                    cur.execute('SELECT pro_valid_until FROM users WHERE phone = ?', (referrer_phone,))
                    r_row = cur.fetchone()
                    base_r = datetime.now()
                    if r_row and r_row['pro_valid_until']:
                        try:
                            exp = datetime.strptime(r_row['pro_valid_until'], '%Y-%m-%d')
                            if exp > base_r: base_r = exp
                        except Exception: pass
                    new_r_exp = (base_r + timedelta(days=30)).strftime('%Y-%m-%d')
                    cur.execute('UPDATE users SET is_pro = 1, pro_valid_until = ? WHERE phone = ?', (new_r_exp, referrer_phone))

                    # 3. Mark referral as COMPLETED
                    cur.execute("UPDATE referrals SET status = 'COMPLETED', first_used_at = ? WHERE id = ?", (now_str, ref_row['id']))
                    referral_rewarded = True

            conn.commit()
            conn.close()

            return self.send_json(200, {
                'success': True, 
                'updated_at': now_str, 
                'referral_rewarded': referral_rewarded
            })

        self.send_json(404, {'error': 'API endpoint not found'})

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("=" * 60)
    print("🥛 डेयरी मित्र (DairyMitra) - डेटाबेस सर्वर चालू हो गया है!")
    print("=" * 60)
    print(f"💻 कंप्यूटर पर खोलें:   http://localhost:{PORT}")
    print(f"📱 मोबाइल फोन पर खोलें: http://{local_ip}:{PORT}")
    print(f"🗄️ SQLite डेटाबेस:     {DB_PATH}")
    print("🔒 2-डिवाइस हॉटस्टार लिमिट व लाइव सिंक सक्रिय!")
    print("=" * 60)
    print("💡 मोबाइल पर चलाने के लिए: आपका मोबाइल और कंप्यूटर एक ही Wi-Fi या हॉटस्पॉट से जुड़े होने चाहिए।")
    print("🛑 सर्वर बंद करने के लिए Ctrl + C दबाएं।")
    print("=" * 60)

    try:
        webbrowser.open(f"http://localhost:{PORT}")
    except Exception:
        pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nसर्वर बंद कर दिया गया।")
            sys.exit(0)
