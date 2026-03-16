import { motion } from "framer-motion";
import { Briefcase, CheckSquare, Users, TrendingUp } from "lucide-react";
import FinancialMetric from "@/components/ui/FinancialMetric";
import { cn } from "@/lib/utils";

interface MetricBarProps {
    projectsCount: number;
    completionRate: number;
    clientsCount: number;
    totalValue: number;
    className?: string;
}

export const MetricBar = ({
    projectsCount,
    completionRate,
    clientsCount,
    totalValue,
    className
}: MetricBarProps) => {
    return (
        <div className={cn(
            "flex flex-wrap items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-4 px-6 rounded-2xl shadow-card",
            className
        )}>
            <MetricItem
                label="Ativos"
                value={projectsCount}
                unit="Projetos"
                icon={Briefcase}
            />
            <MetricItem
                label="Progresso"
                value={`${completionRate}%`}
                unit="Taxa"
                icon={CheckSquare}
            />
            <MetricItem
                label="Clientes"
                value={clientsCount}
                unit="Parceiros"
                icon={Users}
            />
            <MetricItem
                label="Previsão"
                value={totalValue}
                unit="Faturamento"
                icon={TrendingUp}
                isCurrency
            />
        </div>
    );
};

interface MetricItemProps {
    label: string;
    value: string | number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    isCurrency?: boolean;
}

function MetricItem({ label, value, unit, icon: Icon, isCurrency }: MetricItemProps) {
    return (
        <div className="flex items-center gap-3 group min-w-[120px]">
            <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary/40 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-medium text-muted-foreground/60 leading-none mb-1">
                    {label}
                </span>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold tracking-tight text-foreground tabular-nums">
                        {isCurrency ? (
                            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(value))
                        ) : (
                            value
                        )}
                    </span>
                    <span className="text-[9px] font-medium text-muted-foreground/30">
                        {unit}
                    </span>
                </div>
            </div>
        </div>
    );
}
