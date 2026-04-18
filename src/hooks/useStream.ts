import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  appendStreamChunk,
  setIsStreaming,
  finaliseStreamedMessages,
  addOptimisticUserMessage,
} from '@/features/chats/chatsSlice';
import { silentRefreshChats, silentRefreshActiveChat, silentRefreshMessages } from '@/features/chats/chatsThunks';
import { selectActiveChatId } from '@/features/chats/chatsSelectors';
import type { Message } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';

export function useStream() {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
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

      let finalUserMessageId = '';
      let finalAssistantMessageId = '';
      let fullContent = '';

      try {
        await fetchEventSource(`${API_BASE}/chats/${activeChatId}/messages/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
          credentials: 'include',
          signal: controller.signal,
          async onopen(response) {
            if (!response.ok) {
              const errBody = await response.json().catch(() => ({})) as { message?: string };
              throw new Error(errBody.message ?? `Request failed (${response.status})`);
            }
          },
          onmessage(event) {
            const parsed = JSON.parse(event.data) as {
              delta?: string;
              done?: boolean;
              messageId?: string;
              userMessageId?: string;
              error?: string;
            };

            if (parsed.error) {
              // Surface the server error immediately, then abort the stream.
              // The resulting AbortError is caught below and silently ignored
              // since the toast is already shown here.
              const clean = parsed.error.replace(/^\d{3}\s*/, '');
              toast.error('Message failed', { description: clean });
              controller.abort();
              return;
            }

            if (parsed.delta) {
              dispatch(appendStreamChunk(parsed.delta));
              fullContent += parsed.delta;
            }

            if (parsed.done) {
              finalAssistantMessageId = parsed.messageId ?? '';
              finalUserMessageId = parsed.userMessageId ?? '';
            }
          },
          onerror(err) {
            throw err; // rethrow to prevent automatic reconnection
          },
        });

        // Only finalise if the server sent the `done` event with real IDs.
        // If the stream ended before `done` arrived (race: user clicked cancel
        // just as the last byte landed), skip finalise and clean up the optimistic
        // instead — otherwise an empty assistant bubble would be left behind.
        if (finalUserMessageId && finalAssistantMessageId) {
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
        } else {
          // `done` never arrived — stream resolved without completing (race condition).
          // Sync from server to replace the orphaned optimistic with the real messages.
          dispatch(silentRefreshMessages(activeChatId));
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled (or onmessage showed a server-error toast and aborted).
          // Replace the optimistic message with the real persisted user message by
          // fetching the server state — no loading flags, no skeleton flash.
          dispatch(silentRefreshMessages(activeChatId));
          return;
        }
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
