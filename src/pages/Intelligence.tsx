import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LineChart,
    BarChart3,
    PieChart,
    Activity,
    TrendingUp,
    Users,
    Zap,
    Clock,
    DollarSign,
    Target,
    Shield,
    Sparkles,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Layers,
    BrainCircuit,
    Gauge,
    HandCoins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Intelligence = () => {
    const [activeTab, setActiveTab] = useState<"insights" | "capacity" | "rentabilidade">("insights");

    const tabs = [
        { id: "insights", label: "Insights Operacionais", icon: BrainCircuit },
        { id: "capacity", label: "Capacidade & Carga", icon: Gauge },
        { id: "rentabilidade", label: "Rentabilidade", icon: HandCoins },
    ];

    return (
        <div className="page-container relative overflow-hidden h-screen flex flex-col">
            {/* Blueprint Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10 shrink-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase">Nimbus Intelligence</span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Centro de Inteligência</h1>
                    <p className="text-muted-foreground font-normal text-sm max-w-md">Análise estratégica de performance, lucro e capacidade produtiva.</p>
                </div>

                <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/50 self-start md:self-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-card text-foreground shadow-sm border border-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                            )}
                        >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 -mx-2 px-2 pb-12">
                <AnimatePresence mode="wait">
                    {activeTab === "insights" && <InsightsContent key="insights" />}
                    {activeTab === "capacity" && <CapacityContent key="capacity" />}
                    {activeTab === "rentabilidade" && <RentabilidadeContent key="rentabilidade" />}
                </AnimatePresence>
            </div>
        </div>
    );
};

/* --- SUB-COMPONENTS --- */

function InsightsContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Score de Operação"
                    value="84"
                    trend="+5%"
                    isUp={true}
                    icon={Shield}
                    subtitle="Saúde geral do negócio"
                />
                <StatCard
                    title="Volume de Demandas"
                    value="24"
                    trend="-2"
                    isUp={false}
                    icon={Layers}
                    subtitle="Tarefas ativas no pipeline"
                />
                <StatCard
                    title="Conversão Lead"
                    value="18%"
                    trend="+3%"
                    isUp={true}
                    icon={Target}
                    subtitle="Taxa de fechamento"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bento-card p-6 min-h-[400px]">
                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Gargalos Operacionais
                    </h3>
                    <div className="space-y-6">
                        <BottleneckItem
                            label="Revisões de Design"
                            delay="2.4 dias"
                            impact="Médio"
                            progress={75}
                            color="bg-amber-500"
                        />
                        <BottleneckItem
                            label="Aprovação de Briefing"
                            delay="4.1 dias"
                            impact="Alto"
                            progress={92}
                            color="bg-rose-500"
                        />
                        <BottleneckItem
                            label="Desenvolvimento"
                            delay="1.2 dias"
                            impact="Baixo"
                            progress={30}
                            color="bg-emerald-500"
                        />
                    </div>

                    <div className="mt-12 p-4 bg-primary/5 border border-primary/10 rounded-xl flex gap-4">
                        <Sparkles className="h-5 w-5 text-primary shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Nimbus AI Advisor</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Identificamos que a etapa de **Aprovação de Briefing** está atrasando seus projetos em média 4 dias. Sugestão: Implementar o formulário de captura automatizado para reduzir o tempo de feedback.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bento-card p-6">
                    <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        Performance por Cliente
                    </h3>
                    <div className="space-y-4">
                        {[
                            { name: "Tech Flow Inc.", efficiency: 95, projects: 4, score: "A+" },
                            { name: "Galeria Arte", efficiency: 72, projects: 2, score: "B" },
                            { name: "Restaurante Sabor", efficiency: 45, projects: 1, score: "D" },
                            { name: "Studio Criativo", efficiency: 88, projects: 3, score: "A" },
                        ].map((client) => (
                            <div key={client.name} className="flex items-center justify-between p-3 bg-muted/20 border border-border/40 rounded-xl hover:bg-muted/30 transition-all cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center font-bold text-xs text-primary shadow-sm border border-border/50">
                                        {client.score}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">{client.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-40">{client.projects} Projetos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold tabular-nums text-foreground">{client.efficiency}%</p>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-40">Eficiência</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function CapacityContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card p-8 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8 text-center pt-2">Carga de Trabalho Atual</h3>
                    <div className="relative h-48 w-48 flex items-center justify-center mb-8">
                        <svg className="h-full w-full rotate-[-90deg]">
                            <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/10" />
                            <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={502} strokeDashoffset={502 - (502 * 72) / 100} className="text-primary transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold tracking-tighter text-foreground tabular-nums">72%</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground -mt-1">Em Uso</span>
                        </div>
                    </div>
                    <div className="flex gap-8">
                        <div className="text-center">
                            <p className="text-xl font-bold text-foreground">28.5h</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Horas Alocadas</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-foreground">11.5h</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Disponíveis</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bento-card p-6">
                        <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            Distribuição Semanal
                        </h3>
                        <div className="h-40 flex items-end justify-between gap-2 px-2">
                            {[45, 65, 85, 92, 40, 0, 0].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-full bg-primary/5 rounded-t-lg relative overflow-hidden group h-32 flex flex-col justify-end">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            className={cn("w-full transition-all group-hover:opacity-80", h > 80 ? "bg-rose-500" : "bg-primary")}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{['S', 'T', 'Q', 'Q', 'S', 'S', 'D'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bento-card p-6 bg-rose-500/5 border-rose-500/10">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5" />
                            Alerta de Saturação
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Seu volume de trabalho para **Quinta e Sexta-feira** excede sua capacidade diária de 8 horas. Recomendamos reorganizar as tarefas não críticas ou estender o prazo do projeto "Web Dev - Galeria".
                        </p>
                        <Button variant="outline" size="sm" className="mt-4 h-8 text-[10px] font-bold border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all uppercase px-4">
                            Sugerir Nova Agenda
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function RentabilidadeContent() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Ticket Médio"
                    value="R$ 4.250"
                    trend="+12%"
                    isUp={true}
                    icon={HandCoins}
                    subtitle="Valor por novo projeto"
                />
                <StatCard
                    title="Margem de Lucro"
                    value="64%"
                    trend="-2%"
                    isUp={false}
                    icon={TrendingUp}
                    subtitle="Considerando ferramentas"
                />
                <StatCard
                    title="LTV Estimado"
                    value="R$ 18.4k"
                    trend="+R$ 1.2k"
                    isUp={true}
                    icon={DollarSign}
                    subtitle="Valor vitalício por cliente"
                />
            </div>

            <div className="bento-card p-0 overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-muted/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Rentabilidade por Categoria de Serviço
                    </h3>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest border-border bg-card">Analítico</Badge>
                </div>
                <div className="p-6">
                    <div className="space-y-8">
                        <ServiceRevenueItem
                            label="Identidade Visual"
                            revenue={12500}
                            profit={9200}
                            margin={73}
                        />
                        <ServiceRevenueItem
                            label="Web Design / UI"
                            revenue={28400}
                            profit={15600}
                            margin={55}
                        />
                        <ServiceRevenueItem
                            label="Consultoria Estratégica"
                            revenue={8500}
                            profit={7800}
                            margin={91}
                        />
                        <ServiceRevenueItem
                            label="Social Media Mensal"
                            revenue={4200}
                            profit={1400}
                            margin={33}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* --- HELPERS --- */

function StatCard({ title, value, trend, isUp, icon: Icon, subtitle }: any) {
    return (
        <div className="bento-card p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-muted/10 rounded-xl border border-border/40">
                    <Icon className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <Badge variant="outline" className={cn(
                    "px-1.5 py-0 h-5 text-[9px] font-bold border-none transition-colors",
                    isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                )}>
                    {isUp ? <ArrowUpRight className="h-2.5 w-2.5 mr-1" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-1" />}
                    {trend}
                </Badge>
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-50">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h2 className="text-2xl font-semibold tracking-tight tabular-nums text-foreground/90">{value}</h2>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">{subtitle}</p>
            </div>
        </div>
    );
}

function BottleneckItem({ label, delay, impact, progress, color }: any) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    <span className="text-[10px] text-muted-foreground ml-3 uppercase font-bold tracking-widest opacity-40">Atraso: {delay}</span>
                </div>
                <Badge variant="outline" className={cn(
                    "text-[9px] font-bold uppercase tracking-tight py-0 border-none",
                    impact === "Alto" ? "text-rose-500" : impact === "Médio" ? "text-amber-500" : "text-emerald-500"
                )}>
                    Impacto {impact}
                </Badge>
            </div>
            <Progress value={progress} className="h-1 bg-muted/20">
                <div className={cn("h-full transition-all duration-500", color)} style={{ width: `${progress}%` }} />
            </Progress>
        </div>
    );
}

function ServiceRevenueItem({ label, revenue, profit, margin }: any) {
    return (
        <div className="group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums">Receita: R$ {revenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-bold text-foreground">R$ {profit.toLocaleString('pt-BR')}</span>
                        <Badge className={cn(
                            "px-1.5 py-0 h-4 text-[9px] font-bold border-none",
                            margin > 60 ? "bg-emerald-500 text-white" : margin > 40 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                        )}>
                            {margin}%
                        </Badge>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-40">Lucro Líquido</span>
                </div>
            </div>
            <Progress value={margin} className="h-1 bg-muted/20">
                <div className={cn(
                    "h-full transition-all duration-500",
                    margin > 60 ? "bg-emerald-500" : margin > 40 ? "bg-amber-500" : "bg-rose-500"
                )} style={{ width: `${margin}%` }} />
            </Progress>
        </div>
    );
}

export default Intelligence;
