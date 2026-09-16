import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export interface TabItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

export function Tabs({ tabs, value, onChange, children, className }: TabsProps) {
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const groupId = useId();

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter((t) => !t.disabled);
    const currentIndex = enabled.findIndex((t) => t.value === value);
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % enabled.length;
    else if (event.key === 'ArrowLeft')
      nextIndex = (currentIndex - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = enabled.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      const next = enabled[nextIndex];
      onChange(next.value);
      tabRefs.current[next.value]?.focus();
    }
  }

  return (
    <div className={className}>
      <div
        role="tablist"
        onKeyDown={handleKeyDown}
        className="flex gap-1 border-b border-border"
      >
        {tabs.map((tab) => {
          const selected = tab.value === value;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                tabRefs.current[tab.value] = el;
              }}
              role="tab"
              id={`${groupId}-tab-${tab.value}`}
              aria-selected={selected}
              aria-controls={`${groupId}-panel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onChange(tab.value)}
              className={cn(
                'inline-flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-(--transition-fast) focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                selected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text-primary',
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      {children && (
        <div
          role="tabpanel"
          id={`${groupId}-panel-${value}`}
          aria-labelledby={`${groupId}-tab-${value}`}
          tabIndex={0}
          className="pt-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}
