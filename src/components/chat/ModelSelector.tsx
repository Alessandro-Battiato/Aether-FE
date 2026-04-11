import { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchModels, updateChat } from '@/features/chats/chatsSlice';

const FEATURED_MODELS = [
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-haiku',
  'google/gemini-flash-1.5',
  'meta-llama/llama-3.1-8b-instruct:free',
];

export default function ModelSelector() {
  const dispatch = useAppDispatch();
  const { activeChat, models } = useAppSelector((s) => s.chats);

  useEffect(() => {
    if (models.length === 0) {
      dispatch(fetchModels());
    }
  }, [dispatch, models.length]);

  if (!activeChat) return null;

  const currentModelId = activeChat.model;
  const currentModel = models.find((m) => m.id === currentModelId);
  const displayName = currentModel?.name ?? currentModelId.split('/').pop() ?? currentModelId;

  const featuredModels = models.filter((m) => FEATURED_MODELS.includes(m.id));
  const otherModels = models.filter((m) => !FEATURED_MODELS.includes(m.id)).slice(0, 20);

  const handleSelect = (modelId: string) => {
    dispatch(updateChat({ chatId: activeChat.id, model: modelId }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-sm font-medium max-w-[200px] truncate"
        >
          <span className="truncate">{displayName}</span>
          <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="w-64 max-h-80 overflow-y-auto">
        {featuredModels.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Featured
            </DropdownMenuLabel>
            {featuredModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => handleSelect(model.id)}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-sm">
                  {model.name ?? model.id.split('/').pop()}
                </span>
                {model.context_length && (
                  <span className="text-xs text-muted-foreground">
                    {(model.context_length / 1000).toFixed(0)}k context
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {otherModels.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              More models
            </DropdownMenuLabel>
            {otherModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onSelect={() => handleSelect(model.id)}
                className="cursor-pointer"
              >
                <span className="text-sm truncate">
                  {model.name ?? model.id.split('/').pop()}
                </span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
