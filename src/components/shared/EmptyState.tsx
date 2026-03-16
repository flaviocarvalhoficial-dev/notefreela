import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
    title: string;
    description: string;
    icon: LucideIcon;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    title,
    description,
    icon: Icon,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/20 bg-card/5 backdrop-blur-sm",
                className
            )}
        >
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
                <div className="relative h-16 w-16 rounded-[1.25rem] bg-primary/5 border border-primary/10 flex items-center justify-center text-primary/20">
                    <Icon className="h-8 w-8" />
                </div>
                {/* Blueprint details */}
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-primary/20" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-primary/20" />
            </div>

            <div className="max-w-[320px] space-y-2">
                <h3 className="text-sm font-semibold text-foreground/80 tracking-tight">
                    {title}
                </h3>
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed font-normal">
                    {description}
                </p>
            </div>

            {actionLabel && onAction && (
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-8 h-8 px-5 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-all text-[11px] font-medium uppercase tracking-widest gap-2"
                    onClick={onAction}
                >
                    {actionLabel}
                </Button>
            )}
        </motion.div>
    );
}
