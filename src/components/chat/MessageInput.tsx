import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Props {
  onSend: (content: string) => void;
  onStop: () => void;
  isDisabled: boolean;
  isStreaming: boolean;
}

export default function MessageInput({ onSend, onStop, isDisabled, isStreaming }: Props) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const canSend = value.trim().length > 0 && !isDisabled;

  return (
    <div className="border-t bg-background/80 backdrop-blur-sm px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-muted rounded-2xl px-4 py-3 border border-border/50 focus-within:border-ring/50 transition-colors">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className={cn(
              'flex-1 min-h-[24px] max-h-[200px] resize-none border-0 bg-transparent p-0 shadow-none',
              'focus-visible:ring-0 text-sm leading-relaxed'
            )}
            rows={1}
            disabled={isDisabled && !isStreaming}
          />

          <motion.div whileTap={{ scale: 0.92 }}>
            <Button
              size="icon"
              variant={canSend || isStreaming ? 'default' : 'secondary'}
              className="h-8 w-8 rounded-xl flex-shrink-0 transition-all"
              onClick={isStreaming ? onStop : handleSend}
              disabled={!canSend && !isStreaming}
            >
              {isStreaming ? (
                <Square className="w-3 h-3 fill-current" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Press <kbd className="font-mono">Enter</kbd> to send,{' '}
          <kbd className="font-mono">Shift+Enter</kbd> for a new line
        </p>
      </div>
    </div>
  );
}
