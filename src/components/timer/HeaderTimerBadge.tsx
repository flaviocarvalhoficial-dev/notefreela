import { motion, AnimatePresence } from "framer-motion";
import { useTimer } from "@/contexts/TimerContext";
import { formatDuration } from "@/hooks/use-time-entries";
import { Square, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

/**
 * Compact timer badge for the top header.
 * Shows active timer with elapsed time and a stop button.
 * When not running, shows a subtle idle indicator.
 */
export function HeaderTimerBadge() {
    const { timer, stop, isStopping } = useTimer();
    const navigate = useNavigate();

    if (!timer.isRunning) {
        return (
            <button
                onClick={() => navigate("/")}
                title="Ir para o cronômetro"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium text-muted-foreground border border-border/60 hover:border-primary/30 hover:text-foreground transition-all bg-transparent"
            >
                <Clock className="h-3 w-3" />
                <span className="hidden sm:inline">00:00:00</span>
            </button>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary"
            >
                {/* Pulsing indicator */}
                <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>

                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1 min-w-0"
                    title={timer.taskTitle ?? timer.projectName ?? "Ver cronômetro"}
                >
                    <span className="text-[11px] font-mono font-semibold tabular-nums text-primary">
                        {formatDuration(timer.elapsed)}
                    </span>
                    <span className="hidden md:inline text-[10px] font-normal text-primary/70 truncate max-w-[100px] ml-1">
                        {timer.taskTitle ?? timer.projectName}
                    </span>
                </button>

                <button
                    onClick={async (e) => { e.stopPropagation(); await stop(); }}
                    disabled={isStopping}
                    title="Parar cronômetro"
                    className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                    <Square className="h-2.5 w-2.5 fill-primary text-primary" />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
