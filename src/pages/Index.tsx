import { useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    Briefcase,
    CheckSquare,
    Users,
    TrendingUp,
    ArrowUpRight,
    Search,
    Loader2,
    Plus,
    Minus
} from "lucide-react";
import { TimelineSection } from "@/components/dashboard/TimelineSection";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { DashboardTimerWidget } from "@/components/dashboard/DashboardTimerWidget";
import { OpportunityRadar } from "@/components/dashboard/OpportunityRadar";
import { FreelancerHealthScore } from "@/components/dashboard/FreelancerHealthScore";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import Atividades from "./Atividades";

const Index = () => {
    const navigate = useNavigate();

    const {
        projects,
        tasksStats,
        uniqueClientsCount,
        isLoading,
        completionRate
    } = useDashboardData();

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    const totalValue = projects.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

    return (
        <div className="page-container h-full overflow-y-auto custom-scrollbar relative">
            <div className="relative z-10 space-y-8">
                {/* Modern Condensed Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-2xl border border-border/40 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-1 w-6 bg-primary rounded-full" />
                            <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase">Cockpit Central</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visão Geral</h1>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-xl border border-border/40">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-4 rounded-lg hover:bg-card hover:text-primary hover:shadow-sm transition-all text-[11px] font-bold uppercase tracking-wider gap-2"
                            onClick={() => navigate('/nimbus-ai')}
                        >
                            <TrendingUp className="h-3 w-3" />
                            Insights
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground shadow-sm gap-2 text-[11px] font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all"
                            onClick={() => navigate('/projetos')}
                        >
                            <Plus className="h-3 w-3" />
                            Novo Projeto
                        </Button>
                    </div>
                </header>

                {/* Performance Highlights Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                        label="Ativos"
                        value={projects.length}
                        unit="Projetos"
                        icon={Briefcase}
                        delay={0.1}
                    />
                    <MetricCard
                        label="Progresso"
                        value={`${completionRate}%`}
                        unit="Realizado"
                        icon={CheckSquare}
                        delay={0.2}
                    />
                    <MetricCard
                        label="Clientes"
                        value={uniqueClientsCount}
                        unit="Parceiros"
                        icon={Users}
                        delay={0.3}
                    />
                    <MetricCard
                        label="Faturamento"
                        value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValue)}
                        unit="Previsto"
                        icon={TrendingUp}
                        delay={0.4}
                    />
                </div>

                {/* AI Opportunity Radar */}
                <OpportunityRadar />

                {/* Split Context Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                    {/* Left Side: Delivery Core (Timeline) */}
                    <div className="lg:col-span-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5 text-primary/50" />
                                    Cronograma Operacional
                                </h3>
                                <Badge variant="outline" className="text-[9px] font-bold border-primary/10 bg-primary/5 text-primary/60 px-2 rounded-lg">
                                    Live Sync
                                </Badge>
                            </div>
                            <div className="h-[720px] border border-border/40 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md shadow-sm ring-1 ring-border/5">
                                <TimelineSection />
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Integrated Command Hub */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                            <TrendingUp className="h-3.5 w-3.5 text-primary/50" />
                            Hub de Comando
                        </h3>

                        <div className="flex flex-col gap-6">
                            <FreelancerHealthScore />
                            <DashboardTimerWidget />

                            {/* Integrated Financial Spark - Compact alternative to chart */}
                            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500/60" />
                                        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Fluxo Financeiro</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-500 tabular-nums">+{totalValue > 0 ? '12%' : '0%'}</span>
                                </div>
                                <div className="h-16 flex items-end gap-1 px-1">
                                    {(projects.length > 0 ?
                                        [...projects].reverse().slice(0, 9).map(p => Math.max(20, Math.min(100, (Number(p.value) / (totalValue || 1)) * 200)))
                                        : [25, 25, 25, 25, 25, 25, 25, 25, 25]
                                    ).map((h, i) => (
                                        <div
                                            key={i}
                                            className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-all duration-300"
                                            style={{ height: `${h}%` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface MetricCardProps {
    label: string;
    value: string | number;
    unit: string;
    icon: React.ComponentType<{ className?: string }>;
    delay: number;
}

function MetricCard({ label, value, unit, icon: Icon, delay }: MetricCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group bg-card/40 backdrop-blur-md border border-border/40 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 mb-0.5">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <h4 className="text-lg font-semibold tracking-tight text-foreground/90 truncate">{value}</h4>
                        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase ml-1">{unit}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default Index;
