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
        { label: "Produção", value: productivityValue, color: "bg-primary/80", icon: Activity },
        { label: "Financeiro", value: financialValue, color: "bg-emerald-500/80", icon: TrendingUp },
        { label: "Clientes", value: clientsValue, color: "bg-amber-500/80", icon: Users },
        { label: "Foco", value: focusValue, color: "bg-rose-500/80", icon: Zap },
    ];

    const averageScore = Math.round(metrics.reduce((acc, m) => acc + m.value, 0) / metrics.length);

    return (
        <div className="bg-card/40 backdrop-blur-sm border-none rounded-2xl p-5 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-primary/40" />
                    <h3 className="text-[11px] font-medium text-muted-foreground/60">Status de Operação</h3>
                </div>
                <Badge variant="outline" className="h-4 px-2 border-primary/10 bg-primary/5 text-primary/60 text-[8px] font-bold uppercase tracking-widest rounded-full">
                    Nimbus AI
                </Badge>
            </div>

            <div className="flex items-center gap-6 relative z-10">
                <div className="relative flex items-center justify-center h-16 w-16 shrink-0">
                    <svg className="h-full w-full rotate-[-90deg]">
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            className="text-muted/5"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="28"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeDasharray={176}
                            strokeDashoffset={176 - (176 * averageScore) / 100}
                            className="text-primary transition-all duration-1000 ease-in-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold tracking-tight text-foreground tabular-nums">{averageScore}</span>
                        <span className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground/40 -mt-1">Score</span>
                    </div>
                </div>

                <div className="flex-1 grid grid-cols-1 gap-3">
                    {metrics.map((m) => (
                        <ScoreMetric key={m.label} {...m} />
                    ))}
                </div>
            </div>

            <div className="mt-5 pt-4 border-none relative z-10">
                <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest text-center">
                    {averageScore > 70
                        ? "Eficiência Máxima • Escala Saudável"
                        : "Atenção • Carga de Trabalho em Risco"}
                </p>
            </div>
        </div>
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
