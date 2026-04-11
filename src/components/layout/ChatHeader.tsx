import ModelSelector from '@/components/chat/ModelSelector';
import { useAppSelector } from '@/app/hooks';

export default function ChatHeader() {
  const { activeChat } = useAppSelector((s) => s.chats);

  if (!activeChat) return null;

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm px-4 py-2.5 flex items-center justify-center">
      <ModelSelector />
    </header>
  );
}
