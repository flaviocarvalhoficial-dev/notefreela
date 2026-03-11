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
    const [isActivitiesOpen, setIsActivitiesOpen] = useState(true);
    const [isTimelineOpen, setIsTimelineOpen] = useState(true);
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

    return (
        <div className="page-container h-full overflow-y-auto custom-scrollbar">
            {/* Standard Header Section - Matching other pages */}
            <header className="flex items-center justify-between gap-4 mb-8 h-12">
                <div>
                    <h1 className="text-2xl font-medium tracking-tight text-foreground">Painel de Controle</h1>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <Button
                        size="sm"
                        className="h-9 px-4 rounded-lg bg-primary text-primary-foreground shadow-sm gap-2"
                        onClick={() => navigate('/projetos')}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Novo Projeto
                    </Button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bento-card p-5 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-muted/10 rounded-xl border border-border/40">
                            <Briefcase className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 bg-muted/5 text-muted-foreground border-border/40">
                            Ativos
                        </Badge>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Projetos</p>
                        <h2 className="text-2xl font-medium tracking-tight tabular-nums text-foreground/90">{projects.length}</h2>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bento-card p-5 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-muted/10 rounded-xl border border-border/40">
                            <CheckSquare className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground/60">{completionRate}%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Tarefas</p>
                        <div className="flex items-end justify-between gap-4">
                            <h2 className="text-2xl font-medium tracking-tight tabular-nums text-foreground/90">{tasksStats?.total || 0}</h2>
                            <Progress value={completionRate} className="h-1.5 flex-1 mb-2 bg-primary/10" />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bento-card p-5 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-muted/10 rounded-xl border border-border/40">
                            <Users className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/20" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Clientes</p>
                        <h2 className="text-2xl font-medium tracking-tight tabular-nums text-foreground/90">{uniqueClientsCount}</h2>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bento-card p-5 flex flex-col justify-between overflow-hidden relative"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-muted/10 rounded-xl border border-border/40">
                            <TrendingUp className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Faturamento Est.</p>
                        <h2 className="text-2xl font-medium tracking-tight tabular-nums mask-value text-foreground/90">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                                projects.reduce((acc, p) => acc + (Number(p.value) || 0), 0)
                            )}
                        </h2>
                    </div>
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timeline - Main Focus */}
                <div className="lg:col-span-2">
                    <Collapsible open={isTimelineOpen} onOpenChange={setIsTimelineOpen} className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <CollapsibleTrigger asChild>
                                <div className="flex items-center gap-3 cursor-pointer group">
                                    <div className="p-1 rounded-md transition-colors">
                                        {isTimelineOpen ? <Minus className="h-3 w-3 text-muted-foreground/40" /> : <Plus className="h-3 w-3 text-muted-foreground/40" />}
                                    </div>
                                    <h3 className="text-lg font-medium tracking-tight text-foreground/90">Cronograma de Entrega</h3>
                                </div>
                            </CollapsibleTrigger>
                        </div>
                        <CollapsibleContent className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
                            <div className="h-[650px] border border-border/60 rounded-xl overflow-hidden shadow-sm">
                                <TimelineSection />
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                </div>

                {/* Right column: Timer + Financial Chart */}
                <div className="lg:col-span-1 flex flex-col pt-11">
                    <div className="flex flex-col gap-4 h-[650px]">
                        <DashboardTimerWidget />
                        <div className="flex-1 min-h-[300px]">
                            <FinancialChart projects={projects} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activities Section */}
            <div className="mt-8 pb-12">
                <Collapsible open={isActivitiesOpen} onOpenChange={setIsActivitiesOpen}>
                    <div className="flex items-center justify-between mb-6">
                        <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 cursor-pointer group">
                                <div className="p-1 rounded-md transition-colors">
                                    {isActivitiesOpen ? <Minus className="h-3 w-3 text-muted-foreground/40" /> : <Plus className="h-3 w-3 text-muted-foreground/40" />}
                                </div>
                                <h3 className="text-lg font-medium tracking-tight text-foreground/90">Atividades Recentes</h3>
                            </div>
                        </CollapsibleTrigger>
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 gap-2" onClick={() => navigate('/atividades')}>
                            <Activity className="h-3 w-3" />
                            Ver todas
                        </Button>
                    </div>
                    <CollapsibleContent className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar bento-card p-0 bg-card/40 backdrop-blur-sm">
                            <Atividades hideHeader={true} />
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        </div>
    );
};

export default Index;
