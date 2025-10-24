# Frontend-Backend Integration Test Guide

## Prerequisites
1. Backend server running on port 5000
2. Frontend server running on port 3000
3. Gemini API key configured in backend

## Test Steps

### 1. Start the Servers
```bash
# Terminal 1 - Start Backend
cd backend
python run.py

# Terminal 2 - Start Frontend  
cd frontend
npm i
npm run dev
```

### 2. Test Generate from Prompt
1. Open http://localhost:5173
2. Click "About" button (Generate with AI)
3. Enter prompt: "Create a library system with books, members, and loans"
4. Click "Generate Schema"
5. Verify: Entities appear on canvas, SQL shows in preview

### 3. Test Save Schema
1. With entities on canvas, click "Save" button
2. Enter schema name when prompted
3. Verify: Success toast appears

### 4. Test Load Saved Schemas
1. Click "About" button again
2. Click "Load Schema" or similar option
3. Verify: Saved schemas list appears
4. Click "Load" on a saved schema
5. Verify: Canvas populates with saved entities

### 5. Test SQL Executor
1. Click Settings button (gear icon)
2. Go to "Tools" tab
3. Click "Open SQL Executor"
4. Enter SQL query: "SELECT * FROM sqlite_master WHERE type='table'"
5. Click "Execute SQL"
6. Verify: Results display in table format

### 6. Test Sample Data Management
1. Create an entity with some attributes
2. Select the entity to open right sidebar
3. Go to "Sample Data" tab
4. Click "Add Row" and enter sample data
5. Generate SQL to verify INSERT statements are included

### 7. Test Delete Schema
1. In saved schemas modal, click trash icon
2. Confirm deletion
3. Verify: Schema removed from list

### 8. Test Manual Entity Creation
1. Click "Work" button
2. Add entity manually
3. Verify: Entity appears on canvas
4. Test save functionality

### 9. Test Settings & Database Reset
1. Click Settings button (gear icon)
2. Go to "Database" tab
3. Test "Reset Database" functionality (use with caution)
4. Verify: All tables and schemas are cleared

## Expected Results
- ✅ No console errors
- ✅ API calls work (check Network tab)
- ✅ Data transforms correctly between frontend/backend
- ✅ All UI interactions work smoothly
- ✅ Error handling works (try invalid prompts)

## Troubleshooting
- **CORS errors**: Check vite.config.ts proxy configuration
- **API not found**: Verify backend is running on port 5000
- **Empty responses**: Check Gemini API key configuration
- **Transform errors**: Check console for data structure mismatches
