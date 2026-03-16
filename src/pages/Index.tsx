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
import { MetricBar } from "@/components/dashboard/MetricBar";
import { FreelancerHealthScore } from "@/components/dashboard/FreelancerHealthScore";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import Atividades from "./Atividades";
import FinancialMetric from "@/components/ui/FinancialMetric";

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
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-2xl shadow-card">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Visão Geral</h1>
                        <p className="text-[11px] text-muted-foreground/60 font-medium">Dashboards & Insights</p>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-4 rounded-lg hover:bg-card hover:text-primary transition-all text-[11px] font-medium gap-2"
                            onClick={() => navigate('/nimbus-ai')}
                        >
                            <TrendingUp className="h-3 w-3" />
                            Insights
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground gap-2 text-[11px] font-medium hover:shadow-glow-sm transition-all"
                            onClick={() => navigate('/projetos')}
                        >
                            <Plus className="h-3 w-3" />
                            Novo Projeto
                        </Button>
                    </div>
                </header>

                {/* Performance Highlights Bar - Consolidated */}
                <MetricBar
                    projectsCount={projects.length}
                    completionRate={completionRate}
                    clientsCount={uniqueClientsCount}
                    totalValue={totalValue}
                />

                {/* Seção Superior: Cronograma Operacional (100% Width) */}
                <div className="flex flex-col h-[40vh]">
                    <div className="flex-1 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md shadow-sm">
                        <TimelineSection />
                    </div>
                </div>

                {/* Seção Estratégica: Inteligência & Performance (Grid 8/4) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Coluna Principal: Radar de Oportunidades (8 cols) */}
                    <div className="lg:col-span-8">
                        <OpportunityRadar />
                    </div>

                    {/* Coluna Lateral: Cockpit de Controle (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <FreelancerHealthScore />
                        <DashboardTimerWidget />

                        {/* Integrated Financial Spark */}
                        <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-3.5 w-3.5 text-emerald-500/40" />
                                    <h3 className="text-[11px] font-medium text-muted-foreground/60">Fluxo Financeiro</h3>
                                </div>
                                <span className="text-[10px] font-medium text-emerald-500 tabular-nums">+{totalValue > 0 ? '12%' : '0%'}</span>
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
    );
};



export default Index;
