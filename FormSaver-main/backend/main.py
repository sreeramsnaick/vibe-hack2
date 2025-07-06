from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from auth import (
    verify_password, hash_password, create_access_token, decode_token
)
from models import FormData, UserAuth
from database import get_cursor
import json

app = FastAPI()
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

# Save form
@app.post("/save")
def save_form_data(form: FormData, user_id: int = Depends(get_current_user)):
    cur = get_cursor()
    cur.execute("""
        INSERT INTO form_data (user_id, url, data)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, url) DO UPDATE
        SET data = EXCLUDED.data;
    """, (user_id, form.url, json.dumps(form.data)))
    cur.connection.commit()
    return {"message": "Data saved"}

# Get form
@app.post("/get")
def get_form_data(form: FormData, user_id: int = Depends(get_current_user)):
    cur = get_cursor()
    cur.execute("""
        SELECT data FROM form_data
        WHERE user_id = %s AND url = %s
    """, (user_id, form.url))
    row = cur.fetchone()
    return row[0] if row else {}

# Clear form
@app.post("/clear")
def clear_form_data(form: FormData, user_id: int = Depends(get_current_user)):
    cur = get_cursor()
    cur.execute("DELETE FROM form_data WHERE user_id = %s AND url = %s", (user_id, form.url))
    cur.connection.commit()
    return {"message": "Data cleared"}
