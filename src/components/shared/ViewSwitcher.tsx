import React from 'react';
import { Plus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ViewOption {
    id: string;
    label: string;
    icon: LucideIcon;
}

interface ViewSwitcherProps {
    options: ViewOption[];
    activeView: string;
    onViewChange: (viewId: string) => void;
    onAddView?: () => void;
    className?: string;
}

export const ViewSwitcher = ({
    options,
    activeView,
    onViewChange,
    onAddView,
    className
}: ViewSwitcherProps) => {
    return (
        <div className={cn("flex items-center justify-between border-b border-border bg-background/50 backdrop-blur-sm px-4 h-10 w-full", className)}>
            <div className="flex items-center h-full">
                {options.map((option) => {
                    const Icon = option.icon;
                    const isActive = activeView === option.id;

                    return (
                        <button
                            key={option.id}
                            onClick={() => onViewChange(option.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 h-full text-xs font-medium transition-all relative group",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {option.label}

                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-1px_4px_rgba(255,106,42,0.4)]" />
                            )}
                        </button>
                    );
                })}

                {onAddView && (
                    <button
                        onClick={onAddView}
                        className="flex items-center gap-2 px-4 h-full text-xs font-medium text-muted-foreground hover:text-foreground transition-all border-l border-border/40 ml-2"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar View
                    </button>
                )}
            </div>

            {/* Right side could have filters or other contextual actions later */}
        </div>
    );
};
