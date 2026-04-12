import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import MessageBubble from './MessageBubble';
import StreamingBubble from './StreamingBubble';
import { Skeleton } from '@/components/ui/skeleton';
import type { Message } from '@/types';

interface Props {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
}

export default function MessageList({
  messages,
  isLoading,
  isStreaming,
  streamingContent,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Delay the skeleton so it only shows for slow connections (> 400 ms).
  // Fast chat switches never flash the skeleton at all.
  // The reset happens in the cleanup so we never call setState synchronously
  // inside the effect body (avoids react-hooks/set-state-in-effect warning).
  const [showSkeleton, setShowSkeleton] = useState(false);
  useEffect(() => {
    if (!isLoading) return;
    const id = setTimeout(() => setShowSkeleton(true), 400);
    return () => {
      clearTimeout(id);
      setShowSkeleton(false);
    };
  }, [isLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (showSkeleton) {
    return (
      <div className="flex-1 p-6 space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <Skeleton
              className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-64'}`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-lg font-medium">Start a conversation</p>
            <p className="text-muted-foreground text-sm mt-1">
              Send a message to begin
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0 overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>

        {isStreaming && (
          <StreamingBubble content={streamingContent} />
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
