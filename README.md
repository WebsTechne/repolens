# RepoLens 🔍

A powerful code visualization tool that analyzes GitHub repository ZIP files and generates interactive dependency graphs. Built with Next.js, TypeScript, and React Flow.

## 🌟 Features

- **📦 ZIP File Analysis** - Upload GitHub repository ZIP files for instant analysis
- **🔗 Dependency Mapping** - Automatically detects and visualizes import/export relationships
- **🌳 File Tree View** - Hierarchical file structure visualization
- **🎯 Smart Path Resolution** - Handles TypeScript path aliases (`@/*`, custom aliases)
- **📊 Import Grouping** - Groups multiple imports from the same source
- **💾 Persistent Storage** - Saves analysis results to IndexedDB
- **🎨 Modern UI** - Clean interface with dark mode support
- **⚡ Worker Threads** - Non-blocking server-side parsing with ts-morph

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- A GitHub repository ZIP file

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd repolens

# Install dependencies
bun install

# Run development server
bun run dev
```

Open [http://localhost:3000/elliot](http://localhost:3000/elliot) to start analyzing repositories.

## 📖 How It Works

### 1. Upload Repository Information

Enter your GitHub repository details:

- **Username** - Repository owner (e.g., `facebook`)
- **Repository Name** - Repo name (e.g., `react`)
- **Branch Name** - Branch to analyze (e.g., `main`)

### 2. Upload ZIP File

Upload a ZIP file of your GitHub repository. The system will:

- Extract all code files (`.js`, `.jsx`, `.ts`, `.tsx`)
- Parse imports and exports using ts-morph
- Resolve path aliases from `tsconfig.json`
- Generate dependency graph

### 3. View Results

The analysis provides:

- **Nodes** - Each file with its imports/exports
- **Edges** - Dependencies between files
- **File Tree** - Complete project structure
- **Import Details** - Grouped imports with function names

## 🏗️ Architecture

### Frontend (`/app`)

- **`/elliot/page.tsx`** - Main upload and visualization interface
- **`/api/upload/route.ts`** - Server-side upload handler
- **`/types/types.ts`** - TypeScript type definitions

### Backend Processing (`/lib`)

- **`parse-code-to-flow.ts`** - Core parsing logic with ts-morph
- **`parse-worker.ts`** - Worker thread for non-blocking parsing
- **`build-file-tree.ts`** - File tree structure builder
- **`ziputil.ts`** - ZIP file extraction utilities

### State Management (`/lib/store`)

- **`flow-store.ts`** - Flow data with IndexedDB persistence
- **`repo-store.ts`** - Repository info with localStorage persistence

### UI Components (`/components`)

- Built with shadcn/ui and Base UI React
- Custom styled with Tailwind CSS v4

## 🔧 Key Technologies

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **ts-morph** - TypeScript AST parsing
- **React Flow** - Interactive node-based graphs
- **Zustand** - State management
- **IndexedDB** - Client-side data persistence
- **Worker Threads** - Server-side parallel processing
- **Bun** - Fast JavaScript runtime and package manager

## 📝 Type Definitions

### Import Structure

```typescript
{
  source: string      // File path or module name
  names: string[]     // Imported function/class names
  kind: "local" | "external"
}
```

### Node Data

```typescript
{
  filename: string
  path: string
  imports: Import[]
  exports: string[]
}
```

### File Tree

```typescript
{
  type: "folder" | "file"
  name: string
  path: string
  isExpanded?: boolean
  children?: TreeItem[]
}
```

## 🎯 Path Alias Resolution

Supports multiple alias patterns:

- **Wildcard**: `@/*` → `./*`
- **Exact**: `components` → `src/components`
- **Custom**: Any tsconfig.json path mapping

## 🛠️ Development

### Project Structure

```
repolens/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   ├── elliot/         # Main page
│   └── types/          # Type definitions
├── components/         # UI components
│   └── ui/            # shadcn/ui components
├── lib/               # Core utilities
│   └── store/         # Zustand stores
└── public/            # Static assets
```

### Scripts

```bash
bun run dev        # Start development server
bun run build      # Build for production
bun run start      # Start production server
bun run typecheck  # Run TypeScript checks
bun run format     # Format code with Prettier
```

## 🎨 UI Components

Uses shadcn/ui with Base UI React primitives:

```bash
# Add new components
npx shadcn@latest add <component-name>
```

## 📊 Error Handling

- **Universal Error Pages** - `app/error.tsx` and `app/global-error.tsx`
- **Comprehensive Logging** - All operations logged with context
- **Type-Safe Errors** - Proper error typing throughout

## 🔒 Data Persistence

- **IndexedDB** - Flow data (nodes, edges)
- **localStorage** - Repository information
- **Automatic Hydration** - Data restored on page load

## 🤝 Contributing

Contributions are welcome! Please ensure:

- Code follows Prettier configuration (no semicolons, double quotes)
- TypeScript strict mode compliance
- Proper error handling and logging

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

Built with modern web technologies and best practices for code analysis and visualization.

---

Made with ❤️ using Next.js and TypeScript
