# FormSaver Setup Guide

## Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up PostgreSQL database:**
   - Install PostgreSQL
   - Create a database
   - Set the `DATABASE_URL` environment variable:
     ```bash
     export DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
     ```
   - Or create a `.env` file in the backend directory with:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/database_name
     ```

3. **Run the backend server:**
   ```bash
   cd backend
   python run.py
   ```
   The server will start on `http://localhost:8000`

## Extension Setup

1. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` folder

2. **Grant permissions:**
   - Click on the FormSaver extension icon
   - Click "Grant Permission" for each site you want to save forms on
   - Reload the page after granting permission

## Usage

1. **Automatic saving:** Form data is automatically saved as you type
2. **Manual sync:** Click "Sync Now" in the popup to manually sync to backend
3. **Clear data:** Use "Clear Data for This Site" or "Clear All Data" buttons

## Troubleshooting

- **Backend not running:** Make sure the backend server is running on port 8000
- **Database connection:** Check your `DATABASE_URL` environment variable
- **Extension not working:** Check the browser console for errors
- **CORS errors:** The backend now includes CORS middleware for browser extensions

## Features

- ✅ Automatic form data saving
- ✅ Local storage backup
- ✅ Backend synchronization
- ✅ Cross-device data sync
- ✅ Secure user identification
- ✅ Password field protection 