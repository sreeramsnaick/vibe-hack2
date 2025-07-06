from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from auth import (
    verify_password, hash_password, create_access_token, decode_token
)
from models import FormData, UserAuth
from database import get_cursor
import json

app = FastAPI()

# Add CORS middleware for browser extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Auth: Register
@app.post("/register")
def register(user: UserAuth):
    cur = get_cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (user.username,))
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="User already exists")
    hashed = hash_password(user.password)
    cur.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (user.username, hashed))
    cur.connection.commit()
    return {"message": "User registered"}

# Auth: Login
@app.post("/login")
def login(user: UserAuth):
    cur = get_cursor()
    cur.execute("SELECT id, password FROM users WHERE username = %s", (user.username,))
    row = cur.fetchone()
    if not row or not verify_password(user.password, row[1]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(data={"sub": str(row[0])})
    return {"access_token": token, "token_type": "bearer"}

# Auth: Dependency
def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return int(payload["sub"])  # user_id

# Extension endpoints (no auth required)
@app.post("/save")
async def save_form_data(request: Request):
    try:
        body = await request.json()
        user_id = body.get("user_id")
        url = body.get("url")
        data = body.get("data", {})
        
        if not user_id or not url:
            raise HTTPException(status_code=400, detail="Missing user_id or url")
        
        cur = get_cursor()
        cur.execute("""
            INSERT INTO form_data (user_id, url, data)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, url) DO UPDATE
            SET data = EXCLUDED.data;
        """, (user_id, url, json.dumps(data)))
        cur.connection.commit()
        return {"message": "Data saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get")
async def get_form_data(request: Request):
    try:
        body = await request.json()
        user_id = body.get("user_id")
        url = body.get("url")
        
        if not user_id or not url:
            raise HTTPException(status_code=400, detail="Missing user_id or url")
        
        cur = get_cursor()
        cur.execute("""
            SELECT data FROM form_data
            WHERE user_id = %s AND url = %s
        """, (user_id, url))
        row = cur.fetchone()
        
        if row and row[0]:
            return json.loads(row[0])
        return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Authenticated endpoints (for web usage)
@app.post("/auth/save")
def save_form_data_auth(form: FormData, user_id: int = Depends(get_current_user)):
    cur = get_cursor()
    cur.execute("""
        INSERT INTO form_data (user_id, url, data)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, url) DO UPDATE
        SET data = EXCLUDED.data;
    """, (user_id, form.url, json.dumps(form.data)))
    cur.connection.commit()
    return {"message": "Data saved"}

@app.post("/auth/get")
def get_form_data_auth(form: FormData, user_id: int = Depends(get_current_user)):
    cur = get_cursor()
    cur.execute("""
        SELECT data FROM form_data
        WHERE user_id = %s AND url = %s
    """, (user_id, form.url))
    row = cur.fetchone()
    return json.loads(row[0]) if row and row[0] else {}

# Clear form
@app.post("/clear")
async def clear_form_data(request: Request):
    try:
        body = await request.json()
        user_id = body.get("user_id")
        url = body.get("url")
        
        if not user_id or not url:
            raise HTTPException(status_code=400, detail="Missing user_id or url")
        
        cur = get_cursor()
        cur.execute("DELETE FROM form_data WHERE user_id = %s AND url = %s", (user_id, url))
        cur.connection.commit()
        return {"message": "Data cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
