import { motion } from "framer-motion";
import {
    Activity,
    Briefcase,
    CheckSquare,
    Users,
    TrendingUp,
    ArrowUpRight,
    Search,
    Loader2
} from "lucide-react";
import { TimelineSection } from "@/components/dashboard/TimelineSection";
import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

    return (
        <div className="page-container h-full overflow-y-auto no-scrollbar">
            {/* Standard Header Section - Matching other pages */}
            <header className="heading-container">
                <div className="flex items-center gap-3">
                    <div className="h-1 w-6 bg-primary rounded-full" />
                    <span className="text-[10px] font-medium tracking-tight text-primary">Workspace / Dashboard</span>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-medium tracking-tight text-foreground">Painel de Controle</h1>
                        <p className="text-muted-foreground font-normal text-sm leading-relaxed">Visão consolidada da sua operação freelancer</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 rounded-lg bg-card shadow-sm gap-2"
                            onClick={() => navigate('/atividades')}
                        >
                            <Activity className="h-3.5 w-3.5" />
                            Histórico
                        </Button>
                        <Button
                            size="sm"
                            className="h-9 px-4 rounded-lg bg-primary text-primary-foreground shadow-sm gap-2"
                            onClick={() => navigate('/projetos')}
                        >
                            <Briefcase className="h-3.5 w-3.5" />
                            Novo Projeto
                        </Button>
                    </div>
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
                        <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                            <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-5 bg-primary/5 text-primary border-none">
                            Ativos
                        </Badge>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Projetos</p>
                        <h2 className="text-2xl font-semibold tracking-tight tabular-nums">{projects.length}</h2>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bento-card p-5 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-500/5 rounded-xl border border-purple-500/10">
                            <CheckSquare className="h-4 w-4 text-purple-500" />
                        </div>
                        <span className="text-[10px] font-medium text-purple-600">{completionRate}%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Tarefas</p>
                        <div className="flex items-end justify-between gap-4">
                            <h2 className="text-2xl font-semibold tracking-tight tabular-nums">{tasksStats?.total || 0}</h2>
                            <Progress value={completionRate} className="h-1.5 flex-1 mb-2 bg-purple-500/10" />
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
                        <div className="p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                            <Users className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Clientes</p>
                        <h2 className="text-2xl font-semibold tracking-tight tabular-nums">{uniqueClientsCount}</h2>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bento-card p-5 flex flex-col justify-between overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5">
                        <TrendingUp className="h-24 w-24 text-primary" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Faturamento Est.</p>
                        <h2 className="text-2xl font-semibold tracking-tight tabular-nums">
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
                <div className="lg:col-span-2 h-[500px]">
                    <TimelineSection />
                </div>

                {/* Financial Chart */}
                <div className="lg:col-span-1 h-[500px] pt-[60px]">
                    <FinancialChart projects={projects} />
                </div>
            </div>

            {/* Recent Activities Section */}
            <div className="mt-8 pb-12">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-4 bg-primary/40 rounded-full" />
                        <h3 className="text-lg font-semibold tracking-tight">Atividades Recentes</h3>
                    </div>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-7 gap-2" onClick={() => navigate('/atividades')}>
                        <Activity className="h-3 w-3" />
                        Ver todas
                    </Button>
                </div>
                <div className="min-h-[200px]">
                    <Atividades hideHeader={true} />
                </div>
            </div>
        </div>
    );
};

export default Index;
