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
            <div className="relative mb-8 w-full flex justify-center">
                {/* Metáfora Visual: Mesa e Folha (Arthur Marques) */}
                <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
                    {/* Mesa */}
                    <line x1="10" y1="65" x2="110" y2="65" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-muted-foreground/30" />

                    {/* Folha Central */}
                    <motion.rect
                        initial={{ y: 5 }}
                        animate={{ y: 0 }}
                        transition={{ repeat: Infinity, duration: 4, repeatType: "reverse", ease: "easeInOut" }}
                        x="40" y="20" width="40" height="50" rx="2"
                        fill="currentColor" className="text-card/40 border border-border/10"
                        stroke="currentColor" strokeWidth="0.5"
                    />
                    <rect x="45" y="30" width="30" height="0.5" fill="currentColor" className="text-muted-foreground/20" />
                    <rect x="45" y="38" width="30" height="0.5" fill="currentColor" className="text-muted-foreground/20" />
                    <rect x="45" y="46" width="20" height="0.5" fill="currentColor" className="text-muted-foreground/20" />

                    {/* Lápis Minimalista */}
                    <motion.g
                        initial={{ rotate: -15, x: 0 }}
                        animate={{ rotate: -20, x: 2 }}
                        transition={{ repeat: Infinity, duration: 4, repeatType: "reverse", ease: "easeInOut" }}
                        style={{ transformOrigin: 'center' }}
                    >
                        <path d="M85 25L90 15L95 25L85 25Z" fill="currentColor" className="text-primary" />
                        <rect x="88" y="25" width="4" height="25" rx="1" fill="currentColor" className="text-muted-foreground/40" />
                    </motion.g>

                    {/* Ícone Contextual Flutuante (Opcional) */}
                    <foreignObject x="50" y="35" width="20" height="20">
                        <div className="flex items-center justify-center w-full h-full text-foreground/20 scale-75">
                            <Icon strokeWidth={1.5} />
                        </div>
                    </foreignObject>
                </svg>
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
