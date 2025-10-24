# 🤖 Prompt-Based Database Builder

A powerful full-stack web application that converts natural language database descriptions into SQL table definitions, builds ER diagrams, executes SQL on a real database, and stores schemas for reuse.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19+-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-yellow.svg)](https://python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3+-lightblue.svg)](https://sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini%20AI-API-purple.svg)](https://ai.google.dev/)

## ✨ Demo

Generate complex database schemas from simple English descriptions:

```
Input: "Create a hospital database with entities Doctor, Patient, and Appointment. 
Doctor has Doctor_ID, Name, Specialization. Patient has Patient_ID, Name, Age, Address. 
Appointment connects Doctor and Patient with Date and Time."

Output: Complete SQL schema with proper relationships, ER diagram, and visual representation!
```

## 🚀 Features

### ✨ Core Features
- 🤖 **AI-Powered Generation**: Uses Google Gemini AI to convert natural language to SQL
- 📊 **Visual Database Designer**: Drag-and-drop interface for creating tables
- 🔗 **ER Diagram Generation**: Automatic Entity Relationship diagrams with Mermaid
- 💾 **Real Database Execution**: Creates actual SQLite tables from generated SQL
- 📁 **Schema Management**: Save, load, and reuse previously generated schemas
- 🎨 **Modern UI**: Clean, responsive interface with dark/light themes
- 📤 **Export Capabilities**: Download SQL files and PNG diagrams
- 🔄 **Interactive Tables**: Add, edit, and manage table data
- 🔑 **Composite Primary Keys**: Support for multiple column primary keys
- 🗑️ **Canvas Editing**: Add/delete tables directly on the canvas

### 🎯 Key Capabilities
- **🤖 True AI-Powered Generation**: Uses Google Gemini AI to understand ANY database description
- **Smart SQL Generation**: Creates proper table structures with relationships automatically
- **Intelligent Entity Recognition**: Recognizes entities in any domain
- **Automatic Relationship Detection**: Creates proper foreign key relationships
- **Visual Schema Design**: See your database structure at a glance
- **Data Management**: Add sample data and test your schema
- **Schema Persistence**: Save and load complete schemas with data
- **Canvas-Based Editing**: Edit schemas directly on the visual canvas

## Tech Stack

### Frontend
- **Framework**: React with Vite
- **Libraries**: 
  - ReactFlow for visual database design
  - Mermaid.js for ER diagrams
  - Axios for API calls
  - html-to-image for PNG export

### Backend
- **Framework**: Python with FastAPI
- **Database**: SQLite (local)
- **Libraries**: 
  - Google Generative AI for LLM integration
  - sqlite3 for database operations
  - Pydantic for data validation
  - Uvicorn for ASGI server

## 🛠️ Quick Start

> **⚡ For a super quick start, see [QUICK_START.md](QUICK_START.md)**

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **Google Gemini API key** ([Get one here](https://ai.google.dev/))

### 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/prompt-based-database-builder.git
   cd prompt-based-database-builder
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   # Copy the environment template
   cp env.template .env
   
   # Edit .env and add your Gemini API key
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
   
   > **⚠️ Important**: 
   > - The `.env` file is not tracked by git for security reasons. Make sure to create your own `.env` file from the template.
   > - **Get your Gemini API key** from [Google AI Studio](https://ai.google.dev/)
   > - **Without a valid API key**, the app will use a limited fallback parser

5. **Start the application**
   ```bash
   npm run dev
   ```

   This starts both frontend (http://localhost:5173) and backend (http://localhost:5000) concurrently.

   > **💡 Pro Tip**: Use `npm run quick-start` to install dependencies and start in one command!

### 🔧 Alternative: Start servers separately

```bash
# Terminal 1: Start Python backend first
cd backend
python run.py

# Terminal 2: Start React frontend (after backend is running)
cd frontend
npm i
npm run dev
```

### 🚀 Quick Start (One Command)

```bash
# Start both frontend and backend with one command
npm run dev
```

> **📖 For detailed setup instructions, see [QUICK_START.md](QUICK_START.md)**

## 📖 How to Use

### 1. 🤖 AI-Powered Generation
1. Click **"🤖 Generate from Prompt"**
2. Describe your database in natural language:
   ```
   Create a hospital database with entities Doctor, Patient, and Appointment. 
   Doctor has Doctor_ID, Name, Specialization. 
   Patient has Patient_ID, Name, Age, Address. 
   Appointment connects Doctor and Patient with Date and Time.
   ```
3. Click **"Generate Database"** and watch the magic happen!

### 2. 🎨 Visual Database Design
- **Add Tables**: Use **"+ Add Table"** for manual creation
- **Drag & Drop**: Position tables anywhere on the canvas
- **Define Structure**: Add columns, set data types, define primary keys
- **Composite Keys**: Select multiple columns as primary keys
- **Create Relationships**: Connect tables with foreign keys
- **Add Data**: Insert sample data to test your schema
- **Delete Tables**: Click the "×" button on any table to remove it

### 3. 💾 Save & Load Schemas
- **Save Schema**: Click **"💾 Save to Database"** to save the current canvas state
- **Load Schema**: Click **"Saved Schemas"** to load previously saved schemas
- **Reset Database**: Click **"Reset Database"** to clear everything

### 4. 📤 Export & Manage
- **Export SQL**: Click **"Export SQL"** to view and download generated SQL code
- **ER Diagrams**: Click **"ER"** to generate Entity Relationship diagrams
- **Download PNG**: Export diagrams as images

## 🎯 Example Prompts

```
# Hospital System
Create a hospital database with entities Doctor, Patient, and Appointment. 
Doctor has Doctor_ID, Name, Specialization. Patient has Patient_ID, Name, Age, Address. 
Appointment connects Doctor and Patient with Date and Time.

# E-commerce System
Create an e-commerce database with Customer, Product, Order, and OrderItem tables. 
Customers have Customer_ID, Name, Email. Products have Product_ID, Name, Price, Category. 
Orders connect Customers with Order_Date and Total_Amount. OrderItems connect Orders with Products and include Quantity.

# Library System
Build a library database with Book, Member, and Loan tables. 
Books have ISBN, Title, Author, Genre. Members have Member_ID, Name, Email, Phone. 
Loans connect Books and Members with Loan_Date, Return_Date, and Status.

# School Management
Design a school database with Student, Teacher, Course, and Enrollment tables.
Students have Student_ID, Name, Grade_Level, Parent_Email. Teachers have Teacher_ID, Name, Subject, Department.
Courses have Course_ID, Name, Credits, Teacher_ID. Enrollments connect Students and Courses with Grade and Semester.
```

## API Endpoints

### POST /api/generate-database
Generates SQL schema from natural language input.

**Request Body:**
```json
{
  "prompt": "string",
  "aiProvider": "string"
}
```

**Response:**
```json
{
  "sql": "string",
  "schema_data": "object",
  "diagram_data": "object",
  "success": true,
  "message": "string"
}
```

### POST /api/execute-sql
Executes SQL statements on the database.

**Request Body:**
```json
{
  "sql": "string"
}
```

**Response:**
```json
{
  "success": true,
  "results": "array"
}
```

### POST /api/save-schema
Saves a schema to the database.

**Request Body:**
```json
{
  "prompt": "string",
  "sql_code": "string",
  "schema_json": "object"
}
```

### GET /api/saved-schemas
Fetches all previously saved schemas.

**Response:**
```json
{
  "schemas": "array",
  "success": true,
  "message": "string"
}
```

### DELETE /api/schemas/{id}
Deletes a specific saved schema by ID.

### POST /api/reset-database
Resets the entire database.

## Project Structure

```
dbms/
├── frontend/              # Modern React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main application
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
├── backend/               # Backend Python application
│   ├── app/
│   │   └── main.py        # FastAPI application
│   ├── data/              # SQLite database storage
│   ├── run.py             # Main entry point
│   ├── requirements.txt   # Python dependencies
│   ├── .env.template      # Environment configuration template
│   └── README.md          # Backend-specific documentation
├── env.template           # Environment variables template
├── package.json           # Root scripts and dependencies
├── QUICK_START.md         # Quick start guide
└── README.md              # This file
```

## Development

### Available Scripts

- `npm run quick-start` - Install dependencies and start both frontend and backend
- `npm run dev` - Start both frontend and backend concurrently (recommended)
- `npm run dev:client` - Start only the frontend (Vite dev server)
- `npm run start-python` - Start only the Python backend
- `npm run build` - Build the frontend for production
- `npm run lint` - Run ESLint

### 🎯 Quick Commands

```bash
# Ultra quick: Install and start everything (from project root)
npm run quick-start

# Just start the application (from project root)
npm run dev

# Start only frontend (from project root)
npm run dev:client

# Start only backend (from project root)
npm run start-python
```

### 🎯 Manual Commands (Recommended)

```bash
# Backend (from backend/ directory)
cd backend
python run.py

# Frontend (from frontend/ directory)
cd frontend
npm i
npm run dev
```

> **📝 Note**: Manual commands should be run from their respective directories

### Adding New Features

1. **Frontend**: Modify components in `frontend/src/components/`
2. **Backend**: Add endpoints in `backend/app/main.py`
3. **Database**: Modify schema in `backend/app/main.py` init_database function

## 🛠️ Troubleshooting

### Common Issues

1. **🔑 Gemini API Error**: 
   - Verify your API key in `.env` file
   - Get a new key from [Google AI Studio](https://ai.google.dev/)

2. **💾 Database Connection Error**: 
   - Ensure the `backend/data/` directory exists and is writable
   - Check file permissions

3. **🌐 CORS Issues**: 
   - Backend allows all origins in development
   - Check if ports 5000 and 5173 are available

4. **⚡ Port Conflicts**: 
   - Change PORT in Python server if port 5000 is in use
   - Kill existing processes: `taskkill /F /IM python.exe`

### 🐛 Debug Mode

- **Browser Console**: Press F12 → Console tab for frontend errors
- **Server Logs**: Check terminal output for backend errors
- **Network Tab**: F12 → Network to see API requests

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) for natural language processing
- [React Flow](https://reactflow.dev/) for the visual database designer
- [Mermaid](https://mermaid-js.github.io/) for ER diagram generation
- [SQLite](https://sqlite.org/) for database storage
- [FastAPI](https://fastapi.tiangolo.com/) for the Python backend

## Future Enhancements

- Support for schema updates via conversation
- Allow CSV uploads for table population
- Integrate AI explanations of ER diagrams
- Support for multiple LLM providers
- User authentication and project management
- Advanced query generation from natural language
- Support for PostgreSQL and MySQL databases