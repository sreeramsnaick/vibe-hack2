import psycopg2
from os import getenv
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    """Get database connection with error handling"""
    try:
        database_url = getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
        return psycopg2.connect(database_url)
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("Please set DATABASE_URL environment variable")
        return None

def get_cursor():
    """Get database cursor with connection management"""
    conn = get_connection()
    if conn is None:
        return None
    return conn.cursor()

# --- Table creation ---

def create_tables():
    conn = get_connection()
    if conn is None:
        print("❌ Cannot create tables - no database connection")
        return False
    
    try:
        cur = conn.cursor()

        # Create users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """)

        # Create form_data table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS form_data (
                user_id TEXT NOT NULL,
                url TEXT NOT NULL,
                data JSONB,
                PRIMARY KEY (user_id, url)
            );
        """)

        conn.commit()
        cur.close()
        conn.close()
        print("✅ Tables ensured")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

# Only create tables if we can connect
if get_connection():
    create_tables()
