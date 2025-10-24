# 🚀 Quick Start Guide

Get the Database Management System running in under 2 minutes!

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **Google Gemini API key** (optional, for AI features)

## ⚡ Installation & Startup

### Method 1: Manual Setup (Recommended)

This method gives you full control and clear visibility of each step.

#### Step 1: Start the Backend
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies (first time only)
pip install -r requirements.txt

# Start the Python server
python run.py
```

**Wait for backend to start** - you should see:
```
🚀 Starting Python Database Management System
📊 Database: ./data/database.sqlite
🤖 Gemini AI: Available/Not configured
🌐 Server running on http://localhost:5000
```

#### Step 2: Start the Frontend
```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install Node dependencies (first time only)
npm install

# Start the React development server
npm run dev
```

**Wait for frontend to start** - you should see:
```
VITE v6.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### Step 3: Verify Installation
Open your browser and visit:
- **Frontend App**: http://localhost:5173
- **Backend API Docs**: http://localhost:5000/docs

You should see the application interface with the navigation bar at the top.

---

### Method 2: One Command (Fastest)

From the project root directory:

```bash
npm run quick-start
```

This will automatically:
1. Install all dependencies (npm and pip)
2. Start both backend and frontend servers
3. Open the app in your default browser

**Note**: Both servers will run in the same terminal window using `concurrently`.

---

## 🎮 Using the Application

### Quick Feature Tour

| Button | Icon | Function |
|--------|------|----------|
| **Work** | Database | Browse and load saved schemas |
| **About** | Sparkles ✨ | Generate database from AI prompt |
| **Playground** | Beaker | Load sample databases (School, E-Commerce, Hospital) |
| **Resource** | Image | Export SQL code and PNG diagrams |
| **Save** | Save | Save current schema to database |
| **ERD** | Git Branch | View Mermaid ER diagram |
| **Settings** | Gear | Configure app, theme, and database |

### Your First Database

1. **Open the application** at http://localhost:5173

2. **Click "About"** button (✨ Sparkles icon) in the top navigation

3. **Enter a database description:**
   ```
   Create a school database with Student, Course, and Enrollment tables.
   Students have Student_ID, Name, Grade_Level.
   Courses have Course_ID, Name, Credits.
   Enrollments connect Students and Courses with Grade and Semester.
   ```

4. **Click "Generate Database"** and watch your schema appear on the canvas!

5. **Explore the canvas:**
   - Drag entities to reposition them
   - Click entities to edit properties in the right sidebar
   - Use the floating toolbar (left side) to add more entities

6. **Save your work:**
   - Click the **"Save"** button in the top navigation
   - Enter a name for your schema
   - Load it later from the **"Work"** menu

### Try the Playground

Click **"Playground"** to load pre-built sample databases:
- **School System** - Students, Courses, Teachers, Enrollments
- **E-Commerce** - Customers, Products, Orders, OrderItems
- **Hospital** - Patients, Doctors, Appointments, Departments

---

## 🔧 Troubleshooting

### Backend Issues

**"Python was not found"**
```bash
# Install Python from python.org
# Or try using the Python launcher:
py run.py
```

**"Module not found" errors**
```bash
cd backend
pip install -r requirements.txt
```

**Backend won't start**
```bash
# Check Python version (need 3.8+)
python --version

# Verify you're in the backend directory
pwd  # Should show: .../dbms2/backend
```

**Port 5000 already in use**
```bash
# Windows: Kill process on port 5000
taskkill /F /PID (netstat -ano | findstr :5000)[0].split()[-1]

# Mac/Linux: Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

---

### Frontend Issues

**"Missing script: dev:client"**

You're in the wrong directory. This error means you're trying to run a root-level script from the frontend directory.

```bash
# ❌ Wrong
cd frontend
npm run dev:client  # This script doesn't exist here

# ✅ Correct
cd frontend
npm run dev  # Use this from frontend directory
```

**Dependencies not installed**
```bash
cd frontend
npm install
```

**Frontend won't start**
```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Port 5173 already in use**
```bash
# Kill existing Vite process
# Windows
taskkill /F /IM node.exe

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

---

### Common Mistakes

**Running commands from wrong directory**

Commands must be run from specific directories:

```bash
# ✅ Backend commands - run from backend/ directory
cd backend
python run.py

# ✅ Frontend commands - run from frontend/ directory
cd frontend
npm run dev

# ✅ Root commands - run from project root (dbms2/)
cd dbms2
npm run quick-start
npm run dev  # Starts both servers
```

**Backend not started before frontend**

Always start the backend first, then the frontend. The frontend needs the backend API to be available.

**Forgot to install dependencies**

First-time setup requires installing dependencies:
```bash
# Frontend dependencies
cd frontend
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
```

---

### AI Features Not Working

**Gemini API errors**

1. **Create `.env` file** in the project root (not in backend or frontend):
   ```bash
   # From project root (dbms2/)
   cp env.template .env
   ```

2. **Edit `.env` file** and add your API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Get an API key** from [Google AI Studio](https://ai.google.dev/)

4. **Restart the backend** after adding the key

**Without API key**: The app will use a basic fallback parser with limited capabilities.

---

## 📁 Directory Structure Reference

```
dbms2/                          ← Project root
├── frontend/                   ← Frontend code
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/                    ← Backend code
│   ├── app/
│   │   └── main.py
│   ├── data/                   ← Database files (auto-created)
│   ├── run.py                  ← Start server from here
│   └── requirements.txt
├── .env                        ← Create this (not in git)
├── env.template                ← Copy this to .env
├── package.json                ← Root scripts
└── README.md
```

### Where to Run Commands

| Command | Directory | Example |
|---------|-----------|---------|
| `python run.py` | `backend/` | `cd backend && python run.py` |
| `npm run dev` | `frontend/` | `cd frontend && npm run dev` |
| `npm run quick-start` | Root `dbms2/` | `cd dbms2 && npm run quick-start` |
| `pip install -r requirements.txt` | `backend/` | `cd backend && pip install -r requirements.txt` |

---

## 🆘 Need More Help?

- **Full Documentation**: See [README.md](../README.md)
- **Backend API Details**: See [BACKEND.md](BACKEND.md)
- **Frontend Components**: See [FRONTEND.md](FRONTEND.md)
- **API Documentation**: http://localhost:5000/docs (when backend is running)
- **Browser Console**: Press F12 to see frontend errors
- **Terminal Logs**: Check backend terminal for server errors

## 🎉 You're Ready!

Start building amazing databases with AI! 🚀

**Next Steps:**
1. Try the Playground samples
2. Generate your own database with AI
3. Explore the SQL Executor (Settings → Tools)
4. Save and manage your schemas
