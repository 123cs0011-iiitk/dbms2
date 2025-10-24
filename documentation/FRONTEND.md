# Frontend - ERD Builder

Modern React-based frontend for interactive database schema design and visualization.

## 🎨 Overview

A fully-featured visual database designer built with React 19, TypeScript, and modern UI libraries. Features drag-and-drop entity design, AI-powered schema generation, and real-time SQL preview.

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | React 19, TypeScript, Vite 6 |
| **UI Components** | Radix UI (40+ components), TailwindCSS |
| **Animations** | Framer Motion 12 |
| **Diagrams** | html-to-image |
| **HTTP Client** | Axios |
| **State Management** | React Hooks (useState, useEffect) |
| **Icons** | Lucide React |
| **Notifications** | Sonner Toasts |

## 📦 Installation

```bash
# From frontend directory
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5173

## 🗂️ Component Architecture

### Core Components

#### Canvas.tsx
Main drawing surface for entity-relationship diagrams.
- **Features**: Drag-and-drop, zoom controls, pan support, element selection
- **Renders**: EntityNode, RelationshipNode, AttributeNode components
- **State**: Entities, relationships, selected elements, zoom level
- **Animations**: Smooth transitions with Framer Motion

#### Toolbar.tsx
Top navigation bar with main actions.
- **Buttons**: Work (saved schemas), About (AI generation), Playground (samples), Resource (export), Save, ERD, Settings
- **Features**: Dark/light mode toggle, right sidebar toggle
- **Icons**: Lucide React icons with hover animations
- **Style**: Gradient background with rounded glassmorphic design

#### FloatingToolbar.tsx
Left sidebar with quick actions.
- **Functions**: Add entity, add relationship, auto-layout, delete selected, toggle attributes
- **Position**: Fixed on left side, vertically centered
- **Interactions**: Tooltips on hover, animated button states
- **Design**: Floating card with gradient background and shadows

#### RightSidebar.tsx
Properties editor for selected elements.
- **Tabs**: Structure, Sample Data, Relationships
- **Structure Tab**: Edit entity name, color, add/edit/delete attributes, set primary/foreign keys
- **Sample Data Tab**: Add test rows, manage data, auto-generates INSERT statements
- **Relationships Tab**: View and manage foreign key relationships
- **Features**: Composite primary keys, attribute type selection, nullable/unique constraints

### Modal Components

#### PromptModal.tsx
AI-powered database generation dialog.
- **Input**: Natural language description of database
- **Options**: AI provider selection (Gemini, Perplexity, Fallback)
- **Output**: Generates entities, relationships, and SQL code
- **Features**: Example prompts, loading states, error handling

#### SavedSchemasModal.tsx
Browse and load saved schemas.
- **Display**: List of saved schemas with prompt, date, and actions
- **Actions**: Load schema, delete schema, view SQL preview
- **Features**: Search/filter, pagination, empty state
- **Integration**: Loads schema directly to canvas

#### ExportModal.tsx
Export SQL and diagrams.
- **Tabs**: SQL Code, JSON Export, PNG Export
- **SQL Tab**: Syntax-highlighted SQL with copy button
- **PNG Tab**: Download diagram as image file
- **Features**: Code syntax highlighting, clipboard integration

#### TestModal.tsx (Playground)
Pre-built sample databases.
- **Samples**: School System, E-Commerce, Hospital Management
- **Display**: Preview cards with entity counts
- **Action**: One-click load to canvas
- **Purpose**: Quick testing and learning

#### SettingsModal.tsx
Application configuration.
- **Tabs**: General, Theme, Tools, Database, About
- **General**: App preferences and defaults
- **Theme**: Dark/light mode, color schemes
- **Tools**: SQL Executor, database tools
- **Database**: Reset database, manage tables
- **About**: Version info, links, credits

#### SQLExecutor.tsx
Interactive SQL query interface.
- **Input**: SQL query editor with syntax support
- **Execution**: Run queries against live database
- **Output**: Results displayed in formatted table
- **Features**: Query history, error messages, result export
- **Access**: Settings → Tools → Open SQL Executor

### Node Components

#### EntityNode.tsx
Visual representation of database tables.
- **Display**: Rectangle with entity name and color
- **Interactions**: Drag to move, click to select, delete button
- **Attributes**: Shows primary keys, foreign keys, data types
- **Customization**: Color picker, size adjustment
- **Animation**: Smooth drag transitions

#### RelationshipNode.tsx
Diamond-shaped relationship connectors.
- **Display**: Diamond between two entities
- **Connections**: Lines to connected entities with cardinality labels
- **Types**: One-to-one, one-to-many, many-to-many
- **Features**: Animated gradient connections, hover effects

#### AttributeNode.tsx
Oval nodes for entity attributes.
- **Display**: Ovals positioned around entities
- **Properties**: Name, data type, constraints
- **Visual**: Key indicators (🔑 for primary key, 🔗 for foreign key)
- **Toggle**: Show/hide all attributes globally

### Status Components

#### StatusBar.tsx
Bottom bar with real-time statistics.
- **Displays**: Entity count, relationship count, zoom level, unsaved changes indicator
- **Updates**: Real-time as canvas changes
- **Style**: Compact, non-intrusive design
- **Icons**: Visual indicators for each metric

## 🎯 Key Features

### 1. Drag-and-Drop Canvas
- Move entities and relationships freely
- Snap to grid (optional)
- Pan canvas by dragging empty space
- Zoom in/out with controls

### 2. Entity Management
- Add entities manually or via AI
- Edit properties in real-time
- Composite primary keys (multi-column)
- Custom colors per entity
- Delete with confirmation

### 3. Sample Data
- Add test rows to any entity
- Automatically generates INSERT statements
- Edit/delete sample data
- Export with schema

### 4. Visual Customization
- Dark/light theme support
- Custom entity colors
- Attribute positioning (customX/customY)
- Animated connections and transitions

### 5. AI Integration
- Natural language to schema conversion
- Intelligent entity recognition
- Automatic relationship detection
- Multiple AI provider support

### 6. Export & Sharing
- Export SQL code
- Download PNG diagrams
- Export JSON schema
- Save/load schemas from database

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint for code quality |

## 🔧 Configuration Files

### vite.config.ts
- **Proxy**: Forwards `/api/*` requests to backend (port 5000)
- **Port**: Frontend runs on 5173
- **Plugins**: React SWC for fast refresh

### tsconfig.json
- **Target**: ES2020
- **JSX**: React JSX transform
- **Strict**: Type checking enabled
- **Paths**: Absolute imports from `src/`

### tailwind.config.js
- **Theme**: Custom colors and design tokens
- **Plugins**: Radix UI integration
- **Dark Mode**: Class-based dark mode support

## 🎨 UI Component Library (Radix UI)

Located in `src/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `button.tsx` | Styled buttons with variants |
| `dialog.tsx` | Modal dialogs |
| `input.tsx` | Form inputs |
| `select.tsx` | Dropdown selects |
| `tabs.tsx` | Tabbed interfaces |
| `switch.tsx` | Toggle switches |
| `tooltip.tsx` | Hover tooltips |
| `scroll-area.tsx` | Custom scrollbars |
| `table.tsx` | Data tables |
| `alert.tsx` | Notification alerts |

All components are fully typed and themed with TailwindCSS.

## 🚀 Development Workflow

### Adding a New Feature

1. **Create component** in `src/components/`
2. **Import in App.tsx** if it's a modal/major component
3. **Add state** to App.tsx if needed
4. **Connect to API** via `src/services/api.ts`
5. **Test** in browser with hot reload

### Connecting to Backend API

All API calls go through `src/services/api.ts`:

```typescript
import { generateDatabase, saveSchema, executeSQL } from './services/api';

// Generate database
const result = await generateDatabase(prompt, 'gemini');

// Save schema
await saveSchema(prompt, sqlCode, schemaData);

// Execute SQL
const results = await executeSQL(sqlQuery);
```

### State Management

Main state is in `App.tsx`:
- `entities`: Array of Entity objects
- `relationships`: Array of Relationship objects
- `selectedElement`: Currently selected entity/relationship/attribute
- `zoom`: Canvas zoom level
- `hasUnsavedChanges`: Boolean flag for unsaved work

State is passed down via props (no Redux or external state management).

## 🐛 Debugging

### Browser Console
Press F12 and check:
- **Console**: JavaScript errors and logs
- **Network**: API requests and responses
- **React DevTools**: Component state and props

### Common Issues

**Components not updating**
- Check if state is being updated properly
- Ensure props are passed correctly
- Verify React keys on lists

**API calls failing**
- Check Network tab for 404/500 errors
- Ensure backend is running on port 5000
- Verify CORS settings in backend

**Styling issues**
- Check Tailwind class names
- Verify dark mode classes
- Inspect element in browser DevTools

## 📱 Responsive Design

The app is optimized for desktop use (minimum 1024px width). Mobile support is limited but functional.

## 🔐 Type Safety

Full TypeScript coverage:
- All components are typed
- API responses have defined interfaces
- Props have strict type checking
- No implicit `any` types

## 📝 License

MIT License - see parent directory for details.
  