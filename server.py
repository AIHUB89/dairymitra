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

    # 4. referrals table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referrer_phone TEXT NOT NULL,
        referred_phone TEXT NOT NULL,
        referral_code TEXT NOT NULL,
        days_credited INTEGER DEFAULT 30,
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

            # Referrals count
            cur.execute('SELECT COUNT(*) FROM referrals WHERE referrer_phone = ?', (phone,))
            ref_count = cur.fetchone()[0]

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
                'referrals_count': ref_count,
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
            if friend_code and friend_code != my_ref_code:
                cur.execute('SELECT phone, pro_valid_until, is_pro FROM users WHERE referral_code = ?', (friend_code,))
                referrer = cur.fetchone()
                if referrer:
                    referred_by = friend_code
                    # New user gets 30 days Pro Free!
                    is_pro = 1
                    pro_valid_until = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d')

                    # Referrer gets +30 days Pro Free extended!
                    ref_phone = referrer['phone']
                    ref_cur_until = referrer['pro_valid_until']
                    ref_base = datetime.now()
                    if ref_cur_until:
                        try:
                            parsed_exp = datetime.strptime(ref_cur_until, '%Y-%m-%d')
                            if parsed_exp > ref_base:
                                ref_base = parsed_exp
                        except Exception:
                            pass
                    new_ref_until = (ref_base + timedelta(days=30)).strftime('%Y-%m-%d')
                    cur.execute('UPDATE users SET is_pro = 1, pro_valid_until = ? WHERE phone = ?', (new_ref_until, ref_phone))

                    # Log in referrals table
                    cur.execute('''
                    INSERT INTO referrals (referrer_phone, referred_phone, referral_code, days_credited, created_at)
                    VALUES (?, ?, ?, 30, ?)
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
        # API: Automatic Pro Subscription Activation
        # ---------------------------------------------------------------
        if path == '/api/subscribe':
            phone = str(body.get('phone', '')).strip()
            plan_type = str(body.get('plan_type', 'yearly')).strip()
            amount = float(body.get('amount', 399.0))
            payment_id = str(body.get('payment_id', f"PAY_AUTO_{int(datetime.now().timestamp())}")).strip()

            if not phone:
                return self.send_json(400, {'success': False, 'error': 'Phone required'})

            conn = get_db()
            cur = conn.cursor()
            cur.execute('SELECT * FROM users WHERE phone = ?', (phone,))
            user = cur.fetchone()

            if not user:
                conn.close()
                return self.send_json(404, {'success': False, 'error': 'उपयोगकर्ता नहीं मिला!'})

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
            ''', (phone, plan_type, amount, payment_id, datetime.now().strftime('%Y-%m-%d'), new_expiry, now_str))

            conn.commit()
            conn.close()

            return self.send_json(200, {
                'success': True,
                'is_pro': True,
                'pro_valid_until': new_expiry,
                'days_added': days_to_add,
                'payment_id': payment_id,
                'message': f'👑 बधाई! आपका {plan_type} प्रो प्लान सक्रिय हो गया है ({new_expiry} तक वैध)!'
            })

        # ---------------------------------------------------------------
        # API: 2-Device Live Cloud Sync (Save farm records)
        # ---------------------------------------------------------------
        if path == '/api/sync-data':
            phone = str(body.get('phone', '')).strip()
            data_json = body.get('data_json', None)

            if not phone or not data_json:
                return self.send_json(400, {'success': False, 'error': 'Phone and data_json required'})

            if isinstance(data_json, dict):
                data_json_str = json.dumps(data_json, ensure_ascii=False)
            else:
                data_json_str = str(data_json)

            now_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            conn = get_db()
            cur = conn.cursor()
            cur.execute('''
            INSERT INTO farm_data (phone, data_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(phone) DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
            ''', (phone, data_json_str, now_str))
            conn.commit()
            conn.close()

            return self.send_json(200, {'success': True, 'updated_at': now_str})

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
