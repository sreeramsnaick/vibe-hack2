import psycopg2
from os import getenv
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(getenv("DATABASE_URL"))

def get_cursor():
    return conn.cursor()

# --- Table creation ---

def create_tables():
    cur = get_cursor()

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
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            url TEXT NOT NULL,
            data JSONB,
            PRIMARY KEY (user_id, url)
        );
    """)

    cur.connection.commit()
    cur.close()
    print("✅ Tables ensured")

create_tables()
