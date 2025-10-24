# 🤖 Prompt-Based Database Builder

A powerful full-stack web application that converts natural language database descriptions into SQL schemas, builds interactive ER diagrams, executes SQL on SQLite databases, and manages schema persistence.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3+-lightblue.svg)](https://sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-API-purple.svg)](https://ai.google.dev/)

## ✨ Demo

Generate complete database schemas from natural language:
```
Input: "Create a hospital database with Doctor, Patient, and Appointment entities..."
Output: Complete SQL schema with relationships, ER diagrams, and visual canvas!
```

## 🚀 Features

| Category | Features |
|----------|----------|
| **AI-Powered** | Google Gemini AI integration, Perplexity API support, Intelligent entity recognition, Automatic relationship detection |
| **Visual Design** | Drag-and-drop canvas, Interactive entity nodes, Relationship diamonds, Custom attribute positioning, Color-coded entities |
| **Database** | Real SQLite execution, Interactive SQL executor, Sample data management, Table structure inspection, Multi-table operations |
| **Schema Management** | Save/load schemas, Export SQL files, Export PNG diagrams, Playground with 3 sample databases |
| **Editing** | Add/delete entities, Composite primary keys, Foreign key relationships, Manual and AI generation, Auto-layout algorithm |
| **UI/UX** | Dark/light themes, Floating toolbar, Status bar tracking, Right sidebar properties, Settings modal, Real-time validation |

### Key Capabilities
- **True AI Generation**: Describe any database in plain English and watch it materialize
- **Interactive Canvas**: Drag, position, and connect entities visually with smooth animations
- **SQL Executor**: Run queries directly in the app with formatted result tables
- **Sample Data**: Add test data to entities with auto-generated INSERT statements
- **Playground**: Load pre-built schemas (School, E-Commerce, Hospital) for quick testing
- **Status Tracking**: Real-time display of entity count, relationships, unsaved changes, and zoom level

## 🛠️ Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React 19, TypeScript, Vite, Framer Motion, ReactFlow |
| **UI Library** | Radix UI, TailwindCSS, Lucide Icons, Sonner Toasts |
| **Backend** | Python 3.8+, FastAPI, Uvicorn ASGI Server |
| **Database** | SQLite 3, Pydantic validation |
| **AI/ML** | Google Generative AI (Gemini), Perplexity API support |
| **Diagrams** | html-to-image |

## 🚀 Quick Start

> **For detailed setup, see [QUICK_START.md](documentation/QUICK_START.md)**

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- npm or yarn
- [Google Gemini API key](https://ai.google.dev/) (optional, but recommended)

### Installation

**Method 1: One Command (Fastest)**
```bash
npm run quick-start
```

**Method 2: Manual Setup (Recommended)**
```bash
# 1. Install dependencies
npm install
cd backend && pip install -r requirements.txt && cd ..

# 2. Configure environment (optional for AI features)
cp env.template .env
# Edit .env and add: GEMINI_API_KEY=your_actual_api_key_here

# 3. Start application
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

**Alternative: Separate Terminals**
```bash
# Terminal 1: Backend
cd backend && python run.py

# Terminal 2: Frontend
cd frontend && npm i && npm run dev
```

## 📖 How to Use

### 1. AI-Powered Generation
1. Click **"About"** button (Sparkles icon) in the navbar
2. Describe your database in natural language
3. Click **"Generate Database"** to create schema instantly

**Example Prompt:**
```
Create a library system with Book, Member, and Loan tables.
Books have ISBN, Title, Author, Genre.
Members have Member_ID, Name, Email, Phone.
Loans connect Books and Members with Loan_Date, Return_Date, and Status.
```

### 2. Visual Canvas Design
- **Add Entities**: Click **"+"** in floating toolbar (left side)
- **Add Relationships**: Click diamond icon in floating toolbar
- **Drag & Position**: Click and drag any element
- **Auto-Layout**: Click layout icon to arrange entities automatically
- **Toggle Attributes**: Show/hide attribute ovals around entities
- **Delete**: Select element and click trash icon

### 3. Entity Configuration
- **Select Entity**: Click any entity to open right sidebar
- **Edit Properties**: Modify name, color, and structure
- **Add Attributes**: Define columns with types, constraints, and keys
- **Composite Keys**: Select multiple attributes as primary keys
- **Sample Data**: Add test rows with auto-generated INSERT statements

### 4. Schema Management
- **Save**: Click **"Save"** button (requires entities on canvas)
- **Load**: Click **"Work"** button to browse saved schemas
- **Export SQL**: Click **"Resource"** button to view/download SQL
- **Export PNG**: Download visual diagram as image

### 5. Advanced Tools
- **SQL Executor**: Settings → Tools → Open SQL Executor
  - Run custom queries on the database
  - View results in formatted tables
  - Test your schema with real SQL
- **Playground**: Click **"Playground"** (beaker icon) for sample databases
- **Settings**: Configure theme, database, and app preferences
- **Status Bar**: Track entities, relationships, changes, and zoom (bottom bar)

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and version |
| GET | `/api/health` | Health check with Gemini availability |
| POST | `/api/generate-database` | Generate complete database from prompt |
| POST | `/api/generate-sql` | Generate SQL from natural language |
| POST | `/api/execute-sql` | Execute SQL statements |
| GET | `/api/tables` | List all database tables |
| GET | `/api/tables/{name}/structure` | Get table structure and foreign keys |
| DELETE | `/api/tables/{name}` | Drop specific table |
| GET | `/api/generate-drop-sql` | Generate DROP statements for all tables |
| GET | `/api/generate-drop-sql/{name}` | Generate DROP statement for specific table |
| GET | `/api/saved-schemas` | Retrieve all saved schemas |
| POST | `/api/save-schema` | Save schema with metadata |
| DELETE | `/api/schemas/{id}` | Delete saved schema |
| POST | `/api/reset-database` | Reset entire database |

**Interactive API Documentation**: http://localhost:5000/docs (when server running)

**Detailed API Documentation**: See [documentation/BACKEND.md](documentation/BACKEND.md)

## 📁 Project Structure

```
dbms2/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── Canvas.tsx      # Main canvas with drag-and-drop
│   │   │   ├── Toolbar.tsx     # Top navigation bar
│   │   │   ├── FloatingToolbar.tsx  # Left sidebar tools
│   │   │   ├── RightSidebar.tsx     # Entity properties editor
│   │   │   ├── SQLExecutor.tsx      # Query execution interface
│   │   │   ├── SettingsModal.tsx    # App settings
│   │   │   ├── PromptModal.tsx      # AI generation dialog
│   │   │   ├── SavedSchemasModal.tsx # Schema browser
│   │   │   ├── StatusBar.tsx        # Bottom status display
│   │   │   └── ui/             # Radix UI components
│   │   ├── services/           # API client
│   │   ├── utils/              # Helper functions
│   │   └── App.tsx             # Main application
│   └── package.json
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   └── main.py            # FastAPI app with all endpoints
│   ├── data/                  # SQLite database storage
│   ├── run.py                 # Server entry point
│   └── requirements.txt
├── documentation/             # All documentation files
│   ├── QUICK_START.md         # Quick start guide
│   ├── BACKEND.md             # Backend API documentation
│   ├── FRONTEND.md            # Frontend component documentation
│   └── test-integration.md    # Integration testing guide
├── env.template               # Environment variables template
├── package.json               # Root scripts
└── README.md                  # This file
```

## 💻 Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run quick-start` | Install dependencies and start both servers |
| `npm run dev` | Start both frontend and backend (recommended) |
| `npm run dev:client` | Start only frontend (Vite dev server) |
| `npm run start-python` | Start only backend (from root) |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint on frontend |

### Environment Variables

Create a `.env` file in the project root:

```env
# AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here  # Optional

# Default AI Provider (gemini, perplexity, or fallback)
DEFAULT_AI_PROVIDER=gemini

# Database Configuration
DB_PATH=./backend/data/database.sqlite

# Server Configuration
PORT=5000
```

**Get API Keys:**
- Gemini: https://ai.google.dev/
- Perplexity: https://www.perplexity.ai/settings/api

**Note**: Without API keys, the app uses a basic fallback parser with limited capabilities.

## 🛠️ Troubleshooting

### Common Issues

**🔑 Gemini API Error**
- Verify API key in `.env` file (project root)
- Ensure key format: `GEMINI_API_KEY=AIza...`
- Get a new key from [Google AI Studio](https://ai.google.dev/)

**💾 Database Connection Error**
- Ensure `backend/data/` directory exists (created automatically)
- Check file permissions on Windows: Right-click folder → Properties → Security
- Delete `database.sqlite` and restart backend to recreate

**🌐 CORS Issues**
- Backend allows origins: `http://localhost:5173` and `http://localhost:3000`
- Verify frontend is running on port 5173
- Check browser console for specific CORS error

**⚡ Port Already in Use**
- Change backend port in `backend/app/main.py` (search for `uvicorn.run`)
- Kill existing processes:
  - Windows: `taskkill /F /IM python.exe`
  - Mac/Linux: `lsof -ti:5000 | xargs kill -9`

**📦 Module Not Found Errors**
- Frontend: `cd frontend && npm install`
- Backend: `cd backend && pip install -r requirements.txt`
- Try deleting `node_modules` and reinstalling

**🎨 Canvas Not Rendering**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check browser console for React errors
- Ensure both servers are running

### Debug Mode

- **Browser Console**: F12 → Console tab for frontend logs
- **Network Tab**: F12 → Network to inspect API calls
- **Backend Logs**: Check terminal running Python server
- **API Docs**: http://localhost:5000/docs for interactive testing

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - Natural language processing
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React Flow](https://reactflow.dev/) - Visual node-based editor
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- [Framer Motion](https://www.framer.com/motion/) - React animations
