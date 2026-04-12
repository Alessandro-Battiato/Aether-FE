import { createAsyncThunk } from '@reduxjs/toolkit';
import type { User } from '@/types';
import api from '@/lib/api';

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get<{ status: string; data: { user: User } }>('/auth/me');
      return res.data.data.user;
    } catch {
      return rejectWithValue(null);
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post<{ status: string; data: { user: User } }>(
        '/auth/login',
        credentials
      );
      return res.data.data.user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    payload: { name: string; email: string; password: string; passwordConfirm: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.post<{ status: string; data: { user: User } }>(
        '/auth/register',
        payload
      );
      return res.data.data.user;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
});
