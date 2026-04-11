import { useEffect } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
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
import type { AIModel } from '@/types';

function isFreeModel(model: AIModel): boolean {
  if (model.id.endsWith(':free')) return true;
  if (model.pricing?.prompt === '0' && model.pricing?.completion === '0') return true;
  return false;
}

function modelDisplayName(model: AIModel): string {
  return model.name ?? model.id.split('/').pop() ?? model.id;
}

export default function ModelSelector() {
  const dispatch = useAppDispatch();
  const { activeChat, models } = useAppSelector((s) => s.chats);

  useEffect(() => {
    if (models.length === 0) dispatch(fetchModels());
  }, [dispatch, models.length]);

  if (!activeChat) return null;

  const currentModelId = activeChat.model;
  const currentModel = models.find((m) => m.id === currentModelId);
  const displayName = currentModel ? modelDisplayName(currentModel) : (currentModelId.split('/').pop() ?? currentModelId);

  const freeModels = models.filter(isFreeModel);

  // The active model may not be free (e.g. the server default openai/gpt-4o-mini).
  // Always keep it accessible so users can revert after switching away.
  const currentIsFree = freeModels.some((m) => m.id === currentModelId);

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
        {/* Current model at the top when it's not free */}
        {!currentIsFree && currentModel && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Current model</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleSelect(currentModel.id)}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-sm">{modelDisplayName(currentModel)}</span>
                <span className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" />
                  Requires credits
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuGroup>
          <DropdownMenuLabel>Free models</DropdownMenuLabel>
          {freeModels.length === 0 ? (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              Loading…
            </div>
          ) : (
            freeModels.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => handleSelect(model.id)}
                className="flex flex-col items-start gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-sm">{modelDisplayName(model)}</span>
                {model.context_length && (
                  <span className="text-xs text-muted-foreground">
                    {(model.context_length / 1000).toFixed(0)}k context
                  </span>
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
