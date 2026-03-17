import { useState } from "react";
import { motion } from "framer-motion";
import {
    Activity,
    Briefcase,
    CheckCircle2,
    CheckSquare,
    Users,
    FileText,
    TrendingUp,
    ArrowUpRight,
    Search,
    Loader2,
    Plus,
    Minus,
    DollarSign,
    Sparkles
} from "lucide-react";
import { TimelineSection } from "@/components/dashboard/TimelineSection";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { DashboardNotesWidget } from "@/components/dashboard/DashboardNotesWidget";
import { OpportunityRadar } from "@/components/dashboard/OpportunityRadar";
import { FreelancerHealthScore } from "@/components/dashboard/FreelancerHealthScore";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { AIAssistantSidebar } from "@/components/AIAssistantSidebar";

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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/20" />
            </div>
        );
    }

    const totalValue = projects.reduce((acc, p) => acc + (Number(p.value) || 0), 0);

    return (
        <div className="flex h-full w-full overflow-hidden bg-background">
            {/* COLUMN 2: PRINCIPAL OPERATIONAL AREA */}
            <main className="flex-1 h-full overflow-y-auto custom-scrollbar">
                <div className="p-6 lg:p-10 space-y-10 max-w-[1240px] mx-auto">
                    {/* Modern Condensed Header */}
                    <header className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cockpit Estratégico</h1>
                                <p className="text-[11px] text-muted-foreground/60 font-medium lowercase tracking-widest">Dashboards & Business Insights</p>
                            </div>

                            <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-xl self-start">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-4 rounded-lg hover:bg-muted/30 hover:text-foreground transition-all text-[11px] font-medium gap-2"
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
                        </div>

                        {/* High-Level Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Volume de Projetos',
                                    value: projects.length,
                                    desc: 'Demandas em histórico',
                                    icon: Briefcase,
                                },
                                {
                                    label: 'Em Execução',
                                    value: projects.filter(p => p.status === 'active').length,
                                    desc: 'Foco operacional agora',
                                    icon: Activity,
                                },
                                {
                                    label: 'Resultados Gerados',
                                    value: projects.filter(p => p.status === 'completed').length,
                                    desc: 'Projetos finalizados',
                                    icon: CheckCircle2,
                                },
                                {
                                    label: 'Valor sob Gestão',
                                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValue),
                                    desc: 'Volume total em pipeline',
                                    icon: DollarSign,
                                },
                            ].map((card, i) => (
                                <div key={i} className="bg-card/40 backdrop-blur-md p-5 rounded-2xl border-none shadow-card hover:bg-card/60 transition-all group overflow-hidden relative">
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold">{card.label}</p>
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">{card.value}</h3>
                                            <p className="text-[10px] text-muted-foreground/50">{card.desc}</p>
                                        </div>
                                        <div className="p-2 rounded-xl bg-muted/20 group-hover:bg-muted/40 transition-colors">
                                            <card.icon className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors" />
                                        </div>
                                    </div>
                                    {/* Subtle curve background decoration */}
                                    <svg className="absolute -bottom-2 -right-2 w-16 h-16 opacity-[0.03] text-foreground pointer-events-none" viewBox="0 0 100 100">
                                        <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </header>

                    {/* Main Operational Area Grid */}
                    <div className="grid grid-cols-1 gap-8">
                        {/* 1. Cockpit Summary is already in the header */}

                        {/* 2. Cronograma Operacional */}
                        <div className="flex flex-col h-[500px]">
                            <div className="flex items-center gap-2 px-1 mb-3">
                                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/40" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Cronograma Operacional</h3>
                            </div>
                            <div className="flex-1 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md shadow-card border-none">
                                <TimelineSection />
                            </div>
                        </div>

                        {/* 3. Radar de Oportunidades */}
                        <div className="flex flex-col pb-10">
                            <div className="flex items-center gap-2 px-1 mb-3">
                                <Sparkles className="h-3.5 w-3.5 text-muted-foreground/40" />
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Radar de Oportunidades</h3>
                            </div>
                            <div className="rounded-2xl overflow-hidden bg-card/30 backdrop-blur-md shadow-card border-none p-4">
                                <OpportunityRadar />
                            </div>
                        </div>

                        {/* Recent Transactions / Metrics if needed in future */}
                    </div>
                </div>
            </main>

            {/* COLUMN 3: CONTROL PANEL (Fixed Aside) */}
            <aside className="w-[380px] h-full border-l border-border/40 bg-card/5 backdrop-blur-sm flex flex-col overflow-hidden hidden xl:flex">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {/* Business Health Widget */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <Activity className="h-3.5 w-3.5 text-muted-foreground/40" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Saúde do Negócio</h3>
                        </div>
                        <div className="bg-card/40 backdrop-blur-md p-6 rounded-2xl shadow-card border-none">
                            <FreelancerHealthScore />
                        </div>
                    </section>

                    {/* Quick Notes Widget */}
                    <section className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground/40" />
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Notas Rápidas</h3>
                        </div>
                        <div className="bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-card border-none h-[420px]">
                            <DashboardNotesWidget />
                        </div>
                    </section>

                    {/* Footer / Meta Info inside Aside */}
                    <div className="pt-6 border-t border-border/40">
                        <p className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-[0.2em] font-medium">
                            Nimbus Operating System
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default Index;
