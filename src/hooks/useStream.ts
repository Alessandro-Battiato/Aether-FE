import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  appendStreamChunk,
  setIsStreaming,
  addStreamedMessage,
  addOptimisticUserMessage,
  fetchChats,
  fetchChat,
} from '@/features/chats/chatsSlice';
import type { Message } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

export function useStream() {
  const dispatch = useAppDispatch();
  const { activeChatId, activeChat } = useAppSelector((s) => s.chats);

  const sendStreamMessage = useCallback(
    async (content: string) => {
      if (!activeChatId) return;

      // Optimistic user message
      const optimisticMsg: Message = {
        id: `optimistic-${Date.now()}`,
        role: 'user',
        content,
        chatId: activeChatId,
        createdAt: new Date().toISOString(),
      };
      dispatch(addOptimisticUserMessage(optimisticMsg));
      dispatch(setIsStreaming(true));

      try {
        const response = await fetch(
          `${API_BASE}/chats/${activeChatId}/messages/stream`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let finalUserMessageId = '';
        let finalAssistantMessageId = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr) as {
                delta?: string;
                done?: boolean;
                messageId?: string;
                userMessageId?: string;
              };

              if (parsed.delta) {
                dispatch(appendStreamChunk(parsed.delta));
                fullContent += parsed.delta;
              }

              if (parsed.done) {
                finalAssistantMessageId = parsed.messageId ?? '';
                finalUserMessageId = parsed.userMessageId ?? '';
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        // Replace optimistic message with real data
        const userMessage: Message = {
          id: finalUserMessageId,
          role: 'user',
          content,
          chatId: activeChatId,
          createdAt: new Date().toISOString(),
        };
        const assistantMessage: Message = {
          id: finalAssistantMessageId,
          role: 'assistant',
          content: fullContent,
          chatId: activeChatId,
          createdAt: new Date().toISOString(),
        };

        // Remove the optimistic message and add real ones
        if (activeChat) {
          // We'll refresh the chat to get accurate data including auto-title
          dispatch(addStreamedMessage({ userMessage, assistantMessage }));
          // Also refresh the chats list to update title in sidebar
          dispatch(fetchChats());
          // Refresh active chat to sync with server
          dispatch(fetchChat(activeChatId));
        }
      } catch (err) {
        console.error('Stream error:', err);
      } finally {
        dispatch(setIsStreaming(false));
      }
    },
    [activeChatId, activeChat, dispatch]
  );

  return { sendStreamMessage };
}
