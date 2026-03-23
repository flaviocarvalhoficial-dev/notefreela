import { motion } from "framer-motion";
import {
    Zap,
    Shield,
    Heart,
    Activity,
    TrendingUp,
    Users,
    Briefcase,
    Sparkles
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ScoreMetricProps {
    label: string;
    value: number;
    color: string;
    icon: any;
}

const ScoreMetric = ({ label, value, color, icon: Icon }: ScoreMetricProps) => (
    <div className="space-y-2">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Icon className={cn("h-3 w-3", color.replace('bg-', 'text-'))} />
                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">{label}</span>
            </div>
            <span className="text-[10px] font-bold tabular-nums text-foreground">{value}%</span>
        </div>
        <Progress value={value} className="h-1 bg-muted/20">
            <div
                className={cn("h-full transition-all duration-500", color)}
                style={{ width: `${value}%` }}
            />
        </Progress>
    </div>
);

import { useDashboardData } from "@/hooks/use-dashboard-data";

export const FreelancerHealthScore = () => {
    const { projects, completionRate, uniqueClientsCount, tasksStats } = useDashboardData();

    // Calculate real health metrics
    const productivityValue = completionRate;
    const financialValue = Math.min(100, Math.round((projects.reduce((acc, p) => acc + (Number(p.value) || 0), 0) / 50000) * 100)); // Target 50k for 100%
    const clientsValue = Math.min(100, (uniqueClientsCount * 10)); // 10 clients = 100%
    const focusValue = tasksStats ? Math.round(((tasksStats.total - tasksStats.completed) / Math.max(1, tasksStats.total)) * 100) : 0;

    const metrics = [
        { label: "Produção", value: productivityValue, color: "bg-foreground/20", icon: Activity },
        { label: "Financeiro", value: financialValue, color: "bg-emerald-500/80", icon: TrendingUp },
        { label: "Clientes", value: clientsValue, color: "bg-amber-500/80", icon: Users },
        { label: "Foco", value: focusValue, color: "bg-rose-500/80", icon: Zap },
    ];

    const averageScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/40 backdrop-blur-sm border-none rounded-2xl p-5 shadow-sm overflow-hidden relative group"
        >
            {/* Dynamic background glow based on score */}
            <motion.div
                animate={{
                    opacity: averageScore > 70 ? [0.05, 0.12, 0.05] : 0,
                    scale: averageScore > 70 ? [1, 1.2, 1] : 1
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-primary/20 blur-[100px] pointer-events-none"
            />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground/30" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">Status de Operação</h3>
                </div>
                <Badge variant="outline" className="h-5 px-3 border-border bg-muted/10 text-muted-foreground/60 text-[9px] font-bold uppercase tracking-widest rounded-full">
                    Nimbus Intelligence
                </Badge>
            </div>

            <div className="flex items-center gap-6 relative z-10">
                <div className="relative flex items-center justify-center h-20 w-20 shrink-0">
                    <svg className="h-full w-full rotate-[-90deg]">
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-muted/5"
                        />
                        <motion.circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={213.6}
                            initial={{ strokeDashoffset: 213.6 }}
                            animate={{ strokeDashoffset: 213.6 - (213.6 * averageScore) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-foreground"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold tracking-tight text-foreground tabular-nums"
                        >
                            {averageScore}
                        </motion.span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 -mt-1">Score</span>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 gap-4">
                    {metrics.map((m, i) => (
                        <motion.div
                            key={m.label}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 + 0.5 }}
                        >
                            <ScoreMetric {...m} />
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/10 relative z-10">
                <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-[0.2em] text-center">
                    {averageScore > 80
                        ? "Eficiência Máxima • Escala Saudável"
                        : averageScore > 50
                            ? "Operação Estável • Monitorando"
                            : "Atenção • Carga de Trabalho em Risco"}
                </p>
            </div>
        </motion.div>
    );
};

function Badge({ children, variant, className }: any) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-full border-none px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variant === "outline" ? "text-foreground" : "bg-primary text-primary-foreground",
            className
        )}>
            {children}
        </span>
    );
}
