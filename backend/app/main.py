"""
Python FastAPI server for database management system
Converted from Node.js for better AI/ML processing capabilities
"""

import os
import json
import sqlite3
import re
from typing import Dict, List, Optional, Any
from pathlib import Path

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from project root
load_dotenv(Path(__file__).parent.parent.parent / ".env")

# Initialize FastAPI app
app = FastAPI(title="Database Management System", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database when the application starts"""
    init_database()

# Configure Gemini AI
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
    genai.configure(api_key=GEMINI_API_KEY)
    GEMINI_AVAILABLE = True
    
    # Suppress Gemini warnings
    import logging
    logging.getLogger('google.generativeai').setLevel(logging.ERROR)
    logging.getLogger('google').setLevel(logging.ERROR)
    logging.getLogger('absl').setLevel(logging.ERROR)
else:
    GEMINI_AVAILABLE = False

# Database configuration
DB_PATH_ENV = os.getenv("DB_PATH", "./data/database.sqlite")
# Resolve database path relative to backend directory
if not os.path.isabs(DB_PATH_ENV):
    backend_dir = Path(__file__).parent.parent
    DB_PATH = os.path.join(backend_dir, DB_PATH_ENV.lstrip('./'))
else:
    DB_PATH = DB_PATH_ENV

# Pydantic models
class GenerateSQLRequest(BaseModel):
    prompt: str
    provider: Optional[str] = None

class GenerateSQLResponse(BaseModel):
    sql: str
    success: bool
    message: str

class DatabaseInfo(BaseModel):
    tables: List[str]
    success: bool
    message: str

class GenerateDatabaseRequest(BaseModel):
    prompt: str
    aiProvider: Optional[str] = "fallback"

class GenerateDatabaseResponse(BaseModel):
    sql: str
    schema_data: Dict[str, Any]
    diagram_data: Optional[Dict[str, Any]] = None
    success: bool
    message: str

class GenerateLayoutRequest(BaseModel):
    entities: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]

class GenerateLayoutResponse(BaseModel):
    positions: Dict[str, Dict[str, float]]  # entity_name -> {x, y}
    success: bool
    message: str

class SavedSchema(BaseModel):
    id: int
    prompt: str
    sql_code: str
    schema_data: str
    created_at: str

class SchemaListResponse(BaseModel):
    schemas: List[SavedSchema]
    success: bool
    message: str

# Database utilities
def init_database():
    """Initialize the SQLite database"""
    # Create directory if it doesn't exist
    db_dir = os.path.dirname(DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create a simple test table if none exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS test_table (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create schemas table for saving generated schemas
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_schemas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            sql_code TEXT NOT NULL,
            schema_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

def execute_sql(sql: str) -> Dict[str, Any]:
    """Execute SQL and return results"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Split SQL into individual statements
        statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
        
        results = []
        for statement in statements:
            if statement.upper().startswith('SELECT'):
                cursor.execute(statement)
                columns = [description[0] for description in cursor.description]
                rows = cursor.fetchall()
                results.append({
                    "type": "SELECT",
                    "columns": columns,
                    "rows": rows
                })
            else:
                cursor.execute(statement)
                results.append({
                    "type": "DML",
                    "message": f"Statement executed successfully"
                })
        
        conn.commit()
        conn.close()
        
        return {"success": True, "results": results}
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_database_tables() -> List[str]:
    """Get list of tables in the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return tables
        
    except Exception as e:
        print(f"Error getting tables: {e}")
        return []

def save_schema(prompt: str, sql_code: str, schema_data: Dict[str, Any]) -> int:
    """Save a generated schema to the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO saved_schemas (prompt, sql_code, schema_data)
            VALUES (?, ?, ?)
        """, (prompt, sql_code, json.dumps(schema_data)))
        
        schema_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        print(f"✅ Schema saved with ID: {schema_id}")
        return schema_id
        
    except Exception as e:
        print(f"Error saving schema: {e}")
        return None

def get_saved_schemas() -> List[Dict[str, Any]]:
    """Get all saved schemas from the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, prompt, sql_code, schema_data, created_at
            FROM saved_schemas
            ORDER BY created_at DESC
        """)
        
        schemas = []
        for row in cursor.fetchall():
            schemas.append({
                "id": row[0],
                "prompt": row[1],
                "sql_code": row[2],
                "schema_data": row[3],
                "created_at": row[4]
            })
        
        conn.close()
        return schemas
        
    except Exception as e:
        print(f"Error getting saved schemas: {e}")
        return []

def delete_saved_schema(schema_id: int) -> bool:
    """Delete a saved schema from the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM saved_schemas WHERE id = ?", (schema_id,))
        deleted_count = cursor.rowcount
        
        conn.commit()
        conn.close()
        
        return deleted_count > 0
        
    except Exception as e:
        print(f"Error deleting schema: {e}")
        return False

# AI/ML utilities
def generate_sql_with_gemini(prompt: str) -> str:
    """Generate SQL using Gemini AI with enhanced natural language processing"""
    if not GEMINI_AVAILABLE:
        raise Exception("Gemini API key not configured")
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Enhanced system prompt with better examples
        system_prompt = """You are a database expert. Given ANY natural language description of a database, generate clean, properly structured SQL CREATE TABLE statements with appropriate foreign key relationships.

CRITICAL REQUIREMENTS:
1. Analyze the ENTIRE prompt and extract ALL entities, their attributes, and relationships
2. Use CREATE TABLE IF NOT EXISTS syntax
3. Include proper PRIMARY KEY constraints  
4. Add appropriate data types (INTEGER, TEXT, DATE, TIME, etc.)
5. Include NOT NULL constraints where appropriate
6. Add UNIQUE constraints for emails and similar fields
7. Create foreign key relationships for junction/relationship tables
8. Use proper naming conventions (plural table names, descriptive column names)
9. Extract ALL entities mentioned, even complex ones like "Course_Assignment", "Training_Session", etc.
10. Output ONLY the SQL code with no explanations, comments, or markdown formatting
11. Each table should be separated by exactly two newlines
12. Use consistent indentation (2 spaces per level)
13. Handle complex many-to-many relationships with proper junction tables
14. Ensure foreign keys reference the correct primary keys
15. **CRITICAL: NEVER create duplicate column names in the same table**
16. **CRITICAL: Each column should appear exactly once per table**

OUTPUT FORMAT (follow this exactly):
CREATE TABLE IF NOT EXISTS [TableName] (
  [ColumnName] [DataType] [Constraints],
  [ColumnName] [DataType] [Constraints],
  FOREIGN KEY ([ColumnName]) REFERENCES [ReferencedTable]([ReferencedColumn])
);

CREATE TABLE IF NOT EXISTS [NextTableName] (
  [ColumnName] [DataType] [Constraints],
  [ColumnName] [DataType] [Constraints]
);

DETAILED EXAMPLES:

Example 1 - Input: "We have a gym management system with members who can book training sessions with trainers. Each member has a membership type and join date. Training sessions have a date, duration, and can be group or individual sessions."

Expected Output:
CREATE TABLE IF NOT EXISTS Members (
  Member_ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  Email TEXT UNIQUE,
  Membership_Type TEXT,
  Join_Date DATE
);

CREATE TABLE IF NOT EXISTS Trainers (
  Trainer_ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  Specialization TEXT,
  Certification TEXT
);

CREATE TABLE IF NOT EXISTS Training_Sessions (
  Session_ID INTEGER PRIMARY KEY,
  Member_ID INTEGER,
  Trainer_ID INTEGER,
  Date DATE,
  Duration INTEGER,
  Session_Type TEXT,
  FOREIGN KEY (Member_ID) REFERENCES Members(Member_ID),
  FOREIGN KEY (Trainer_ID) REFERENCES Trainers(Trainer_ID)
);

Example 2 - Input: "A library system where students can borrow books. Each student has a student ID, name, and department. Books have ISBN, title, author, and genre. There's also a librarian who manages the system."

Expected Output:
CREATE TABLE IF NOT EXISTS Students (
  Student_ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  Department TEXT,
  Email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS Books (
  ISBN TEXT PRIMARY KEY,
  Title TEXT NOT NULL,
  Author TEXT,
  Genre TEXT,
  Availability_Status TEXT
);

CREATE TABLE IF NOT EXISTS Librarians (
  Librarian_ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  Employee_ID TEXT UNIQUE,
  Department TEXT
);

CREATE TABLE IF NOT EXISTS Borrowings (
  Borrowing_ID INTEGER PRIMARY KEY,
  Student_ID INTEGER,
  ISBN TEXT,
  Borrow_Date DATE,
  Return_Date DATE,
  FOREIGN KEY (Student_ID) REFERENCES Students(Student_ID),
  FOREIGN KEY (ISBN) REFERENCES Books(ISBN)
);

Now generate SQL for this prompt:"""

        response = model.generate_content([system_prompt, prompt])
        sql = response.text
        
        # Clean up the response
        clean_sql = clean_sql_response(sql)
        
        return clean_sql
        
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

def parse_natural_language_with_ai(prompt: str) -> Optional[Dict[str, Any]]:
    """Parse natural language using AI to extract structured schema"""
    if not GEMINI_AVAILABLE:
        return None
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        system_prompt = """You are a database schema expert. Parse the given natural language description into a structured database schema.

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
      "toColumn": "Column2",
      "relationshipName": "verb"
    }
  ]
}

Rules:
1. Extract ALL entities mentioned in the description
2. For each entity, infer reasonable attributes based on context
3. Always include an ID field as the first attribute (e.g., "Student_ID", "Course_ID")
4. Add common attributes like Name, Description, Date, etc. when contextually appropriate
5. Identify relationships between entities and create foreign key connections
6. Use proper naming conventions (PascalCase for tables, snake_case for columns)
7. Be generous with attributes - better to include more than miss important ones
8. For many-to-many relationships, create junction tables (e.g., Enrollment, Course_Assignment)
9. Include all relevant attributes for each entity based on the context
10. **CRITICAL**: For each relationship, provide a "relationshipName" field with a semantic 1-2 word verb/action that describes the relationship (e.g., "enrolls", "teaches", "manages", "treats", "belongs_to", "contains", "studies", "has", "owns")

DETAILED EXAMPLES:

Example 1 - Input: "We have a gym management system with members who can book training sessions with trainers. Each member has a membership type and join date. Training sessions have a date, duration, and can be group or individual sessions."

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
      "toColumn": "Member_ID",
      "relationshipName": "books"
    },
    {
      "fromTable": "Training_Session",
      "fromColumn": "Trainer_ID",
      "toTable": "Trainer",
      "toColumn": "Trainer_ID",
      "relationshipName": "conducts"
    }
  ]
}

Example 2 - Input: "A library system where students can borrow books. Each student has a student ID, name, and department. Books have ISBN, title, author, and genre. There's also a librarian who manages the system."

Expected Output:
{
  "tables": [
    {
      "name": "Student",
      "attributes": ["Student_ID", "Name", "Department", "Email"]
    },
    {
      "name": "Book",
      "attributes": ["ISBN", "Title", "Author", "Genre", "Availability_Status"]
    },
    {
      "name": "Librarian",
      "attributes": ["Librarian_ID", "Name", "Employee_ID", "Department"]
    },
    {
      "name": "Borrowing",
      "attributes": ["Borrowing_ID", "Student_ID", "ISBN", "Borrow_Date", "Return_Date"]
    }
  ],
  "relationships": [
    {
      "fromTable": "Borrowing",
      "fromColumn": "Student_ID",
      "toTable": "Student",
      "toColumn": "Student_ID",
      "relationshipName": "borrows"
    },
    {
      "fromTable": "Borrowing",
      "fromColumn": "ISBN",
      "toTable": "Book",
      "toColumn": "ISBN",
      "relationshipName": "includes"
    }
  ]
}

CRITICAL: Follow the exact JSON structure above. Return ONLY the JSON, no explanations, no markdown formatting, no additional text."""

        full_prompt = f"{system_prompt}\n\nUser Request: {prompt}"
        
        response = model.generate_content(full_prompt)
        ai_response = response.text
        
        # Clean and parse JSON response
        cleaned_response = ai_response.replace("```json", "").replace("```", "").strip()
        parsed_schema = json.loads(cleaned_response)
        
        # Validate schema structure
        if not parsed_schema.get("tables") or not isinstance(parsed_schema["tables"], list):
            return None
        
        if not parsed_schema.get("relationships"):
            parsed_schema["relationships"] = []
        
        # Convert attributes to columns format for frontend compatibility
        for table in parsed_schema["tables"]:
            if "attributes" in table and "columns" not in table:
                columns = []
                for attr in table["attributes"]:
                    # Determine data type
                    data_type = "TEXT"
                    if attr.lower().endswith("_id") and not attr.lower().endswith("name"):
                        data_type = "INTEGER"
                    elif "date" in attr.lower():
                        data_type = "DATE"
                    elif "time" in attr.lower() or "duration" in attr.lower():
                        data_type = "INTEGER"
                    elif any(word in attr.lower() for word in ["age", "price", "amount", "credits"]):
                        data_type = "INTEGER"
                    
                    columns.append({
                        "name": attr,
                        "type": data_type
                    })
                table["columns"] = columns
        
        return parsed_schema
        
    except Exception as e:
        print(f"Error in AI parsing: {e}")
        return None

def generate_sql_from_structured_schema(schema: Dict[str, Any]) -> str:
    """Generate SQL from structured schema"""
    sql_parts = []
    
    for table in schema["tables"]:
        table_sql = generate_table_sql(table, schema["tables"], schema["relationships"])
        sql_parts.append(table_sql)
    
    return "\n\n".join(sql_parts)

def generate_table_sql(table: Dict[str, Any], all_tables: List[Dict], relationships: List[Dict]) -> str:
    """Generate SQL for a single table"""
    table_name = f"{table['name']}s"
    sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n"
    
    has_primary_key = False
    foreign_keys = []
    
    # Add attributes - handle both 'attributes' and 'columns' formats
    attributes = table.get("attributes", [])
    if not attributes and table.get("columns"):
        # Convert columns format to attributes
        attributes = [col.get("name", col) if isinstance(col, dict) else col for col in table["columns"]]
    
    for i, attr in enumerate(attributes):
        is_last = i == len(attributes) - 1
        
        # Determine data type
        data_type = "TEXT"
        if attr.lower().endswith("_id") and not attr.lower().endswith("name"):
            data_type = "INTEGER"
        elif "date" in attr.lower():
            data_type = "DATE"
        elif "time" in attr.lower() or "duration" in attr.lower():
            data_type = "INTEGER"
        elif any(word in attr.lower() for word in ["age", "price", "amount", "credits"]):
            data_type = "INTEGER"
        
        sql += f"  {attr} {data_type}"
        
        # Add constraints
        if not has_primary_key and attr.lower().endswith("_id") and not attr.lower().endswith("name"):
            sql += " PRIMARY KEY"
            has_primary_key = True
        
        if "email" in attr.lower():
            sql += " UNIQUE"
        if "name" in attr.lower() and not attr.lower().endswith("_id"):
            sql += " NOT NULL"
        
        if not is_last or relationships:
            sql += ","
        sql += "\n"
    
    # Add foreign key constraints
    table_relationships = [rel for rel in relationships if rel["fromTable"] == table["name"]]
    for i, rel in enumerate(table_relationships):
        sql += f"  FOREIGN KEY ({rel['fromColumn']}) REFERENCES {rel['toTable']}s({rel['toColumn']})"
        if i < len(table_relationships) - 1:
            sql += ","
        sql += "\n"
    
    sql += ");"
    return sql

def clean_sql_response(sql: str) -> str:
    """Clean SQL response from AI"""
    # Remove markdown formatting
    clean_sql = re.sub(r'```sql\n?', '', sql)
    clean_sql = re.sub(r'```\n?', '', clean_sql)
    clean_sql = clean_sql.strip()
    
    # Remove other formatting
    clean_sql = re.sub(r'^\*\*.*\*\*$', '', clean_sql, flags=re.MULTILINE)
    clean_sql = re.sub(r'^#+.*$', '', clean_sql, flags=re.MULTILINE)
    
    # Ensure proper table separation
    clean_sql = re.sub(r'\n\s*\n\s*\n', '\n\n', clean_sql)
    
    return clean_sql

def generate_drop_table_sql(table_name: str) -> str:
    """Generate DROP TABLE SQL command"""
    return f"DROP TABLE IF EXISTS {table_name};"

def generate_drop_tables_sql(table_names: List[str]) -> str:
    """Generate DROP TABLE SQL commands for multiple tables"""
    if not table_names:
        return "-- No tables to drop"
    
    drop_commands = []
    for table_name in table_names:
        drop_commands.append(generate_drop_table_sql(table_name))
    
    return "\n".join(drop_commands)

def get_all_tables() -> List[str]:
    """Get all table names from the database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return tables
    except Exception as e:
        print(f"Error getting tables: {e}")
        return []

def generate_sql_with_fallback(prompt: str) -> str:
    """Fallback SQL generation using rule-based approach"""
    # Simple fallback - create a basic table
    return """CREATE TABLE IF NOT EXISTS Generated_Table (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"""

def generate_layout_with_ai(entities: List[Dict], relationships: List[Dict]) -> Optional[Dict[str, Dict[str, float]]]:
    """Generate optimal layout positions using AI"""
    if not GEMINI_AVAILABLE:
        return None
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Create a description of the graph structure
        entity_names = [e.get('name', f"Entity{i}") for i, e in enumerate(entities)]
        rel_descriptions = []
        for rel in relationships:
            from_name = rel.get('fromTable', rel.get('fromEntityId', 'Unknown'))
            to_name = rel.get('toTable', rel.get('toEntityId', 'Unknown'))
            rel_name = rel.get('relationshipName', rel.get('name', 'relates'))
            rel_descriptions.append(f"{from_name} --{rel_name}--> {to_name}")
        
        system_prompt = f"""You are a graph visualization expert. Given entities and their relationships, generate optimal 2D positions for an ER diagram.

Entities: {', '.join(entity_names)}

Relationships:
{chr(10).join(rel_descriptions)}

Generate optimal X,Y coordinates where:
1. Related entities are placed near each other (but not overlapping)
2. Minimum spacing between entities: 300px
3. Create hierarchical layout if applicable (parent entities on top/left)
4. Minimize edge crossings
5. Create visually balanced arrangement
6. Viewport center should be around (600, 400)
7. Spread entities across at least 400-800px range

Return ONLY a JSON object with this structure:
{{
  "EntityName1": {{"x": 400, "y": 300}},
  "EntityName2": {{"x": 700, "y": 300}},
  "EntityName3": {{"x": 550, "y": 600}}
}}

CRITICAL: Return ONLY the JSON, no explanations, no markdown formatting."""

        response = model.generate_content(system_prompt)
        ai_response = response.text
        
        # Clean and parse JSON response
        cleaned_response = ai_response.replace("```json", "").replace("```", "").strip()
        positions = json.loads(cleaned_response)
        
        return positions
        
    except Exception as e:
        print(f"AI layout generation failed: {e}")
        return None

# API Routes
@app.get("/")
async def root():
    return {"message": "Database Management System API", "version": "2.0.0", "language": "Python"}

@app.post("/api/generate-sql", response_model=GenerateSQLResponse)
async def generate_sql(request: GenerateSQLRequest):
    """Generate SQL from natural language prompt"""
    try:
        print(f"🤖 Generating SQL for prompt: {request.prompt}")
        
        # Try AI parsing first
        if GEMINI_AVAILABLE:
            try:
                # First try structured parsing
                schema = parse_natural_language_with_ai(request.prompt)
                if schema:
                    print("✅ AI parser successfully extracted schema")
                    sql = generate_sql_from_structured_schema(schema)
                    return GenerateSQLResponse(
                        sql=sql,
                        success=True,
                        message="SQL generated using AI natural language processing"
                    )
            except Exception as e:
                print(f"⚠️ AI parsing failed: {e}")
        
        # Fallback to direct SQL generation
        if GEMINI_AVAILABLE:
            try:
                sql = generate_sql_with_gemini(request.prompt)
                return GenerateSQLResponse(
                    sql=sql,
                    success=True,
                    message="SQL generated using AI"
                )
            except Exception as e:
                print(f"⚠️ AI generation failed: {e}")
        
        # Final fallback
        sql = generate_sql_with_fallback(request.prompt)
        return GenerateSQLResponse(
            sql=sql,
            success=True,
            message="SQL generated using fallback method"
        )
        
    except Exception as e:
        print(f"❌ Error generating SQL: {e}")
        return GenerateSQLResponse(
            sql="",
            success=False,
            message=f"Error: {str(e)}"
        )

@app.post("/api/execute-sql")
async def execute_sql_endpoint(request: dict):
    """Execute SQL and return results"""
    try:
        sql = request.get("sql", "")
        if not sql:
            raise HTTPException(status_code=400, detail="SQL is required")
        
        result = execute_sql(sql)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables", response_model=DatabaseInfo)
async def get_tables():
    """Get list of database tables"""
    try:
        tables = get_database_tables()
        return DatabaseInfo(
            tables=tables,
            success=True,
            message=f"Found {len(tables)} tables"
        )
    except Exception as e:
        return DatabaseInfo(
            tables=[],
            success=False,
            message=f"Error: {str(e)}"
        )

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "gemini_available": GEMINI_AVAILABLE,
        "database_path": DB_PATH,
        "language": "Python"
    }

@app.post("/api/generate-database", response_model=GenerateDatabaseResponse)
async def generate_database(request: GenerateDatabaseRequest):
    """Generate complete database from natural language prompt"""
    try:
        print(f"🤖 Generating database for prompt: {request.prompt}")
        
        # Try AI parsing first
        schema_json = None
        if GEMINI_AVAILABLE and request.aiProvider in ["gemini", "fallback"]:
            try:
                schema_json = parse_natural_language_with_ai(request.prompt)
                if schema_json:
                    print("✅ AI parser successfully extracted schema")
            except Exception as e:
                print(f"⚠️ AI parsing failed: {e}")
        
        # Generate SQL
        if schema_json:
            sql = generate_sql_from_structured_schema(schema_json)
        elif GEMINI_AVAILABLE:
            try:
                sql = generate_sql_with_gemini(request.prompt)
                # Try to parse the generated SQL back to schema
                schema_json = parse_sql_to_schema(sql)
            except Exception as e:
                print(f"⚠️ AI generation failed: {e}")
                sql = generate_sql_with_fallback(request.prompt)
                schema_json = {"tables": [], "relationships": []}
        else:
            sql = generate_sql_with_fallback(request.prompt)
            schema_json = {"tables": [], "relationships": []}
        
        # Save to database
        try:
            print(f"🔧 Executing SQL: {sql[:100]}...")
            result = execute_sql(sql)
            print(f"✅ Database created successfully: {result}")
        except Exception as e:
            print(f"⚠️ Database creation failed: {e}")
            import traceback
            traceback.print_exc()
        
        # Save schema to database
        if schema_json:
            try:
                schema_id = save_schema(request.prompt, sql, schema_json)
                if schema_id:
                    print(f"✅ Schema saved with ID: {schema_id}")
            except Exception as e:
                print(f"⚠️ Schema saving failed: {e}")
        
        return GenerateDatabaseResponse(
            sql=sql,
            schema_data=schema_json,
            diagram_data=None,
            success=True,
            message="Database generated successfully"
        )
        
    except Exception as e:
        print(f"❌ Error generating database: {e}")
        return GenerateDatabaseResponse(
            sql="",
            schema_data={"tables": [], "relationships": []},
            diagram_data=None,
            success=False,
            message=f"Error: {str(e)}"
        )

@app.get("/api/saved-schemas", response_model=SchemaListResponse)
async def get_saved_schemas_endpoint():
    """Get list of saved schemas"""
    try:
        schemas = get_saved_schemas()
        return SchemaListResponse(
            schemas=schemas,
            success=True,
            message=f"Found {len(schemas)} saved schemas"
        )
    except Exception as e:
        return SchemaListResponse(
            schemas=[],
            success=False,
            message=f"Error: {str(e)}"
        )

@app.post("/api/save-schema")
async def save_schema_endpoint(request: dict):
    """Save a schema to the database"""
    try:
        prompt = request.get("prompt", "")
        sql_code = request.get("sql_code", "")
        schema_data = request.get("schema_json", {})
        
        if not prompt or not sql_code:
            return {"success": False, "message": "Prompt and SQL code are required"}
        
        schema_id = save_schema(prompt, sql_code, schema_data)
        if schema_id:
            return {"success": True, "message": f"Schema saved with ID: {schema_id}", "schema_id": schema_id}
        else:
            return {"success": False, "message": "Failed to save schema"}
    except Exception as e:
        return {"success": False, "message": f"Error: {str(e)}"}

@app.delete("/api/schemas/{schema_id}")
async def delete_schema(schema_id: int):
    """Delete a saved schema"""
    try:
        success = delete_saved_schema(schema_id)
        if success:
            return {"success": True, "message": "Schema deleted successfully"}
        else:
            return {"success": False, "message": "Schema not found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reset-database")
async def reset_database():
    """Reset the entire database"""
    try:
        # Drop all tables except sqlite_master
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Disable foreign key constraints temporarily
        cursor.execute("PRAGMA foreign_keys = OFF")
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        # Drop each table (exclude system tables)
        system_tables = ['sqlite_master', 'sqlite_sequence']
        for table in tables:
            if table not in system_tables:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS {table}")
                except Exception as e:
                    print(f"Warning: Could not drop table {table}: {e}")
        
        # Re-enable foreign key constraints
        cursor.execute("PRAGMA foreign_keys = ON")
        
        conn.commit()
        conn.close()
        
        # Reinitialize with test table
        init_database()
        
        return {"success": True, "message": "Database reset successfully"}
    except Exception as e:
        print(f"Database reset error: {e}")
        return {"success": False, "message": f"Error: {str(e)}"}

@app.delete("/api/tables/{table_name}")
async def drop_table(table_name: str):
    """Drop a specific table from the database"""
    try:
        # Validate table name to prevent SQL injection
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            raise HTTPException(status_code=400, detail="Invalid table name")
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            return {"success": False, "message": f"Table '{table_name}' does not exist"}
        
        # Drop the table
        cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
        conn.commit()
        conn.close()
        
        return {"success": True, "message": f"Table '{table_name}' dropped successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tables/{table_name}/structure")
async def get_table_structure(table_name: str):
    """Get the structure of a specific table"""
    try:
        # Validate table name
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            raise HTTPException(status_code=400, detail="Invalid table name")
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            conn.close()
            return {"success": False, "message": f"Table '{table_name}' does not exist"}
        
        # Get table structure
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        # Get foreign keys
        cursor.execute(f"PRAGMA foreign_key_list({table_name})")
        foreign_keys = cursor.fetchall()
        
        conn.close()
        
        # Format response
        table_structure = {
            "table_name": table_name,
            "columns": [],
            "foreign_keys": []
        }
        
        for col in columns:
            table_structure["columns"].append({
                "name": col[1],
                "type": col[2],
                "not_null": bool(col[3]),
                "primary_key": bool(col[5]),
                "default_value": col[4]
            })
        
        for fk in foreign_keys:
            table_structure["foreign_keys"].append({
                "column": fk[3],
                "references_table": fk[2],
                "references_column": fk[4]
            })
        
        return {"success": True, "table_structure": table_structure}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/generate-drop-sql")
async def generate_drop_sql():
    """Generate DROP TABLE SQL for all tables"""
    try:
        tables = get_all_tables()
        # Filter out system tables
        user_tables = [t for t in tables if t not in ['sqlite_master', 'sqlite_sequence', 'test_table', 'saved_schemas']]
        
        if not user_tables:
            return {
                "success": True,
                "sql": "-- No user tables to drop",
                "tables": [],
                "message": "No user tables found"
            }
        
        drop_sql = generate_drop_tables_sql(user_tables)
        
        return {
            "success": True,
            "sql": drop_sql,
            "tables": user_tables,
            "message": f"Generated DROP statements for {len(user_tables)} tables"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-layout", response_model=GenerateLayoutResponse)
async def generate_layout(request: GenerateLayoutRequest):
    """Generate optimal layout positions for entities using AI"""
    try:
        positions = generate_layout_with_ai(request.entities, request.relationships)
        
        if positions:
            return GenerateLayoutResponse(
                positions=positions,
                success=True,
                message="Layout generated successfully"
            )
        else:
            return GenerateLayoutResponse(
                positions={},
                success=False,
                message="AI layout generation not available, using fallback"
            )
    except Exception as e:
        print(f"Error generating layout: {e}")
        return GenerateLayoutResponse(
            positions={},
            success=False,
            message=f"Error: {str(e)}"
        )

@app.get("/api/generate-drop-sql/{table_name}")
async def generate_drop_sql_for_table(table_name: str):
    """Generate DROP TABLE SQL for a specific table"""
    try:
        # Validate table name
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
            raise HTTPException(status_code=400, detail="Invalid table name")
        
        # Check if table exists
        tables = get_all_tables()
        if table_name not in tables:
            return {
                "success": False,
                "sql": "",
                "message": f"Table '{table_name}' does not exist"
            }
        
        drop_sql = generate_drop_table_sql(table_name)
        
        return {
            "success": True,
            "sql": drop_sql,
            "table_name": table_name,
            "message": f"Generated DROP statement for table '{table_name}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def parse_sql_to_schema(sql: str) -> Dict[str, Any]:
    """Parse SQL to extract schema information with improved regex patterns"""
    try:
        tables = []
        relationships = []
        
        # Improved regex pattern to handle various SQL formats
        create_table_pattern = r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\((.*?)\);'
        matches = re.findall(create_table_pattern, sql, re.DOTALL | re.IGNORECASE)
        
        for table_name, columns in matches:
            # Clean and split column definitions
            column_definitions = []
            current_line = ""
            
            # Split by commas but be careful with parentheses
            paren_count = 0
            for char in columns:
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                elif char == ',' and paren_count == 0:
                    if current_line.strip():
                        column_definitions.append(current_line.strip())
                    current_line = ""
                    continue
                current_line += char
            
            if current_line.strip():
                column_definitions.append(current_line.strip())
            
            attributes = []
            columns_data = []
            
            for line in column_definitions:
                line = line.strip()
                if not line:
                    continue
                    
                if line.upper().startswith('FOREIGN KEY'):
                    # Extract foreign key relationship
                    fk_match = re.search(r'FOREIGN\s+KEY\s*\((\w+)\)\s*REFERENCES\s+(\w+)\s*\((\w+)\)', line, re.IGNORECASE)
                    if fk_match:
                        relationships.append({
                            "fromTable": table_name,
                            "fromColumn": fk_match.group(1),
                            "toTable": fk_match.group(2),
                            "toColumn": fk_match.group(3)
                        })
                else:
                    # Extract column name and type with better regex
                    # Handle: column_name TYPE [constraints]
                    col_match = re.match(r'(\w+)\s+(\w+)(?:\s+.*)?', line)
                    if col_match:
                        col_name = col_match.group(1)
                        col_type = col_match.group(2)
                        attributes.append(col_name)
                        columns_data.append({
                            "name": col_name,
                            "type": col_type
                        })
            
            tables.append({
                "name": table_name,
                "attributes": attributes,
                "columns": columns_data
            })
        
        return {
            "tables": tables,
            "relationships": relationships
        }
    except Exception as e:
        print(f"Error parsing SQL to schema: {e}")
        return {"tables": [], "relationships": []}

if __name__ == "__main__":
    # Initialize database
    init_database()
    
    # Print startup information
    print("🚀 Starting Python Database Management System")
    print(f"📊 Database: {DB_PATH}")
    print(f"🤖 Gemini AI: {'Available' if GEMINI_AVAILABLE else 'Not configured'}")
    print("🌐 Server will start on http://localhost:5000")
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
