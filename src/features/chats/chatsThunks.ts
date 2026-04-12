import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Chat, AIModel } from '@/types';
import api from '@/lib/api';

// ─── Chat CRUD ────────────────────────────────────────────────────────────────

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

// ─── Silent refresh (no loading-state changes → no skeleton flash) ────────────

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

// ─── Models (paginated, limit 10) ─────────────────────────────────────────────

interface ModelsPayload {
  models: AIModel[];
  page: number;
  totalPages: number;
}

/** Initial fetch — replaces the models list. */
export const fetchModels = createAsyncThunk(
  'chats/fetchModels',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{
        status: string;
        data: { models: AIModel[]; page: number; totalPages: number };
      }>('/chats/models?limit=10&page=1');
      const { models, page, totalPages } = res.data.data;
      return { models, page, totalPages } satisfies ModelsPayload;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load models');
    }
  }
);

/** Load-more fetch — appends to the models list. */
export const fetchMoreModels = createAsyncThunk(
  'chats/fetchMoreModels',
  async (page: number, { rejectWithValue }) => {
    try {
      const res = await api.get<{
        status: string;
        data: { models: AIModel[]; page: number; totalPages: number };
      }>(`/chats/models?limit=10&page=${page}`);
      const { models, totalPages } = res.data.data;
      return { models, page, totalPages } satisfies ModelsPayload;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Failed to load more models');
    }
  }
);
