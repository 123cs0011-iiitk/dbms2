# 🚀 Quick Start Guide

Get the Database Management System running in under 2 minutes!

## ⚡ Super Quick Start

### Option 1: One Command (Recommended)
```bash
# From project root directory (dbms/)
npm run quick-start
```

### Option 2: Step by Step
```bash
# 1. From project root directory (dbms/)
npm install

# 2. Start both backend and frontend
npm run dev
```

### Option 3: Manual (Most Common)
```bash
# Terminal 1: Backend
cd backend
python run.py

# Terminal 2: Frontend
cd frontend
npm i
npm run dev
```

**That's it!** 🎉 

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

## 🚀 Step-by-Step Startup (Recommended)

### Step 1: Start Backend First
```bash
# Open Terminal 1
# Navigate to backend directory
cd backend

# Start the Python backend
python run.py
```

**Wait for backend to start** - you should see:
```
🚀 Starting Python Database Management System
📊 Database: ../data/database.sqlite
🤖 Gemini AI: Available/Not configured
🌐 Server will start on http://localhost:5000
```

### Step 2: Start Frontend
```bash
# Open Terminal 2 (new terminal)
# Navigate to frontend directory
cd frontend

# Install dependencies (first time only)
npm i

# Start the React frontend
npm run dev
```

**Wait for frontend to start** - you should see:
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 3: Verify Both Are Running
- **Backend**: Visit http://localhost:5000/docs (should show API documentation)
- **Frontend**: Visit http://localhost:5173 (should show the main application)

> **⚠️ Important**: Make sure you're in the correct directory for each command!

## 🎯 What You Get

- 🤖 **AI-Powered Database Generation** - Describe your database in plain English
- 📊 **Visual Database Designer** - Drag-and-drop interface
- 🔗 **ER Diagrams** - Automatic Entity Relationship diagrams
- 💾 **Real Database** - Creates actual SQLite tables
- 📁 **Schema Management** - Save and load your designs

## 🛠️ Alternative Startup Methods

### Method 1: One Command (Easiest)
```bash
# From project root directory (dbms/)
npm run dev
```
*This starts both backend and frontend automatically*

### Method 2: Manual Backend + Frontend
```bash
# Terminal 1: Start Backend First
cd backend
python run.py

# Terminal 2: Start Frontend (after backend is running)
cd frontend
npm i
npm run dev
```

### Method 3: Using npm Scripts (Separate Terminals)
```bash
# Terminal 1: Start Backend First
# From project root directory (dbms/)
npm run start-python

# Terminal 2: Start Frontend (after backend is running)
# From project root directory (dbms/)
npm run dev:client
```

### Method 4: Ultra Quick (Install + Start)
```bash
# From project root directory (dbms/)
npm run quick-start
```

## 🎮 How to Use

1. **Make sure both servers are running:**
   - Backend: http://localhost:5000 (should show API docs)
   - Frontend: http://localhost:5173 (main application)

2. **Open** http://localhost:5173 in your browser

3. **Click** "🤖 Generate from Prompt"

4. **Describe** your database: 
   ```
   Create a hospital database with Doctor, Patient, and Appointment tables.
   Doctor has ID, Name, Specialization. Patient has ID, Name, Age.
   Appointment connects Doctor and Patient with Date and Time.
   ```

5. **Click** "Generate Database" and watch the magic! ✨

## 🔧 Troubleshooting

### Common Errors

#### "Missing script: dev:client"
```bash
# This error means you're in the frontend directory but using wrong command
# ✅ Correct: From frontend directory
cd frontend
npm run dev

# ❌ Wrong: From frontend directory
npm run dev:client  # This script doesn't exist in frontend
```

#### "Python was not found"
```bash
# This means Python is not installed or not in PATH
# Install Python from https://python.org
# Or try alternative command:
py run.py  # Instead of python run.py
```

#### "python run.py" from wrong directory
```bash
# ❌ Wrong: Running from frontend directory
cd frontend
python run.py  # This won't work!

# ✅ Correct: Running from backend directory
cd backend
python run.py
```

### Python Not Found
```bash
# Install Python from https://python.org
# Or use Python launcher instead of python
py run.py
```

### Port Already in Use
```bash
# Kill processes on ports 5000 and 5173
# Or change ports in configuration files
```

### Dependencies Issues
```bash
# Clear cache and reinstall (from project root)
rm -rf node_modules package-lock.json
npm install

# For Python dependencies (from project root)
cd backend
pip install -r requirements.txt
cd ..
```

### Backend Won't Start
```bash
# Check if Python is installed
python --version

# Try alternative Python command
py --version

# Install Python dependencies manually
cd backend
pip install -r requirements.txt
python run.py
```

### Frontend Won't Start
```bash
# Install frontend dependencies
cd frontend
npm install
npm run dev
```

## 📁 Project Structure & Command Locations

```
dbms/                          ← Project root
├── frontend/                  # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # Python backend
│   ├── app/                  # FastAPI application
│   │   └── main.py
│   ├── data/                 # Database storage (auto-created)
│   ├── run.py                # Main entry point
│   ├── requirements.txt
│   └── .env.template
├── package.json              # Root scripts (npm commands)
├── README.md
└── QUICK_START.md
```

### 🎯 Where to Run Commands

**Backend commands run from `backend/` directory:**
```bash
# ✅ Correct - from backend directory
cd backend
python run.py

# ❌ Wrong - from project root
cd /path/to/dbms
python run.py  # This won't work
```

**Frontend commands run from `frontend/` directory:**
```bash
# ✅ Correct - from frontend directory
cd frontend
npm i
npm run dev

# ❌ Wrong - from project root
cd /path/to/dbms
npm run dev  # This won't work for the full app
```

## 🆘 Need Help?

- **Full Documentation**: See [README.md](README.md)
- **Backend Details**: See [backend/README.md](backend/README.md)
- **API Documentation**: http://localhost:5000/docs (when running)

## 🎉 You're Ready!

Start building amazing databases with AI! 🚀
