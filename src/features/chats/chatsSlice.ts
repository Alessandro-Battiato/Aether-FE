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

export const sendMessage = createAsyncThunk(
  'chats/sendMessage',
  async (
    { chatId, content }: { chatId: string; content: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post<{
        status: string;
        data: { userMessage: Message; assistantMessage: Message };
      }>(`/chats/${chatId}/messages`, { content });
      return res.data.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to send message');
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

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
      if (action.payload === null) {
        state.activeChat = null;
      }
    },
    appendStreamChunk(state, action: PayloadAction<string>) {
      state.streamingContent += action.payload;
    },
    setIsStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
      if (!action.payload) {
        state.streamingContent = '';
      }
    },
    addStreamedMessage(
      state,
      action: PayloadAction<{ userMessage: Message; assistantMessage: Message }>
    ) {
      if (state.activeChat) {
        state.activeChat.messages = [
          ...(state.activeChat.messages ?? []),
          action.payload.userMessage,
          action.payload.assistantMessage,
        ];
      }
      // Update the chat title if it changed (first message auto-titles)
      const chat = state.chats.find((c) => c.id === state.activeChatId);
      if (chat && state.activeChat) {
        chat.title = state.activeChat.title;
        chat.updatedAt = new Date().toISOString();
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
      .addCase(fetchChats.pending, (state) => {
        state.isLoadingChats = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoadingChats = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoadingChats = false;
        state.error = action.payload as string;
      })
      // fetchChat
      .addCase(fetchChat.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(fetchChat.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.activeChat = action.payload;
        // Update in chats list too
        const idx = state.chats.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) {
          state.chats[idx] = { ...state.chats[idx], ...action.payload };
        }
      })
      .addCase(fetchChat.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
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
        if (idx !== -1) {
          state.chats[idx] = action.payload;
        }
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
      // sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.isLoadingMessages = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        if (state.activeChat) {
          state.activeChat.messages = [
            ...(state.activeChat.messages ?? []),
            action.payload.userMessage,
            action.payload.assistantMessage,
          ];
        }
        // Refresh title in sidebar
        const chat = state.chats.find((c) => c.id === state.activeChatId);
        if (chat) chat.updatedAt = new Date().toISOString();
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })
      // fetchModels
      .addCase(fetchModels.fulfilled, (state, action) => {
        state.models = action.payload;
      });
  },
});

export const {
  setActiveChatId,
  appendStreamChunk,
  setIsStreaming,
  addStreamedMessage,
  addOptimisticUserMessage,
  clearError,
  resetChats,
} = chatsSlice.actions;

export default chatsSlice.reducer;
