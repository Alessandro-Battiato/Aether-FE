import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  createChat,
  deleteChat,
  updateChat,
  fetchChat,
  setActiveChatId,
} from '@/features/chats/chatsSlice';
import { logout } from '@/features/auth/authSlice';
import type { Chat } from '@/types';

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const { chats, activeChatId, isLoadingChats } = useAppSelector((s) => s.chats);
  const { user } = useAppSelector((s) => s.auth);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleNewChat = () => {
    dispatch(createChat());
  };

  const handleSelectChat = (chat: Chat) => {
    dispatch(setActiveChatId(chat.id));
    dispatch(fetchChat(chat.id));
  };

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    dispatch(deleteChat(chatId));
  };

  const handleStartRename = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setRenamingId(chat.id);
    setRenameValue(chat.title);
  };

  const handleRenameSubmit = (chatId: string) => {
    if (renameValue.trim()) {
      dispatch(updateChat({ chatId, title: renameValue.trim() }));
    }
    setRenamingId(null);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const userInitials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 60 : 260 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="flex flex-col h-full border-r bg-sidebar overflow-hidden flex-shrink-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 gap-2">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm truncate">Aether</span>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-2 pb-2">
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger
              className="inline-flex w-full items-center justify-center h-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={handleNewChat}
            >
              <Plus className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="right">New chat</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2 justify-start"
            onClick={handleNewChat}
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">New chat</span>
          </Button>
        )}
      </div>

      <Separator />

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2 py-2">
        {isLoadingChats ? (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          !isCollapsed && (
            <p className="text-xs text-muted-foreground text-center py-4 px-2">
              No chats yet. Start a new conversation.
            </p>
          )
        ) : (
          <div className="space-y-0.5">
            <AnimatePresence initial={false}>
              {chats.map((chat) => (
                <motion.div
                  key={chat.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renamingId === chat.id && !isCollapsed ? (
                    <div className="flex items-center gap-1 px-1 py-1">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(chat.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        className="h-7 text-xs"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleRenameSubmit(chat.id)}
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setRenamingId(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger
                        className={cn(
                          'flex w-full items-center justify-center rounded-lg cursor-pointer transition-colors py-2',
                          'hover:bg-sidebar-accent outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                          activeChatId === chat.id
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground'
                        )}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">{chat.title}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <div
                      className={cn(
                        'group flex items-center px-2 py-2 gap-2 rounded-lg cursor-pointer transition-colors',
                        'hover:bg-sidebar-accent',
                        activeChatId === chat.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground'
                      )}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{chat.title}</span>

                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => handleStartRename(e, chat)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => handleDelete(e, chat.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Theme Toggle */}
      <div className={cn('px-3 py-2 flex', isCollapsed ? 'justify-center' : 'justify-start')}>
        <ThemeToggle variant={isCollapsed ? 'compact' : 'full'} />
      </div>

      <Separator />

      {/* User Menu */}
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex w-full items-center rounded-md py-2 transition-colors',
              'hover:bg-accent outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              isCollapsed ? 'justify-center px-0' : 'gap-2 px-2'
            )}
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {userInitials ?? <User className="w-3.5 h-3.5" />}
              </AvatarFallback>
            </Avatar>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden text-left min-w-0"
                >
                  <p className="text-sm font-medium truncate leading-tight">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    {user?.email}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.aside>
  );
}
