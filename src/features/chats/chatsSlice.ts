import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Chat, Message, AIModel } from '@/types';
import api from '@/lib/api';

interface ChatsState {
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  models: AIModel[];
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
  isLoadingChats: false,
  isLoadingMessages: false,
  isStreaming: false,
  streamingContent: '',
  error: null,
};

// ─── Regular (loading-state) thunks ──────────────────────────────────────────

export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{ status: string; data: { chats: Chat[] } }>('/chats');
      return res.data.data.chats;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load chats');
    }
  }
);

export const fetchChat = createAsyncThunk(
  'chats/fetchChat',
  async (chatId: string, { rejectWithValue }) => {
    try {
      const res = await api.get<{ status: string; data: { chat: Chat } }>(`/chats/${chatId}`);
      return res.data.data.chat;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load chat');
    }
  }
);

// ─── Silent refresh thunks (no loading-state changes → no skeleton flash) ────

export const silentRefreshChats = createAsyncThunk(
  'chats/silentRefreshChats',
  async () => {
    const res = await api.get<{ status: string; data: { chats: Chat[] } }>('/chats');
    return res.data.data.chats;
  }
);

export const silentRefreshActiveChat = createAsyncThunk(
  'chats/silentRefreshActiveChat',
  async (chatId: string) => {
    const res = await api.get<{ status: string; data: { chat: Chat } }>(`/chats/${chatId}`);
    return res.data.data.chat;
  }
);

// ─── Mutation thunks ──────────────────────────────────────────────────────────

export const createChat = createAsyncThunk(
  'chats/createChat',
  async (payload: { title?: string; model?: string } | undefined, { rejectWithValue }) => {
    try {
      const res = await api.post<{ status: string; data: { chat: Chat } }>('/chats', payload ?? {});
      return res.data.data.chat;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to create chat');
    }
  }
);

export const updateChat = createAsyncThunk(
  'chats/updateChat',
  async (
    { chatId, ...payload }: { chatId: string; title?: string; model?: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.patch<{ status: string; data: { chat: Chat } }>(
        `/chats/${chatId}`,
        payload
      );
      return res.data.data.chat;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to update chat');
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chats/deleteChat',
  async (chatId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/chats/${chatId}`);
      return chatId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to delete chat');
    }
  }
);

export const fetchModels = createAsyncThunk(
  'chats/fetchModels',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{
        status: string;
        data: { models: AIModel[]; total: number };
      }>('/chats/models?limit=100');
      return res.data.data.models;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load models');
    }
  }
);

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
    /**
     * Called at the end of a successful stream.
     * Replaces the optimistic user message with the real IDs, then appends
     * the assistant message — no extra fetch needed.
     */
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
      // silentRefreshChats — only update titles, no loading flag
      .addCase(silentRefreshChats.fulfilled, (state, action) => {
        for (const updated of action.payload) {
          const existing = state.chats.find((c) => c.id === updated.id);
          if (existing) {
            existing.title = updated.title;
            existing.updatedAt = updated.updatedAt;
          }
        }
      })
      // silentRefreshActiveChat — only update metadata, never replace messages
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
      // fetchModels — filter broken providers, then ensure the server default
      // (openai/gpt-4o-mini) is always present as a selectable free model even
      // when the models endpoint doesn't return it.
      .addCase(fetchModels.fulfilled, (state, action) => {
        const BROKEN_PREFIXES = ['minimax/', 'google/'];
        const filtered = action.payload.filter(
          (m) => !BROKEN_PREFIXES.some((prefix) => m.id.startsWith(prefix))
        );
        const GPT_4O_MINI_ID = 'openai/gpt-4o-mini';
        if (!filtered.some((m) => m.id === GPT_4O_MINI_ID)) {
          filtered.unshift({
            id: GPT_4O_MINI_ID,
            name: 'GPT-4o Mini',
            pricing: { prompt: '0', completion: '0' },
          });
        }
        state.models = filtered;
      });
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
