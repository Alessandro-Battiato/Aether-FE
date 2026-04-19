import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModelSelector from '@/components/chat/ModelSelector';
import { useAppSelector } from '@/app/hooks';

interface ChatHeaderProps {
  onMobileMenuOpen: () => void;
}

export default function ChatHeader({ onMobileMenuOpen }: ChatHeaderProps) {
  const { activeChat } = useAppSelector((s) => s.chats);

  if (!activeChat) return null;

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm px-4 py-2.5 flex items-center gap-3">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-8 w-8 flex-shrink-0"
        onClick={onMobileMenuOpen}
        aria-label="Open sidebar"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Model selector — centred; balancing spacer keeps it truly centred on mobile */}
      <div className="flex flex-1 justify-center">
        <ModelSelector />
      </div>
      <div className="md:hidden w-8 flex-shrink-0" />
    </header>
  );
}
