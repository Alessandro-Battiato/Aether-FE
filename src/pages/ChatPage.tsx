import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import ChatHeader from '@/components/layout/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchChats, fetchChat, createChat } from '@/features/chats/chatsThunks';
import { setActiveChatId } from '@/features/chats/chatsSlice';
import {
  selectActiveChat,
  selectActiveChatId,
  selectIsLoadingMessages,
  selectIsStreaming,
  selectStreamingContent,
} from '@/features/chats/chatsSelectors';
import { useStream } from '@/hooks/useStream';
import { usePageTitle } from '@/hooks/usePageTitle';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ChatPage() {
  const dispatch = useAppDispatch();
  const { chatId } = useParams<{ chatId: string }>();
  const activeChat = useAppSelector(selectActiveChat);
  const activeChatId = useAppSelector(selectActiveChatId);
  const isLoadingMessages = useAppSelector(selectIsLoadingMessages);
  const isStreaming = useAppSelector(selectIsStreaming);
  const streamingContent = useAppSelector(selectStreamingContent);

  const { sendStreamMessage, cancelStream } = useStream();

  // Update tab title: "Aether | <chat title>" when a chat is active
  usePageTitle(activeChat?.title ?? undefined);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  // Sync URL param → Redux; restores the selected chat on hard refresh
  useEffect(() => {
    if (chatId) {
      dispatch(setActiveChatId(chatId));
      dispatch(fetchChat(chatId));
    } else {
      dispatch(setActiveChatId(null));
    }
  }, [chatId, dispatch]);

  const handleSend = (content: string) => {
    if (!activeChatId) return;
    sendStreamMessage(content);
  };

  const messages = activeChat?.messages ?? [];

  return (
    <TooltipProvider delay={300}>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeChatId ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <ChatHeader />

                <MessageList
                  messages={messages}
                  isLoading={isLoadingMessages}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                />

                <MessageInput
                  onSend={handleSend}
                  onStop={cancelStream}
                  isDisabled={isLoadingMessages}
                  isStreaming={isStreaming}
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center gap-6 p-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-primary-foreground" />
                </div>

                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight mb-2">
                    What can I help you with?
                  </h1>
                  <p className="text-muted-foreground">
                    Start a new conversation to get started
                  </p>
                </div>

                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => dispatch(createChat())}
                >
                  <Plus className="w-4 h-4" />
                  New chat
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </TooltipProvider>
  );
}
