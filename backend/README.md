# Python Database Management System

A robust Python-based server for converting natural language descriptions into SQL database schemas using Google's Gemini AI.

## Why Python?

Python offers several advantages over JavaScript for AI/ML tasks:

- **Better AI/ML Libraries**: More mature ecosystem for AI processing
- **Superior Text Processing**: Built-in string manipulation and regex support
- **Robust JSON Handling**: Native JSON parsing with better error handling
- **Type Safety**: Pydantic models for request/response validation
- **Better Error Handling**: More comprehensive exception handling
- **Performance**: Faster text processing and AI model interactions
- **Ecosystem**: Rich libraries for data processing and database operations

## Features

### Enhanced Natural Language Processing
- **Improved System Prompts**: More detailed examples and clearer instructions
- **Better JSON Parsing**: Robust error handling and validation
- **Structured Schema Generation**: Converts natural language to structured JSON
- **Intelligent SQL Generation**: Creates proper CREATE TABLE statements with relationships

### API Endpoints
- `POST /api/generate-sql` - Generate SQL from natural language
- `POST /api/execute-sql` - Execute SQL and return results
- `GET /api/tables` - Get list of database tables
- `GET /api/health` - Health check endpoint
- `GET /docs` - Interactive API documentation

## Installation

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
   Create a `.env` file in the root directory with:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   DB_PATH=./backend/data/database.sqlite
   ```

4. **Start the server:**
   ```bash
   python run.py
   ```

   Or manually:
   ```bash
   cd app
   python main.py
   ```

## Usage

### Test Prompts and Outputs

Run the test script to see exactly what prompts are sent to Gemini:

```bash
python test_backend.py
```

This will show:
- System prompts sent to Gemini
- User prompts (natural language descriptions)
- Raw responses from Gemini
- Cleaned and processed outputs
- Generated SQL statements

### API Usage

#### Generate SQL from Natural Language

```bash
curl -X POST "http://localhost:5000/api/generate-sql" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "We have a gym management system with members who can book training sessions with trainers. Each member has a membership type and join date."
  }'
```

#### Execute SQL

```bash
curl -X POST "http://localhost:5000/api/execute-sql" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE TABLE IF NOT EXISTS Members (id INTEGER PRIMARY KEY, name TEXT);"
  }'
```

#### Get Database Tables

```bash
curl "http://localhost:5000/api/tables"
```

## Enhanced System Prompts

### Natural Language Processing

The Python server uses enhanced system prompts with detailed examples:

```
You are a database schema expert. Parse the given natural language description into a structured database schema.

Return ONLY a valid JSON object with this exact structure:
{
  "tables": [
    {
      "name": "EntityName",
      "attributes": ["Attribute1", "Attribute2", "Attribute3"]
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

DETAILED EXAMPLES:

Example 1 - Input: "We have a gym management system with members who can book training sessions with trainers..."

Expected Output:
{
  "tables": [
    {
      "name": "Member",
      "attributes": ["Member_ID", "Name", "Email", "Membership_Type", "Join_Date"]
    },
    {
      "name": "Trainer",
      "attributes": ["Trainer_ID", "Name", "Specialization", "Certification"]
    },
    {
      "name": "Training_Session",
      "attributes": ["Session_ID", "Member_ID", "Trainer_ID", "Date", "Duration", "Session_Type"]
    }
  ],
  "relationships": [
    {
      "fromTable": "Training_Session",
      "fromColumn": "Member_ID",
      "toTable": "Member",
      "toColumn": "Member_ID"
    },
    {
      "fromTable": "Training_Session",
      "fromColumn": "Trainer_ID",
      "toTable": "Trainer",
      "toColumn": "Trainer_ID"
    }
  ]
}

CRITICAL: Follow the exact JSON structure above. Return ONLY the JSON, no explanations, no markdown formatting, no additional text.
```

## Key Improvements Over JavaScript Version

### 1. Better Error Handling
- Comprehensive try-catch blocks
- Detailed error messages
- Graceful fallbacks

### 2. Enhanced Text Processing
- Robust regex patterns
- Better string manipulation
- Improved JSON parsing

### 3. Type Safety
- Pydantic models for request/response validation
- Type hints throughout the codebase
- Better IDE support

### 4. Performance
- Faster text processing
- More efficient AI model interactions
- Better memory management

### 5. Maintainability
- Cleaner code structure
- Better separation of concerns
- More readable and maintainable

## File Structure

```
backend/
├── app/
│   └── main.py            # Main FastAPI application
├── data/                  # SQLite database storage
├── run.py                 # Main entry point with dependency installation
├── requirements.txt       # Python dependencies
├── .env.template         # Environment configuration template
└── README.md             # This file
```

## Development

### Running Tests

```bash
python test_backend.py
```

### Development Mode

```bash
python start.py
```

The server will start with auto-reload enabled for development.

### API Documentation

Once the server is running, visit:
- http://localhost:5000/docs - Interactive API documentation
- http://localhost:5000/redoc - Alternative API documentation

## Comparison: Python vs JavaScript

| Feature | Python | JavaScript |
|---------|--------|------------|
| AI/ML Libraries | ✅ Mature ecosystem | ⚠️ Limited options |
| Text Processing | ✅ Built-in support | ⚠️ Requires libraries |
| JSON Handling | ✅ Native, robust | ⚠️ Basic parsing |
| Type Safety | ✅ Pydantic models | ⚠️ Limited typing |
| Error Handling | ✅ Comprehensive | ⚠️ Basic try-catch |
| Performance | ✅ Fast text processing | ⚠️ Slower for AI tasks |
| Maintainability | ✅ Clean structure | ⚠️ Can get messy |

## Troubleshooting

### Common Issues

1. **Python version too old:**
   ```bash
   python --version  # Should be 3.8+
   ```

2. **Missing dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **API key not configured:**
   - Check `.env` file exists
   - Verify `GEMINI_API_KEY` is set correctly

4. **Port already in use:**
   - Change port in `main.py` or `start.py`
   - Kill existing process on port 5000

### Getting Help

- Check the logs for detailed error messages
- Run `python test_backend.py` to test prompts
- Visit `/docs` endpoint for API documentation
- Check `/health` endpoint for system status

## License

MIT License - see parent directory for details.
