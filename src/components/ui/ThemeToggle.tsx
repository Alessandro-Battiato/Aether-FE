import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="w-3.5 h-3.5" />, label: 'Light' },
  { value: 'dark', icon: <Moon className="w-3.5 h-3.5" />, label: 'Dark' },
  { value: 'system', icon: <Monitor className="w-3.5 h-3.5" />, label: 'System' },
];

interface Props {
  /** compact renders icon-only pills; full renders labelled pills */
  variant?: 'compact' | 'full';
}

export default function ThemeToggle({ variant = 'full' }: Props) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          aria-label={opt.label}
          title={opt.label}
          className={cn(
            'flex items-center gap-1.5 rounded-md transition-all text-xs font-medium outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring/50',
            variant === 'full' ? 'px-2.5 py-1.5' : 'p-1.5',
            theme === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.icon}
          {variant === 'full' && <span>{opt.label}</span>}
        </button>
      ))}
    </div>
  );
}
