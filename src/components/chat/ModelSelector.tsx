import { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchModels, updateChat } from '@/features/chats/chatsSlice';
import { cn } from '@/lib/utils';

const FEATURED_MODEL_IDS = [
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
    if (models.length === 0) dispatch(fetchModels());
  }, [dispatch, models.length]);

  if (!activeChat) return null;

  const currentModelId = activeChat.model;
  const currentModel = models.find((m) => m.id === currentModelId);
  const displayName =
    currentModel?.name ?? currentModelId.split('/').pop() ?? currentModelId;

  const featuredModels = models.filter((m) => FEATURED_MODEL_IDS.includes(m.id));
  const otherModels = models
    .filter((m) => !FEATURED_MODEL_IDS.includes(m.id))
    .slice(0, 20);

  const handleSelect = (modelId: string) => {
    dispatch(updateChat({ chatId: activeChat.id, model: modelId }));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium max-w-[220px]',
          'h-8 px-2.5 rounded-md hover:bg-accent transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring/50'
        )}
      >
        <span className="truncate">{displayName}</span>
        <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" className="w-64 max-h-80 overflow-y-auto">
        {featuredModels.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Featured</DropdownMenuLabel>
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
          </DropdownMenuGroup>
        )}

        {otherModels.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>More models</DropdownMenuLabel>
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
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
