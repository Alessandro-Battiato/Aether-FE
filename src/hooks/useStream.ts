import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  appendStreamChunk,
  setIsStreaming,
  finaliseStreamedMessages,
  addOptimisticUserMessage,
  silentRefreshChats,
  silentRefreshActiveChat,
} from '@/features/chats/chatsSlice';
import type { Message } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

export function useStream() {
  const dispatch = useAppDispatch();
  const { activeChatId } = useAppSelector((s) => s.chats);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    dispatch(setIsStreaming(false));
  }, [dispatch]);

  const sendStreamMessage = useCallback(
    async (content: string) => {
      if (!activeChatId) return;

      const optimisticId = `optimistic-${Date.now()}`;

      const optimisticMsg: Message = {
        id: optimisticId,
        role: 'user',
        content,
        chatId: activeChatId,
        createdAt: new Date().toISOString(),
      };
      dispatch(addOptimisticUserMessage(optimisticMsg));
      dispatch(setIsStreaming(true));

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(
          `${API_BASE}/chats/${activeChatId}/messages/stream`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
            credentials: 'include',
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({})) as { message?: string };
          throw new Error(errBody.message ?? `Request failed (${response.status})`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let finalUserMessageId = '';
        let finalAssistantMessageId = '';
        let fullContent = '';
        let streamError: string | null = null;

        outer: while (true) {
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
                error?: string;
              };

              // Server-sent error (e.g. 402 insufficient credits)
              if (parsed.error) {
                streamError = parsed.error;
                reader.cancel();
                break outer;
              }

              if (parsed.delta) {
                dispatch(appendStreamChunk(parsed.delta));
                fullContent += parsed.delta;
              }

              if (parsed.done) {
                finalAssistantMessageId = parsed.messageId ?? '';
                finalUserMessageId = parsed.userMessageId ?? '';
              }
            } catch {
              // skip malformed line
            }
          }
        }

        if (streamError) {
          // Surface the error as a toast; strip leading status-code prefix if present
          const clean = streamError.replace(/^\d{3}\s*/, '');
          toast.error('Message failed', { description: clean });
          return;
        }

        // Swap optimistic message for real IDs and append assistant reply
        dispatch(
          finaliseStreamedMessages({
            optimisticId,
            userMessage: {
              id: finalUserMessageId,
              role: 'user',
              content,
              chatId: activeChatId,
              createdAt: new Date().toISOString(),
            },
            assistantMessage: {
              id: finalAssistantMessageId,
              role: 'assistant',
              content: fullContent,
              chatId: activeChatId,
              createdAt: new Date().toISOString(),
            },
          })
        );

        // Silent refresh to pick up server-generated chat title and sync timestamps.
        // Uses dedicated thunks that do NOT touch loading flags → no skeleton flash.
        dispatch(silentRefreshActiveChat(activeChatId));
        dispatch(silentRefreshChats());
      } catch (err) {
        // Ignore intentional user cancellations
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Unexpected error';
        toast.error('Message failed', { description: msg });
      } finally {
        abortControllerRef.current = null;
        dispatch(setIsStreaming(false));
      }
    },
    [activeChatId, dispatch]
  );

  return { sendStreamMessage, cancelStream };
}
