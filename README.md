# GPTClone — Client

React front-end for a ChatGPT-style clone. Consumes the GPTClone Server REST API and renders a fully-featured chat interface with real-time streaming, model selection, and a collapsible sidebar.

## Stack

| Layer | Technology |
|---|---|
| Build tool | Vite 8 |
| Language | TypeScript 5 (strict) |
| UI framework | React 19 |
| Routing | React Router v7 |
| State management | Redux Toolkit (slices + async thunks) |
| Component library | Shadcn UI (Base UI / Tailwind v4) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| HTTP client | Axios |
| Streaming | Native `fetch` + ReadableStream (SSE) |

## Features

- **Authentication** — Register, login and logout with JWT stored in httpOnly cookies; session is automatically restored on page load via `GET /auth/me`.
- **Chat management** — Create, rename and delete chats from a collapsible sidebar.
- **Real-time streaming** — Assistant responses are streamed token-by-token using Server-Sent Events; a blinking cursor and animated typing indicator give live feedback.
- **Model selector** — Choose from any model available on OpenRouter; the active model is persisted per chat.
- **Responsive layout** — Sidebar collapses to icon-only mode for more reading space.
- **Optimistic UI** — User messages appear instantly before the server acknowledges them.
- **Dark / light theme** — Inherits the OS colour-scheme preference via Tailwind and Shadcn CSS variables.

## Prerequisites

- Node.js ≥ 20
- GPTClone Server running (default `http://localhost:5000`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment template
cp .env.example .env
```

Edit `.env` if your server runs on a different host or port:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Development

```bash
npm run dev          # Start Vite dev server at http://localhost:5173
```

The dev server proxies nothing — all API calls go directly to `VITE_API_URL`. Make sure CORS on the server is set to `http://localhost:5173` (the server's default).

## Production build

```bash
npm run build        # Type-check + bundle to dist/
npm run preview      # Preview the production build locally
```

## Project structure

```
src/
  app/
    store.ts         # Redux store configuration
    hooks.ts         # Typed useAppDispatch / useAppSelector
  features/
    auth/
      authSlice.ts   # Auth state, login/register/logout thunks
    chats/
      chatsSlice.ts  # Chats + messages state, all CRUD thunks
  hooks/
    useStream.ts     # SSE streaming hook (fetch + ReadableStream)
  components/
    auth/
      ProtectedRoute.tsx
    chat/
      MessageBubble.tsx    # Single user/assistant message
      StreamingBubble.tsx  # Animated in-progress assistant message
      MessageList.tsx      # Scrollable message history
      MessageInput.tsx     # Auto-resize textarea + send button
      ModelSelector.tsx    # Dropdown to switch AI model
    layout/
      Sidebar.tsx          # Collapsible chat list + user menu
      ChatHeader.tsx       # Top bar with model selector
    ui/                    # Shadcn components (generated)
  lib/
    api.ts           # Axios instance (credentials: include)
    utils.ts         # cn() helper
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    ChatPage.tsx
  types/
    index.ts         # Shared TypeScript interfaces
  App.tsx            # BrowserRouter + lazy routes
  main.tsx           # Redux Provider + React root
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000/api/v1` | Base URL of the GPTClone Server API |

## Architecture notes

### Authentication
The server stores the JWT in an httpOnly cookie, so the client never touches the token directly. On mount, `App.tsx` dispatches `fetchMe()` which hits `GET /auth/me`; if the cookie is still valid the user is restored, otherwise the auth state stays unauthenticated and the user is redirected to `/login`.

### Streaming
`useStream.ts` calls `POST /chats/:chatId/messages/stream` with `fetch` (not Axios, to access the raw `ReadableStream`). It appends each SSE delta to `chatsSlice.streamingContent` which `StreamingBubble` reads and displays. When the `done` event arrives, the optimistic messages are replaced with the server-confirmed IDs and the chat list is refreshed to pick up the auto-generated title.

### State shape

```
store.auth   → { user, isAuthenticated, isLoading, error }
store.chats  → { chats[], activeChatId, activeChat, models[],
                 isLoadingChats, isLoadingMessages,
                 isStreaming, streamingContent, error }
```

## Related

- **Server** — `../Server` — Express + Prisma + OpenRouter backend
- **Root repo** — contains both as git submodules
