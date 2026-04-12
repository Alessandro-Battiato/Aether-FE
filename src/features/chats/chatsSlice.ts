import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Chat, Message, AIModel } from '@/types';
import {
  fetchChats,
  fetchChat,
  silentRefreshChats,
  silentRefreshActiveChat,
  createChat,
  updateChat,
  deleteChat,
  fetchModels,
} from './chatsThunks';

// ─── State ────────────────────────────────────────────────────────────────────

interface ChatsState {
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  models: AIModel[];
  modelsPage: number;       // last page successfully fetched (0 = none yet)
  modelsTotalPages: number;
  isLoadingModels: boolean;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  streamingContent: string;
  error: string | null;
}

const initialState: ChatsState = {
  chats: [],
  activeChatId: null,
  activeChat: null,
  models: [],
  modelsPage: 0,
  modelsTotalPages: 1,
  isLoadingModels: false,
  isLoadingChats: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BROKEN_PREFIXES = ['minimax/', 'google/'];
const GPT_4O_MINI_ID = 'openai/gpt-4o-mini';

/** Filter broken providers out of a raw server model list. */
function filterModels(raw: AIModel[]): AIModel[] {
  return raw.filter(
    (m) => !BROKEN_PREFIXES.some((prefix) => m.id.startsWith(prefix))
  );
}

/**
 * Ensure gpt-4o-mini is present in the full accumulated list.
 * Called only after the initial page-1 fetch so it's never duplicated.
 */
function ensureGpt4oMini(models: AIModel[]): AIModel[] {
  if (models.some((m) => m.id === GPT_4O_MINI_ID)) return models;
  return [
    { id: GPT_4O_MINI_ID, name: 'GPT-4o Mini', pricing: { prompt: '0', completion: '0' } },
    ...models,
  ];
}

// ─── Slice ────────────────────────────────────────────────────────────────────

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
      if (action.payload === null) state.activeChat = null;
    },
    appendStreamChunk(state, action: PayloadAction<string>) {
      state.streamingContent += action.payload;
    },
    setIsStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
      if (!action.payload) state.streamingContent = '';
    },
    finaliseStreamedMessages(
      state,
      action: PayloadAction<{
        optimisticId: string;
        userMessage: Message;
        assistantMessage: Message;
      }>
    ) {
      if (state.activeChat) {
        const filtered = (state.activeChat.messages ?? []).filter(
          (m) => m.id !== action.payload.optimisticId
        );
        state.activeChat.messages = [
          ...filtered,
          action.payload.userMessage,
          action.payload.assistantMessage,
        ];
      }
    },
    addOptimisticUserMessage(state, action: PayloadAction<Message>) {
      if (state.activeChat) {
        state.activeChat.messages = [
          ...(state.activeChat.messages ?? []),
          action.payload,
        ];
      }
    },
    clearError(state) {
      state.error = null;
    },
    resetChats(state) {
      state.chats = [];
      state.activeChatId = null;
      state.activeChat = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchChats
      .addCase(fetchChats.pending, (state) => { state.isLoadingChats = true; })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoadingChats = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoadingChats = false;
        state.error = action.payload as string;
      })
      // fetchChat
      .addCase(fetchChat.pending, (state) => { state.isLoadingMessages = true; })
      .addCase(fetchChat.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.activeChat = action.payload;
        const idx = state.chats.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.chats[idx] = { ...state.chats[idx], ...action.payload };
      })
      .addCase(fetchChat.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      // silentRefreshChats
      .addCase(silentRefreshChats.fulfilled, (state, action) => {
        for (const updated of action.payload) {
          const existing = state.chats.find((c) => c.id === updated.id);
          if (existing) {
            existing.title = updated.title;
            existing.updatedAt = updated.updatedAt;
          }
        }
      })
      // silentRefreshActiveChat
      .addCase(silentRefreshActiveChat.fulfilled, (state, action) => {
        const { id, title, updatedAt } = action.payload;
        if (state.activeChat?.id === id) {
          state.activeChat.title = title;
          state.activeChat.updatedAt = updatedAt;
        }
        const idx = state.chats.findIndex((c) => c.id === id);
        if (idx !== -1) {
          state.chats[idx].title = title;
          state.chats[idx].updatedAt = updatedAt;
        }
      })
      // createChat
      .addCase(createChat.fulfilled, (state, action) => {
        state.chats.unshift(action.payload);
        state.activeChatId = action.payload.id;
        state.activeChat = { ...action.payload, messages: [] };
      })
      // updateChat
      .addCase(updateChat.fulfilled, (state, action) => {
        const idx = state.chats.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.chats[idx] = action.payload;
        if (state.activeChat?.id === action.payload.id) {
          state.activeChat = { ...state.activeChat, ...action.payload };
        }
      })
      // deleteChat
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chats = state.chats.filter((c) => c.id !== action.payload);
        if (state.activeChatId === action.payload) {
          state.activeChatId = state.chats[0]?.id ?? null;
          state.activeChat = null;
        }
      })
      // fetchModels — page 1 replaces the list, page > 1 appends
      .addCase(fetchModels.pending, (state) => { state.isLoadingModels = true; })
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.isLoadingModels = false;
        const { models, page, totalPages } = action.payload;
        const filtered = filterModels(models);
        if (page === 1) {
          state.models = ensureGpt4oMini(filtered);
        } else {
          state.models = [...state.models, ...filtered];
        }
        state.modelsPage = page;
        state.modelsTotalPages = totalPages;
      })
      .addCase(fetchModels.rejected, (state) => { state.isLoadingModels = false; });
  },
});

export const {
  setActiveChatId,
  appendStreamChunk,
  setIsStreaming,
  finaliseStreamedMessages,
  addOptimisticUserMessage,
  clearError,
  resetChats,
} = chatsSlice.actions;

export default chatsSlice.reducer;
