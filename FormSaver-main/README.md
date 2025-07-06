# FormSaver 🧩
A browser extension that automatically saves form inputs locally before a session times out. Built for hackathon MVP.

## Features
- Saves form fields on any website
- Automatically restores on reload
- 100% client-side — no backend needed

## 🧠 What It Does

- Auto-saves form inputs on any website
- Syncs locally (Chrome) + remotely (FastAPI backend + PostgreSQL)
- Uses JWT for user auth
- Popup UI to manage permissions, saved sites, and clear data

## 🚀 Folder Structure

- `extension/` - Chrome Extension (Frontend)
- `backend/` - FastAPI API server (Python)

## How to Use
1. Clone this repo
2. Load unpacked folder in `chrome://extensions`
3. Use on any form-based webpage
