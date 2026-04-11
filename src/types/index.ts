export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  chatId: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  model: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface ModelsResponse {
  models: AIModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface ApiError {
  status: string;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface StreamDelta {
  delta?: string;
  done?: boolean;
  messageId?: string;
  userMessageId?: string;
}
