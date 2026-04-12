import { useEffect } from 'react';
import { ChevronDown, AlertTriangle, Loader2, Check } from 'lucide-react';
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
import { updateChat, fetchModels } from '@/features/chats/chatsThunks';
import {
  selectActiveChat,
  selectModels,
  selectModelsPage,
  selectHasMoreModels,
  selectIsLoadingModels,
} from '@/features/chats/chatsSelectors';
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
  const activeChat = useAppSelector(selectActiveChat);
  const models = useAppSelector(selectModels);
  const modelsPage = useAppSelector(selectModelsPage);
  const hasMoreModels = useAppSelector(selectHasMoreModels);
  const isLoadingModels = useAppSelector(selectIsLoadingModels);

  // Trigger the first fetch only once (modelsPage stays 0 until page 1 lands)
  useEffect(() => {
    if (modelsPage === 0) dispatch(fetchModels(1));
  }, [dispatch, modelsPage]);

  if (!activeChat) return null;

  const currentModelId = activeChat.model;
  const currentModel = models.find((m) => m.id === currentModelId);
  const displayName = currentModel
    ? modelDisplayName(currentModel)
    : (currentModelId.split('/').pop() ?? currentModelId);

  const freeModels = models.filter(isFreeModel);
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
        {/* Current model pinned at top only when it genuinely requires credits */}
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
            freeModels.map((model) => {
              const isSelected = model.id === currentModelId;
              return (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => handleSelect(model.id)}
                  className={cn(
                    'flex items-center gap-2 cursor-pointer',
                    isSelected && 'text-primary font-semibold'
                  )}
                >
                  <span className="flex-1 text-sm">{modelDisplayName(model)}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuGroup>

        {/* Load more — plain button so Base UI's item-activation-closes-menu
            logic never fires; the dropdown stays open while paginating */}
        {hasMoreModels && (
          <>
            <DropdownMenuSeparator />
            <div className="px-1 py-1">
              <button
                type="button"
                disabled={isLoadingModels}
                onClick={() => dispatch(fetchModels(modelsPage + 1))}
                className={cn(
                  'w-full flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5',
                  'text-xs text-muted-foreground transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'disabled:pointer-events-none disabled:opacity-50',
                  'outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
                )}
              >
                {isLoadingModels ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
