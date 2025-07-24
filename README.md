# Data Lineage Application

A modern web application for tracing data lineage through directed acyclic graphs (DAGs). Built with Next.js, TypeScript, and tRPC.

## 🎯 Project Overview

This application helps users understand how data flows from source data through computed values to final metrics, providing transparency and traceability in data processing pipelines.

**For development workflow and TDD rules, see `.cursorrules` and `tdd.md`.**

## 📁 Project Structure

```
data-lineage-app/
├── project.md              # Project planning and requirements
├── tech-stack.md           # Technology decisions
├── README.md               # This file
└── my-better-t-app/        # The actual application
    ├── apps/
    │   ├── web/            # Frontend (Next.js)
    │   └── server/         # Backend (tRPC API)
    └── packages/           # Shared packages
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd data-lineage-app
```

2. Install dependencies:
```bash
cd my-better-t-app
pnpm install
```

3. Start the development server:
```bash
pnpm dev:web
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## 🛠️ Development

### Available Scripts

From the `my-better-t-app/` directory:

- `pnpm dev` - Start both frontend and backend
- `pnpm dev:web` - Start only the web application
- `pnpm dev:server` - Start only the backend API
- `pnpm build` - Build all applications
- `pnpm check-types` - Check TypeScript types

### Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui
- **Backend**: tRPC, Next.js API routes
- **Database**: SQLite with Drizzle ORM
- **Language**: TypeScript (end-to-end type safety)

## 📋 Features

### Phase 1: Core Lineage Visualization
- [ ] Navigation & Search for nodes
- [ ] Upstream/Downstream lineage tracing
- [ ] Property inspection for each node type
- [ ] Interactive DAG visualization

### Phase 2: Data Integration
- [ ] CSV upload functionality
- [ ] Data preview within lineage context

### Phase 3: Data Export
- [ ] CSV export capabilities
- [ ] Lineage report generation

### Phase 4: Graph Editing
- [ ] Interactive DAG editing
- [ ] Node management (add/edit/remove)
- [ ] DAG integrity validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

[Add your license here] 