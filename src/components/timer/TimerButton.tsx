import { useTimer } from "@/contexts/TimerContext";
import { formatDuration } from "@/hooks/use-time-entries";
import { Play, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerButtonProps {
    projectId?: string | null;
    projectName?: string | null;
    taskId?: string | null;
    taskTitle?: string | null;
    /** Compact: just the play/stop icon. Full: shows elapsed time too */
    variant?: "compact" | "full";
    className?: string;
}

export function TimerButton({
    projectId,
    projectName,
    taskId,
    taskTitle,
    variant = "compact",
    className,
}: TimerButtonProps) {
    const { timer, start, stop, isStarting, isStopping } = useTimer();

    const isThisTimer =
        timer.isRunning &&
        (taskId ? timer.taskId === taskId : timer.projectId === projectId);

    const isLoading = isStarting || isStopping;

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isLoading) return;
        if (isThisTimer) {
            await stop();
        } else {
            await start({ projectId, projectName, taskId, taskTitle });
        }
    };

    if (variant === "compact") {
        return (
            <button
                onClick={handleClick}
                title={isThisTimer ? "Parar cronômetro" : "Iniciar cronômetro"}
                disabled={isLoading}
                className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-all duration-150 select-none",
                    isThisTimer
                        ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
                        : "bg-muted/40 text-muted-foreground border border-border hover:bg-muted hover:text-foreground",
                    isLoading && "opacity-50 cursor-wait",
                    className
                )}
            >
                {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : isThisTimer ? (
                    <Square className="h-3 w-3 fill-primary text-primary" />
                ) : (
                    <Play className="h-3 w-3 fill-current" />
                )}
                {isThisTimer && formatDuration(timer.elapsed)}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all duration-150 select-none border",
                isThisTimer
                    ? "bg-primary text-white border-primary shadow-sm hover:bg-primary/90"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/30 hover:bg-muted/50",
                isLoading && "opacity-50 cursor-wait",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isThisTimer ? (
                <Square className="h-3.5 w-3.5 fill-white" />
            ) : (
                <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>{isThisTimer ? formatDuration(timer.elapsed) : "Iniciar"}</span>
        </button>
    );
}
