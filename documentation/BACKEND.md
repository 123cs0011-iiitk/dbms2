# Python Database Management System

A robust Python-based server for converting natural language descriptions into SQL database schemas using Google's Gemini AI.

## 🐍 Why Python?

Python offers superior capabilities for AI/ML tasks: mature AI ecosystem, built-in text processing, robust JSON handling, Pydantic validation, comprehensive error handling, and faster AI model interactions.

## ✨ Features

- **Enhanced Natural Language Processing**: Advanced system prompts with detailed examples
- **Intelligent SQL Generation**: Creates proper CREATE TABLE statements with relationships
- **Real Database Operations**: Execute SQL, inspect tables, manage schemas
- **Interactive API Documentation**: Auto-generated docs at `/docs` endpoint
- **Multi-Provider AI Support**: Google Gemini, Perplexity API, or fallback parser
- **Schema Persistence**: Save and load complete database schemas
- **Sample Data Support**: Handles INSERT statements for test data

## 🚀 Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the project root (not in backend directory):
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here  # Optional
   DEFAULT_AI_PROVIDER=gemini
   DB_PATH=./backend/data/database.sqlite
   PORT=5000
   ```

4. **Start the server:**
   ```bash
   python run.py
   ```

   The server will start on http://localhost:5000

## 📡 API Endpoints

### Complete Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and version |
| GET | `/api/health` | Health check with system status |
| POST | `/api/generate-database` | Generate complete database from natural language |
| POST | `/api/generate-sql` | Generate SQL from prompt (legacy) |
| POST | `/api/execute-sql` | Execute SQL statements and return results |
| GET | `/api/tables` | List all database tables |
| GET | `/api/tables/{table_name}/structure` | Get table structure, columns, and foreign keys |
| DELETE | `/api/tables/{table_name}` | Drop a specific table |
| GET | `/api/generate-drop-sql` | Generate DROP statements for all tables |
| GET | `/api/generate-drop-sql/{table_name}` | Generate DROP statement for specific table |
| GET | `/api/saved-schemas` | Retrieve all saved schemas |
| POST | `/api/save-schema` | Save schema with metadata |
| DELETE | `/api/schemas/{schema_id}` | Delete a saved schema |
| POST | `/api/reset-database` | Reset entire database (drop all tables) |

### Detailed Endpoint Documentation

#### POST /api/generate-database

Generate a complete database schema from natural language description.

**Request:**
```json
{
  "prompt": "Create a library system with books, members, and loans",
  "aiProvider": "gemini"  // Optional: "gemini", "perplexity", or "fallback"
}
```

**Response:**
```json
{
  "sql": "CREATE TABLE Book (...); CREATE TABLE Member (...);",
  "schema_data": {
    "tables": [
      {
        "name": "Book",
        "attributes": [
          {"name": "ISBN", "type": "VARCHAR(13)", "isPrimaryKey": true},
          {"name": "Title", "type": "VARCHAR(200)", "isNullable": false}
        ]
      }
    ],
    "relationships": [...]
  },
  "diagram_data": {...},
  "success": true,
  "message": "Database schema generated successfully"
}
```

#### POST /api/execute-sql

Execute SQL statements on the database.

**Request:**
```json
{
  "sql": "SELECT * FROM Book WHERE Genre = 'Fiction'"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    ["ISBN", "Title", "Author", "Genre"],
    ["978-0-123456-78-9", "Example Book", "John Doe", "Fiction"]
  ],
  "message": "Query executed successfully"
}
```

#### GET /api/tables/{table_name}/structure

Get detailed table structure including columns and foreign keys.

**Response:**
```json
{
  "success": true,
  "table_structure": {
    "table_name": "Book",
    "columns": [
      {
        "name": "ISBN",
        "type": "VARCHAR(13)",
        "not_null": true,
        "primary_key": true,
        "default_value": null
      }
    ],
    "foreign_keys": [
      {
        "column": "Publisher_ID",
        "references_table": "Publisher",
        "references_column": "Publisher_ID"
      }
    ]
  }
}
```

#### GET /api/saved-schemas

Retrieve all saved schemas with metadata.

**Response:**
```json
{
  "schemas": [
    {
      "id": 1,
      "prompt": "Library system",
      "sql_code": "CREATE TABLE ...",
      "schema_data": "{...}",
      "created_at": "2025-01-15 10:30:00"
    }
  ],
  "success": true,
  "message": "Found 1 saved schemas"
}
```

#### POST /api/save-schema

Save a schema to the database.

**Request:**
```json
{
  "prompt": "Library management system",
  "sql_code": "CREATE TABLE Book (...);",
  "schema_json": {
    "tables": [...],
    "relationships": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Schema saved with ID: 1",
  "schema_id": 1
}
```

#### POST /api/reset-database

Reset the entire database by dropping all user tables.

**Response:**
```json
{
  "success": true,
  "message": "Database reset successfully"
}
```

## 🤖 AI System Prompts

### Natural Language Processing

The server uses enhanced system prompts for better schema generation:

```python
system_prompt = """
You are a database schema expert. Parse natural language into structured JSON.

Return ONLY valid JSON with this structure:
{
  "tables": [
    {
      "name": "EntityName",
      "attributes": ["Attribute1", "Attribute2"]
    }
  ],
  "relationships": [
    {
      "fromTable": "Table1",
      "fromColumn": "Column1",
      "toTable": "Table2",
      "toColumn": "Column2"
    }
  ]
}

Example Input: "Gym system with members who book sessions with trainers"

Example Output:
{
  "tables": [
    {
      "name": "Member",
      "attributes": ["Member_ID", "Name", "Email", "Membership_Type"]
    },
    {
      "name": "Trainer",
      "attributes": ["Trainer_ID", "Name", "Specialization"]
    },
    {
      "name": "Session",
      "attributes": ["Session_ID", "Member_ID", "Trainer_ID", "Date"]
    }
  ],
  "relationships": [...]
}
"""
```

### SQL Generation

SQL is generated with proper constraints:
- Primary keys with auto-increment
- Foreign keys with proper references
- NOT NULL constraints where appropriate
- VARCHAR lengths based on attribute type
- Proper data types (INTEGER, TEXT, TIMESTAMP, etc.)

## 🧪 Testing & Development

### Manual Testing

```bash
# Test health check
curl http://localhost:5000/api/health

# Test generation
curl -X POST http://localhost:5000/api/generate-database \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a simple blog with posts and comments"}'

# Test SQL execution
curl -X POST http://localhost:5000/api/execute-sql \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM sqlite_master WHERE type=\"table\""}'

# List tables
curl http://localhost:5000/api/tables
```

### Interactive API Documentation

Once the server is running:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

Test all endpoints directly in the browser with interactive forms.

## 📁 File Structure

```
backend/
├── app/
│   └── main.py              # FastAPI application with all endpoints
├── data/
│   └── database.sqlite      # SQLite database (auto-created)
├── run.py                   # Server entry point with dependency check
├── requirements.txt         # Python dependencies
└── README.md                # This file
```

## 🔧 Configuration

### Dependencies

```txt
fastapi>=0.100.0             # Web framework
uvicorn[standard]>=0.20.0    # ASGI server
google-generativeai>=0.8.0   # Gemini AI SDK
pydantic>=2.0.0              # Data validation
python-dotenv>=1.0.0         # Environment variables
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | None (uses fallback) |
| `PERPLEXITY_API_KEY` | Perplexity API key | None |
| `DEFAULT_AI_PROVIDER` | AI provider to use | `fallback` |
| `DB_PATH` | SQLite database path | `./data/database.sqlite` |
| `PORT` | Server port | `5000` |

## 🛠️ Troubleshooting

### Common Issues

**Python version too old**
```bash
python --version  # Should be 3.8+
# Install Python from python.org
```

**Missing dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**API key not configured**
```bash
# Check .env file exists in project root (not in backend)
# Should contain: GEMINI_API_KEY=your_key_here
```

**Port already in use**
```bash
# Windows
taskkill /F /PID (netstat -ano | findstr :5000)[-1].split()[-1]

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**Database locked errors**
```bash
# Close all connections and restart server
# Or delete database.sqlite and restart
```

**Import errors with google-generativeai**
```bash
pip install --upgrade google-generativeai
```

### Debug Mode

Start the server with verbose logging:

```bash
# In backend directory
python -c "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=5000, reload=True, log_level='debug')"
```

## 📊 Performance

- **Response Time**: Typically 2-5 seconds for AI generation
- **Database**: SQLite with in-memory caching for fast queries
- **Concurrent Requests**: Supports multiple simultaneous API calls
- **Error Handling**: Comprehensive try-catch with detailed error messages

## 🔒 Security

- Input validation with Pydantic models
- SQL injection prevention with parameterized queries
- Table name validation with regex
- CORS restricted to localhost origins
- No sensitive data in logs or responses

## 📝 License

MIT License - see parent directory for details.
