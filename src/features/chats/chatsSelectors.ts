import type { RootState } from '@/app/store';

export const selectChats = (state: RootState) => state.chats.chats;
export const selectActiveChat = (state: RootState) => state.chats.activeChat;
export const selectActiveChatId = (state: RootState) => state.chats.activeChatId;
export const selectIsLoadingChats = (state: RootState) => state.chats.isLoadingChats;
export const selectIsLoadingMessages = (state: RootState) => state.chats.isLoadingMessages;
export const selectIsStreaming = (state: RootState) => state.chats.isStreaming;
export const selectStreamingContent = (state: RootState) => state.chats.streamingContent;
export const selectModels = (state: RootState) => state.chats.models;
export const selectModelsPage = (state: RootState) => state.chats.modelsPage;
export const selectModelsTotalPages = (state: RootState) => state.chats.modelsTotalPages;
export const selectHasMoreModels = (state: RootState) =>
  state.chats.modelsPage < state.chats.modelsTotalPages;
export const selectIsLoadingModels = (state: RootState) => state.chats.isLoadingModels;
