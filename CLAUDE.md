# CLAUDE.md - AI Assistant Guide for better-chatbot

This document provides comprehensive guidance for AI assistants working on the better-chatbot codebase. It covers architecture, conventions, and best practices.

## Table of Contents

- [Project Overview](#project-overview)
- [Codebase Structure](#codebase-structure)
- [Architecture Patterns](#architecture-patterns)
- [Development Workflows](#development-workflows)
- [Code Conventions](#code-conventions)
- [Key Concepts](#key-concepts)
- [Common Operations](#common-operations)
- [Testing Guidelines](#testing-guidelines)
- [Important Files](#important-files)

---

## Project Overview

**better-chatbot** is an advanced AI chatbot application built with Next.js that focuses on exceptional UX with deep Model Context Protocol (MCP) integration and visual workflow automation.

### Tech Stack

- **Framework**: Next.js 15.3.2 (App Router)
- **Runtime**: React 19, TypeScript 5.8
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **AI SDK**: Vercel AI SDK
- **MCP**: Model Context Protocol SDK
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI
- **Package Manager**: pnpm 10.2.1
- **Code Quality**: Biome, ESLint, Vitest

### Key Features

1. **MCP Integration**: Connect external tools via Model Context Protocol
2. **Visual Workflows**: Create custom workflows as callable tools
3. **Multi-Provider AI**: OpenAI, Anthropic, Google, XAI, OpenRouter, Ollama
4. **Voice Chat**: OpenAI Realtime API integration
5. **Project-based Chats**: Organize conversations with shared context
6. **Tool Customization**: Add custom instructions to any tool

---

## Codebase Structure

```
/home/user/mcp-client-chatbot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (chat)/            # Main chat interface
│   │   │   ├── chat/[thread]/ # Individual chat threads
│   │   │   ├── workflow/      # Workflow management
│   │   │   ├── project/       # Project-based chats
│   │   │   └── mcp/           # MCP server config UI
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # Chat endpoints
│   │   │   ├── workflow/      # Workflow CRUD
│   │   │   ├── mcp/           # MCP management
│   │   │   └── thread/        # Thread management
│   │   └── store/             # Client-side state (Zustand)
│   ├── components/            # React components
│   │   └── ui/                # Reusable UI components (Radix)
│   ├── hooks/                 # Custom React hooks
│   ├── i18n/                  # Internationalization
│   ├── lib/                   # Core business logic
│   │   ├── ai/                # AI-related functionality
│   │   │   ├── mcp/           # MCP manager and clients
│   │   │   ├── workflow/      # Workflow executor
│   │   │   ├── models/        # AI model configurations
│   │   │   └── tools/         # Default tools (web search, JS executor)
│   │   ├── auth/              # Better Auth configuration
│   │   ├── db/                # Database layer
│   │   │   ├── pg/            # PostgreSQL implementations
│   │   │   │   ├── repositories/  # Data access layer
│   │   │   │   └── schema.pg.ts   # Database schema
│   │   │   └── migrations/pg/     # Migration files
│   │   ├── cache/             # Caching (memory, Redis)
│   │   └── code-runner/       # Safe code execution
│   └── types/                 # TypeScript type definitions
├── mcp-server/                # Custom MCP server (Gmail tools)
├── scripts/                   # Build and setup scripts
├── docker/                    # Docker configuration
├── docs/                      # Documentation
└── messages/                  # i18n message files
```

### Path Aliases

Always use TypeScript path aliases for imports:

```typescript
import { Button } from "ui/button"              // UI components
import { auth } from "auth/auth"                // Auth utilities
import type { User } from "app-types/user"      // Type definitions
import { logger } from "logger"                 // Logger instance
import { utils } from "lib/utils"               // Lib utilities
import { Component } from "@/components/..."    // Generic src alias
```

---

## Architecture Patterns

### 1. Next.js App Router Structure

**Server Components (Default)**:
- All components in `src/components/` are Server Components by default
- Use for data fetching, database queries, and static content
- Cannot use React hooks or browser APIs

**Client Components**:
- Mark with `"use client"` directive at the top
- Use for interactivity, state, effects, browser APIs
- Examples: chat input, modals, interactive UI

**Server Actions**:
- Located in files named `*.action.ts`
- Must have `"use server"` directive
- Handle form submissions and mutations
- Example: `src/app/(chat)/chat/[thread]/chat.action.ts`

### 2. API Routes Pattern

```typescript
// src/app/api/chat/route.ts
import { NextRequest } from "next/server"
import { auth } from "auth/auth"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) return new Response("Unauthorized", { status: 401 })

  // Handle request
}
```

**Key API Endpoints**:
- `POST /api/chat` - Main chat streaming endpoint
- `POST /api/chat/temporary` - Temporary chat sessions
- `POST /api/chat/openai-realtime` - Voice chat
- `GET /api/workflow` - List workflows
- `POST /api/mcp/connect` - Connect MCP server

### 3. Database Layer (Repository Pattern)

**Schema Definition** (`src/lib/db/pg/schema.pg.ts`):
```typescript
import { pgTable, uuid, text, timestamp, boolean, json } from "drizzle-orm/pg-core"

export const UserSchema = pgTable("User", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  // ... other fields
})
```

**Repository Interface** (`src/lib/db/repository.ts`):
```typescript
export interface IChatRepository {
  findThreadById(threadId: string): Promise<ChatThread | null>
  createThread(data: CreateThreadData): Promise<ChatThread>
  // ... other methods
}
```

**Repository Implementation** (`src/lib/db/pg/repositories/chat-repository.pg.ts`):
```typescript
export class ChatRepositoryPg implements IChatRepository {
  constructor(private db: DrizzleDB) {}

  async findThreadById(threadId: string) {
    return await this.db.query.ChatThreadSchema.findFirst({
      where: eq(ChatThreadSchema.id, threadId)
    })
  }
}
```

**Usage**:
```typescript
import { chatRepository } from "lib/db/repository"

const thread = await chatRepository.findThreadById(threadId)
```

### 4. State Management

**Server State**: SWR for data fetching
```typescript
import useSWR from "swr"

const { data, error, mutate } = useSWR("/api/workflow", fetcher)
```

**Client State**: Zustand for UI state
```typescript
// src/app/store/chat-store.ts
import { create } from "zustand"

interface ChatStore {
  toolChoice: "auto" | "manual" | "none"
  setToolChoice: (mode: "auto" | "manual" | "none") => void
}

export const useChatStore = create<ChatStore>((set) => ({
  toolChoice: "auto",
  setToolChoice: (mode) => set({ toolChoice: mode })
}))
```

### 5. MCP Architecture

**MCP Manager** (Singleton):
- `src/lib/ai/mcp/mcp-manager.ts`
- Manages all MCP client connections
- Initializes on server startup (`instrumentation.ts`)
- Supports database-based or file-based configs

**MCP Client Lifecycle**:
1. Server connects via stdio or SSE transport
2. Tool discovery via `listTools()`
3. Tools converted to Vercel AI SDK format
4. Auto-disconnect after 30 minutes of inactivity

**Tool Naming Convention**:
- Format: `mcp-server-name__tool-name`
- Example: `playwright__navigate`, `gmail__send-email`

### 6. Workflow System

**Node Types** (`src/lib/ai/workflow/types.ts`):
- **Input**: Entry point with initial data
- **Output**: Exit point with final result
- **LLM**: AI model interaction
- **Tool**: MCP tool execution
- **Condition**: If-elseif-else branching
- **Http**: HTTP requests
- **Template**: Text template processing
- **Note**: Documentation (non-functional)

**Execution Flow**:
1. Parse workflow nodes and edges into graph
2. Execute from Input node
3. Follow edges based on dependencies
4. Handle condition branching
5. Synchronize converging branches
6. Return Output node result

**Published Workflows**:
- Become callable tools in chat
- Mention with `@workflow-name`
- Execute complete workflow on invocation

---

## Development Workflows

### Setup

```bash
# 1. Install dependencies
pnpm i

# 2. Setup environment (auto-runs in postinstall)
pnpm initial:env

# 3. Start PostgreSQL (if not already running)
pnpm docker:pg

# 4. Run migrations
pnpm db:migrate

# 5. Start dev server
pnpm dev
```

### Development Commands

```bash
# Development
pnpm dev                  # Start dev server with Turbopack
pnpm build               # Production build
pnpm build:local         # Local build (NO_HTTPS=1)
pnpm start               # Start production server

# Code Quality
pnpm lint                # Run ESLint + Biome
pnpm lint:fix            # Auto-fix linting issues
pnpm format              # Format with Biome
pnpm check-types         # TypeScript type checking
pnpm check               # Run all checks (lint + types + tests)

# Testing
pnpm test                # Run tests once
pnpm test:watch          # Watch mode

# Database
pnpm db:generate         # Generate migration from schema changes
pnpm db:push             # Push schema to database (dev only)
pnpm db:migrate          # Run migrations (production)
pnpm db:studio           # Open Drizzle Studio
pnpm db:reset            # Drop and recreate database

# Docker
pnpm docker:pg           # Start PostgreSQL container
pnpm docker-compose:up   # Start all services
pnpm docker-compose:down # Stop all services
```

### Git Workflow

1. **Create a branch**:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make changes and test**:
```bash
pnpm check  # Runs lint:fix + check-types + test
```

3. **Commit** (messages can be free-form):
```bash
git add .
git commit -m "your internal message"
```

4. **Push and create PR**:
```bash
git push origin your-branch-name
```

5. **PR Title** (MUST follow Conventional Commits):
- `feat: add workflow export feature`
- `fix: resolve MCP connection timeout`
- `chore: update dependencies`
- `docs: improve setup instructions`

### Database Migrations

**Creating a migration**:
```bash
# 1. Update schema in src/lib/db/pg/schema.pg.ts
# 2. Generate migration
pnpm db:generate

# 3. Review generated SQL in src/lib/db/migrations/pg/
# 4. Apply migration
pnpm db:migrate
```

**Migration runs automatically** on server startup via `instrumentation.ts`.

---

## Code Conventions

### TypeScript

**Type Safety**:
- Enable strict mode
- Use explicit return types for public functions
- Avoid `any` - use `unknown` or proper types
- Use `ts-safe` for error handling

```typescript
import { safe } from "ts-safe"

// Good
const [error, result] = await safe(riskyOperation())
if (error) {
  logger.error("Operation failed", error)
  return
}

// Bad
try {
  const result = await riskyOperation()
} catch (e: any) {
  console.log(e)
}
```

**Naming Conventions**:
- **Files**: kebab-case (`chat-repository.ts`)
- **Components**: PascalCase (`ChatMessage.tsx`)
- **Functions**: camelCase (`createThread()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase with descriptive names
  - Prefix interfaces with `I` if needed (`IChatRepository`)
  - Suffix types with purpose (`CreateThreadData`)

### React Components

**Server Components** (default):
```typescript
// src/components/chat/ChatThread.tsx
import { chatRepository } from "lib/db/repository"

export async function ChatThread({ threadId }: { threadId: string }) {
  const thread = await chatRepository.findThreadById(threadId)

  return (
    <div>
      <h1>{thread?.title}</h1>
    </div>
  )
}
```

**Client Components**:
```typescript
"use client"

import { useState } from "react"

export function ChatInput() {
  const [message, setMessage] = useState("")

  return (
    <input
      value={message}
      onChange={(e) => setMessage(e.target.value)}
    />
  )
}
```

**Component Structure**:
1. Imports (grouped: React, third-party, local)
2. Type definitions
3. Component definition
4. Export

### Code Formatting

**Biome Configuration** (`biome.json`):
- **Indent**: 2 spaces
- **Line Width**: 80 characters
- **Quote Style**: Double quotes
- **Line Ending**: LF
- **Organize Imports**: Enabled

**Pre-commit Hook**:
- Automatically formats and lints staged files
- Configured via Husky and lint-staged

### Error Handling

**Use `ts-safe` for async operations**:
```typescript
import { safe } from "ts-safe"

const [error, data] = await safe(fetchData())
if (error) {
  // Handle error
  return
}
// Use data safely
```

**Logging**:
```typescript
import { logger } from "logger"

logger.info("Operation started", { userId, action })
logger.error("Operation failed", error)
logger.warn("Deprecated API used")
```

### File Organization

**Group by feature, not by type**:
```
Good:
src/lib/ai/
  ├── mcp/
  │   ├── mcp-manager.ts
  │   ├── create-mcp-client.ts
  │   └── types.ts
  └── workflow/
      ├── executor/
      ├── types.ts
      └── utils.ts

Bad:
src/
  ├── managers/
  │   └── mcp-manager.ts
  ├── clients/
  │   └── mcp-client.ts
  └── types/
      ├── mcp-types.ts
      └── workflow-types.ts
```

---

## Key Concepts

### 1. MCP (Model Context Protocol)

**What it is**: A protocol for connecting external tools to AI models.

**Key Components**:
- **MCP Server**: Exposes tools via stdio or SSE
- **MCP Client**: Connects to server and executes tools
- **Transport**: Communication layer (stdio, SSE)

**Configuration**:
```typescript
// Database-based (default)
{
  id: "uuid",
  name: "playwright",
  config: {
    type: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-playwright"],
    env: {}
  },
  enabled: true
}

// Remote (SSE)
{
  type: "remote",
  url: "https://mcp-server.example.com",
  headers: { "Authorization": "Bearer token" }
}
```

**Tool Execution Flow**:
1. User mentions `@mcp-server` or `@tool-name`
2. Chat API retrieves available tools
3. Filters tools by mentions or allowed servers
4. Streams tool calls to LLM
5. Executes tools via MCP client
6. Returns results to LLM

### 2. Workflows

**Purpose**: Chain multiple operations into reusable, callable tools.

**Use Cases**:
- Multi-step automation (e.g., "Search web → Summarize → Send email")
- Complex data processing pipelines
- Custom AI agents with specific behaviors

**Key Features**:
- Visual node-based editor (React Flow)
- Supports LLM calls, tool execution, HTTP requests, conditions
- Published workflows become `@workflow-name` tools
- Execution state managed by `ts-edge` library

### 3. Projects

**Purpose**: Organize chats with shared context and instructions.

**Features**:
- Custom system prompts per project
- Grouped chat threads
- Shared MCP tool configurations

**Schema**:
```typescript
{
  id: string
  name: string
  userId: string
  instructions: {
    systemPrompt?: string
  }
}
```

### 4. Tool Customization

**Per-Tool Instructions**:
- Add custom prompts to any tool
- Guides LLM on how to use the tool
- User-specific

**Per-Server Instructions**:
- Applied to all tools from an MCP server
- Server-wide customization

**Example**:
```typescript
{
  userId: "user-123",
  mcpServerId: "playwright-id",
  toolName: "navigate",
  prompt: "Always wait 2 seconds after navigation for page load"
}
```

### 5. Streaming

**Chat Streaming**:
- Uses Vercel AI SDK's `streamText()`
- Streams tokens as they're generated
- Includes tool calls and results in stream

**Implementation**:
```typescript
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"

const result = streamText({
  model: openai("gpt-4"),
  messages,
  tools,
  onFinish: async ({ text, toolCalls }) => {
    // Save to database
  }
})

return result.toDataStreamResponse()
```

### 6. Authentication

**Better Auth**:
- Modern auth library with built-in session management
- Drizzle adapter for PostgreSQL storage
- Cookie-based sessions (7-day expiration)

**Protected Routes**:
```typescript
// src/middleware.ts
import { auth } from "auth/auth"

export default auth.middleware({
  publicRoutes: ["/sign-in", "/sign-up"],
})
```

**Getting Session**:
```typescript
import { auth } from "auth/auth"

// In API routes
const session = await auth.api.getSession({ headers: req.headers })

// In Server Components
const session = await auth.api.getSession({ headers: await headers() })
```

---

## Common Operations

### 1. Adding a New API Route

```typescript
// src/app/api/example/route.ts
import { NextRequest } from "next/server"
import { auth } from "auth/auth"

export async function POST(req: NextRequest) {
  // 1. Check authentication
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // 2. Parse request body
  const body = await req.json()

  // 3. Validate input
  // Use Zod for validation if needed

  // 4. Perform operation
  const result = await performOperation(body)

  // 5. Return response
  return Response.json(result)
}
```

### 2. Adding a New Database Table

```typescript
// 1. Define schema in src/lib/db/pg/schema.pg.ts
export const NewTableSchema = pgTable("NewTable", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  userId: uuid("userId").notNull().references(() => UserSchema.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})

// 2. Generate migration
// pnpm db:generate

// 3. Review migration in src/lib/db/migrations/pg/

// 4. Run migration
// pnpm db:migrate

// 5. Create repository interface in src/lib/db/repository.ts
export interface INewTableRepository {
  create(data: CreateData): Promise<NewTable>
  findById(id: string): Promise<NewTable | null>
}

// 6. Implement repository in src/lib/db/pg/repositories/
export class NewTableRepositoryPg implements INewTableRepository {
  constructor(private db: DrizzleDB) {}

  async create(data: CreateData) {
    const [result] = await this.db
      .insert(NewTableSchema)
      .values(data)
      .returning()
    return result
  }
}

// 7. Export from src/lib/db/repository.ts
export const newTableRepository = new NewTableRepositoryPg(db)
```

### 3. Adding a New MCP Server

**Via UI**:
1. Navigate to MCP Settings in the app
2. Click "Add Server"
3. Configure server (name, command, args, env)
4. Save and enable

**Programmatically**:
```typescript
import { mcpRepository } from "lib/db/repository"

await mcpRepository.create({
  name: "my-server",
  config: {
    type: "stdio",
    command: "node",
    args: ["./my-server.js"],
    env: {}
  },
  enabled: true
})

// Restart server or reload MCP manager
```

### 4. Creating a Custom Tool

**Default Tools** (built-in):
```typescript
// src/lib/ai/tools/my-tool.ts
import { tool } from "ai"
import { z } from "zod"

export const myTool = tool({
  description: "Description of what the tool does",
  parameters: z.object({
    input: z.string().describe("Input description")
  }),
  execute: async ({ input }) => {
    // Implementation
    return { result: "output" }
  }
})
```

**MCP Server** (for external tools):
1. Create MCP server following MCP SDK docs
2. Add server to app via UI or database
3. Tools automatically available in chat

### 5. Adding a New Workflow Node Type

```typescript
// 1. Add to NodeKind enum in src/lib/ai/workflow/types.ts
export enum NodeKind {
  // ... existing
  MyNewNode = "my-new-node",
}

// 2. Define node config type
export interface MyNewNodeConfig {
  setting1: string
  setting2: number
}

// 3. Add to NodeConfig union type
export type NodeConfig =
  | InputNodeConfig
  | OutputNodeConfig
  // ... existing
  | MyNewNodeConfig

// 4. Implement executor in src/lib/ai/workflow/executor/node-executor.ts
async function executeMyNewNode(
  state: WorkflowState,
  node: WorkflowNode<MyNewNodeConfig>
): Promise<any> {
  // Implementation
  return result
}

// 5. Add to executor switch statement
switch (node.kind) {
  // ... existing cases
  case NodeKind.MyNewNode:
    return await executeMyNewNode(state, node)
}

// 6. Create UI component in src/components/workflow/nodes/
```

### 6. Adding Internationalization

```typescript
// 1. Add translations to messages/[locale].json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}

// 2. Use in Server Components
import { getTranslations } from "next-intl/server"

export async function MyComponent() {
  const t = await getTranslations("myFeature")

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  )
}

// 3. Use in Client Components
"use client"

import { useTranslations } from "next-intl"

export function MyClientComponent() {
  const t = useTranslations("myFeature")

  return <h1>{t("title")}</h1>
}
```

---

## Testing Guidelines

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: ["./vitest.setup.ts"]
  }
})
```

### Writing Tests

**Unit Tests**:
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from "vitest"
import { myFunction } from "./utils"

describe("myFunction", () => {
  it("should return expected result", () => {
    const result = myFunction("input")
    expect(result).toBe("expected")
  })

  it("should handle edge cases", () => {
    expect(myFunction("")).toBe("")
    expect(myFunction(null)).toBe(null)
  })
})
```

**Async Tests**:
```typescript
import { describe, it, expect } from "vitest"

describe("async operation", () => {
  it("should fetch data", async () => {
    const data = await fetchData()
    expect(data).toBeDefined()
    expect(data.id).toBe("123")
  })
})
```

**Mocking**:
```typescript
import { describe, it, expect, vi } from "vitest"

// Mock module
vi.mock("lib/db/repository", () => ({
  chatRepository: {
    findThreadById: vi.fn()
  }
}))

// Mock implementation
import { chatRepository } from "lib/db/repository"

describe("with mocks", () => {
  it("should use mocked data", async () => {
    chatRepository.findThreadById.mockResolvedValue({
      id: "123",
      title: "Test"
    })

    const thread = await chatRepository.findThreadById("123")
    expect(thread.title).toBe("Test")
  })
})
```

### Running Tests

```bash
pnpm test              # Run all tests once
pnpm test:watch        # Watch mode
pnpm test -- myfile    # Run specific file
```

---

## Important Files

### Configuration

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, package manager config |
| `tsconfig.json` | TypeScript configuration and path aliases |
| `biome.json` | Code formatting and linting rules |
| `next.config.ts` | Next.js configuration |
| `drizzle.config.ts` | Database ORM configuration |
| `vitest.config.ts` | Test runner configuration |
| `.env` | Environment variables (not committed) |
| `.env.example` | Environment variable template |

### Core Application

| File | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout with providers |
| `src/app/(chat)/page.tsx` | Main chat interface |
| `src/app/api/chat/route.ts` | Chat streaming endpoint |
| `src/middleware.ts` | Auth and routing middleware |
| `instrumentation.ts` | Server startup initialization |

### Database

| File | Purpose |
|------|---------|
| `src/lib/db/pg/schema.pg.ts` | Database schema definitions |
| `src/lib/db/pg/db.ts` | Database connection pool |
| `src/lib/db/repository.ts` | Repository exports |
| `src/lib/db/pg/repositories/*.ts` | Data access implementations |
| `src/lib/db/migrations/pg/*.sql` | Migration files |

### AI & MCP

| File | Purpose |
|------|---------|
| `src/lib/ai/mcp/mcp-manager.ts` | Global MCP manager singleton |
| `src/lib/ai/mcp/create-mcp-client.ts` | Individual MCP client factory |
| `src/lib/ai/mcp/create-mcp-clients-manager.ts` | MCP client lifecycle manager |
| `src/lib/ai/workflow/executor/workflow-executor.ts` | Workflow execution engine |
| `src/lib/ai/models/registry.ts` | AI model registry |
| `src/lib/ai/tools/*.ts` | Default tool implementations |

### Authentication

| File | Purpose |
|------|---------|
| `src/lib/auth/auth.ts` | Better Auth configuration |
| `src/lib/auth/client.ts` | Client-side auth helpers |

---

## Best Practices for AI Assistants

### When Making Changes

1. **Always read files first** before modifying them
2. **Use TypeScript path aliases** for imports
3. **Follow the repository pattern** for database access
4. **Test changes** with `pnpm check` before committing
5. **Update migrations** if changing database schema
6. **Add tests** for new functionality
7. **Use `ts-safe`** for error handling
8. **Log appropriately** with the logger utility

### Code Review Checklist

- [ ] TypeScript types are explicit and correct
- [ ] Error handling uses `ts-safe`
- [ ] Database queries use repository pattern
- [ ] Authentication is checked in API routes
- [ ] Server/Client components are properly marked
- [ ] Path aliases are used consistently
- [ ] Code is formatted with Biome
- [ ] Tests are added for new features
- [ ] No console.log statements (use logger)
- [ ] Environment variables are documented in .env.example

### Common Pitfalls to Avoid

1. **Don't use `console.log`** - use `logger` from `logger`
2. **Don't use relative imports** for common paths - use aliases
3. **Don't access database directly** - use repositories
4. **Don't skip authentication** in protected routes
5. **Don't forget `"use client"`** for interactive components
6. **Don't use `any`** type - use proper types or `unknown`
7. **Don't commit `.env`** - only update `.env.example`
8. **Don't push directly to main** - create a PR
9. **Don't skip migrations** after schema changes
10. **Don't use blocking operations** in API routes

### Contributing

Before submitting a PR:

1. Create an issue for major changes to discuss approach
2. Use conventional commit format for PR title
3. Include screenshots for UI changes
4. Run `pnpm check` to verify code quality
5. Update documentation if adding new features
6. Test locally with both dev and production builds

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/introduction)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Better Auth](https://www.better-auth.com/docs)
- [Project README](./README.md)
- [Contributing Guide](./CONTRIBUTING.md)

---

## Questions?

For questions or issues:
- Check the [documentation](./docs/)
- Join the [Discord](https://discord.gg/gCRu69Upnp)
- Create an [issue](https://github.com/better-chatbot/better-chatbot/issues)

---

**Last Updated**: 2025-11-28
**Repository**: https://github.com/better-chatbot/better-chatbot
