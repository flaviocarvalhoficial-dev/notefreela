import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    DollarSign,
    TrendingUp,
    CreditCard,
    Clock,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    Briefcase,
    BadgePercent,
    ChevronDown,
    List,
    TrendingDown,
    Wallet
} from "lucide-react";
import { CostRegistrationDialog } from "@/components/dashboard/CostRegistrationDialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { FinancialChart } from "@/components/dashboard/FinancialChart";
import { CostsBreakdownModal } from "@/components/dashboard/CostsBreakdownModal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { FinancialReportsModal } from "@/components/dashboard/FinancialReportsModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Project {
    id: string;
    name: string;
    value: number;
    advance_payment: number;
    client_name: string;
    status: string;
    deadline: string | null;
    created_at: string;
    services?: { name: string; price: number }[];
}

export default function Financeiro() {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [isCostsModalOpen, setIsCostsModalOpen] = useState(false);
    const [isDetailedStatsOpen, setIsDetailedStatsOpen] = useState(false);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [activeStatDetail, setActiveStatDetail] = useState<string | null>(null);

    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const { data: projects = [], isLoading } = useQuery({
        queryKey: ["finance_projects"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return (data as any) as Project[];
        }
    });

    const monthOptions = useMemo(() => {
        const months = new Set<string>();
        months.add(new Date().toISOString().substring(0, 7));

        projects.forEach(p => {
            if (p.created_at) months.add(p.created_at.substring(0, 7));
            if (p.deadline) months.add(p.deadline.substring(0, 7));
        });

        return Array.from(months).sort().reverse().map(m => {
            const [year, month] = m.split("-");
            const date = new Date(parseInt(year), parseInt(month) - 1);
            return {
                value: m,
                label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
            };
        });
    }, [projects]);

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            const remaining = (p.value || 0) - (p.advance_payment || 0);
            const isPaid = remaining <= 0 && (p.value || 0) > 0;
            const hasAdvance = (p.advance_payment || 0) > 0;
            const payStatus = isPaid ? "paid" : hasAdvance ? "partial" : "pending";

            const matchesSearch = (p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.client_name?.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesStatus = statusFilter === "all" || payStatus === statusFilter;

            const projectMonth = p.created_at ? p.created_at.substring(0, 7) : "";
            const deadlineMonth = p.deadline ? p.deadline.substring(0, 7) : "";
            const matchesMonth = selectedMonth === "all" || projectMonth === selectedMonth || deadlineMonth === selectedMonth;

            return matchesSearch && matchesStatus && matchesMonth;
        });
    }, [projects, searchQuery, statusFilter, selectedMonth]);

    const stats = useMemo(() => {
        let gains = 0;
        let future = 0;
        let total = 0;

        filteredProjects.forEach(p => {
            const projectMonth = (p.created_at || "").substring(0, 7);
            const deadlineMonth = (p.deadline || "").substring(0, 7);

            if (selectedMonth === "all") {
                gains += (p.advance_payment || 0);
                future += Math.max(0, (p.value || 0) - (p.advance_payment || 0));
                total += (p.value || 0);
            } else {
                if (projectMonth === selectedMonth) {
                    gains += (p.advance_payment || 0);
                }
                if (deadlineMonth === selectedMonth) {
                    future += Math.max(0, (p.value || 0) - (p.advance_payment || 0));
                }
                total = gains + future;
            }
        });

        return {
            totalValue: total,
            totalPaid: gains,
            totalRemaining: future,
            projects: filteredProjects,
            projectCount: filteredProjects.length
        };
    }, [filteredProjects, selectedMonth]);

    const { data: costStats } = useQuery({
        queryKey: ["finance_costs"],
        queryFn: async () => {
            const { data } = await (supabase as any).from("project_costs").select("amount");
            const totalCosts = data?.reduce((acc: number, curr: any) => acc + Number(curr.amount), 0) || 0;
            return { totalCosts };
        }
    });

    const totalCosts = costStats?.totalCosts || 0;
    const netProfit = (stats?.totalPaid || 0) - totalCosts;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-32 max-w-full overflow-x-hidden">
            {/* Header - Cockpit Style */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-border/40">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-1 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Fluxo de Caixa</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Gestão de Capital</h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1">Visão estratégica de liquidez e projeção de diretrizes financeiras.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-11 gap-2 text-xs font-bold rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all active:scale-95 px-6"
                        onClick={() => setIsReportsModalOpen(true)}
                    >
                        <TrendingUp className="h-4 w-4" />
                        Relatórios Mensais
                    </Button>
                    <CostRegistrationDialog
                        trigger={
                            <Button variant="outline" className="h-11 border-red-500/20 text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-2 text-xs font-bold rounded-xl px-6">
                                <TrendingDown className="h-4 w-4" /> Registrar Custo
                            </Button>
                        }
                    />
                </div>
            </div>

            {/* Metáfora Visual: Fluxo Financeiro Arthur Marques */}
            <div className="relative w-full h-32 bg-card border border-border rounded-[24px] overflow-hidden group shadow-[var(--shadow-card)]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 relative z-10">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Saldo em Fluxo</span>
                        <div className="text-3xl font-black tabular-nums text-foreground">{formatCurrency(netProfit)}</div>
                    </div>

                    <svg width="100%" height="100%" viewBox="0 0 600 120" fill="none" className="absolute pointer-events-none opacity-20">
                        {/* Converging Flows */}
                        <path d="M50 60C150 60 200 20 300 60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-emerald-500/40" />
                        <path d="M550 60C450 60 400 100 300 60" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-red-500/40" />

                        {/* Central Pulse */}
                        <motion.circle
                            cx="300" cy="60" r="8"
                            stroke="hsl(var(--primary))" strokeWidth="2"
                            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <circle cx="300" cy="60" r="4" fill="hsl(var(--primary))" />

                        {/* Moving Nodes */}
                        <motion.circle r="3" fill="currentColor" className="text-emerald-500"
                            animate={{ offsetDistance: ["0%", "100%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            style={{ offsetPath: "path('M50 60C150 60 200 20 300 60')" }}
                        />
                        <motion.circle r="3" fill="currentColor" className="text-red-500"
                            animate={{ offsetDistance: ["0%", "100%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
                            style={{ offsetPath: "path('M550 60C450 60 400 100 300 60')" }}
                        />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/10 p-5 rounded-2xl border border-border/40">
                <div className="flex flex-1 flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[280px]">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                        <input
                            type="text"
                            placeholder="Mapear projeto ou parceiro..."
                            className="w-full bg-background border border-border/40 rounded-xl h-11 pl-12 pr-4 text-sm font-medium focus:border-primary/40 focus:ring-1 focus:ring-primary/10 outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-11 w-[180px] rounded-xl border-border/40 font-bold text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Linha do Tempo</SelectItem>
                            <SelectItem value="paid">Quitados</SelectItem>
                            <SelectItem value="partial">Aporte Inicial</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-11 w-[200px] rounded-xl border-border/40 font-bold text-xs">
                            <Calendar className="mr-2 h-4 w-4 text-primary/40" />
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Filtro Temporal Off</SelectItem>
                            {monthOptions.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setSelectedMonth("all");
                        }}
                        className="h-11 text-xs font-black uppercase tracking-widest text-muted-foreground px-4 hover:bg-muted/40 rounded-xl"
                    >
                        Resetar
                    </Button>
                    <Button className="h-11 bg-foreground text-background hover:opacity-90 gap-2 text-xs font-black uppercase tracking-widest rounded-xl px-6 transition-all active:scale-95 shadow-lg">
                        <Download className="h-4 w-4" /> Exportar .CSV
                    </Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { id: 'income', label: "Injeção de Capital", value: formatCurrency(stats?.totalPaid || 0), icon: ArrowUpRight, color: "hsl(var(--primary))", bg: "bg-primary/5" },
                    { id: 'costs', label: "Dreno Operacional", value: formatCurrency(totalCosts), icon: TrendingDown, color: "#ef4444", bg: "bg-red-500/5" },
                    { id: 'profit', label: "Superávit Real", value: formatCurrency(netProfit), icon: Wallet, color: netProfit >= 0 ? "hsl(var(--primary))" : "#ef4444", bg: netProfit >= 0 ? "bg-primary/5" : "bg-red-500/5" },
                    { id: 'future', label: "Orizonte de Crédito", value: formatCurrency(stats?.totalRemaining || 0), icon: Clock, color: "hsl(var(--muted-foreground))", bg: "bg-muted/20" }
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -4, boxShadow: "var(--shadow-hover)" }}
                        onClick={() => {
                            if (kpi.id === 'costs') {
                                setIsCostsModalOpen(true);
                            } else {
                                setActiveStatDetail(kpi.id);
                                setIsDetailedStatsOpen(true);
                            }
                        }}
                        className="relative p-6 rounded-[24px] border border-border bg-card shadow-[var(--shadow-card)] group cursor-pointer overflow-hidden transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className={cn("p-3 rounded-xl border border-border/10 group-hover:scale-110 transition-transform duration-300", kpi.bg)}>
                                <kpi.icon className="h-5 w-5" style={{ color: kpi.color }} />
                            </div>
                            <span className="text-[9px] font-black text-muted-foreground/20 uppercase tracking-widest">Live Feed</span>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-black tabular-nums tracking-tight text-foreground">{kpi.value}</h3>
                        </div>

                        {/* Subtle Glow */}
                        <div className="absolute -bottom-6 -right-6 w-16 h-16 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity rounded-full" style={{ backgroundColor: kpi.color }} />
                    </motion.div>
                ))}
            </div>

            {/* Financial Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                <FinancialChart projects={stats?.projects || []} />
            </motion.div>

            {/* Projects Financial Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card overflow-hidden"
            >
                <div className="p-6 border-b border-border/40 flex items-center justify-between bg-muted/5">
                    <div className="flex items-center gap-2">
                        <List className="h-4 w-4 text-primary/60" />
                        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground/80">Status de Pagamentos</h2>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-background border-border font-medium">
                        {stats?.projectCount} Projetos
                    </Badge>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/10 text-left border-b border-border/60">
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Projeto / Cliente</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Valor Total</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Entrada / Pago</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px]">Restante</th>
                                <th className="p-4 font-medium text-muted-foreground/60 text-[10px] text-center">Status Pagto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.projects.map((p, i) => {
                                const remaining = (p.value || 0) - (p.advance_payment || 0);
                                const isPaid = remaining <= 0 && (p.value || 0) > 0;
                                const hasAdvance = (p.advance_payment || 0) > 0;

                                return (
                                    <React.Fragment key={p.id}>
                                        <tr
                                            className={cn(
                                                "group hover:bg-muted/10 transition-colors border-b border-border/5",
                                                expandedRows.includes(p.id) ? "bg-primary/5" : (i % 2 === 0 ? "bg-transparent" : "bg-muted/5")
                                            )}
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {p.services && p.services.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleRow(p.id)}
                                                            className={cn(
                                                                "h-6 w-6 rounded-md transition-transform flex-shrink-0",
                                                                expandedRows.includes(p.id) && "rotate-90 text-primary"
                                                            )}
                                                        >
                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                    <div className="flex flex-col flex-1 min-w-0 cursor-pointer" onClick={() => toggleRow(p.id)}>
                                                        <span className="font-semibold text-foreground truncate max-w-[180px]">{p.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{p.client_name || "Sem cliente"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-foreground/80">
                                                {formatCurrency(p.value || 0)}
                                            </td>
                                            <td className="p-4 font-medium text-emerald-500/90">
                                                {formatCurrency(p.advance_payment || 0)}
                                            </td>
                                            <td className="p-4 font-medium text-amber-500/90">
                                                {formatCurrency(remaining)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[9px] font-semibold border-none",
                                                        isPaid ? "bg-emerald-500/10 text-emerald-600" :
                                                            hasAdvance ? "bg-blue-500/10 text-blue-600" :
                                                                "bg-amber-500/10 text-amber-600"
                                                    )}
                                                >
                                                    {isPaid ? "Quitado" : hasAdvance ? "Entrada Paga" : "Pendente"}
                                                </Badge>
                                            </td>
                                        </tr>
                                        <AnimatePresence>
                                            {expandedRows.includes(p.id) && p.services && (
                                                <tr className="bg-muted/10 border-b border-border/5">
                                                    <td colSpan={5} className="p-0">
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-primary/[0.02]"
                                                        >
                                                            <div className="px-14 py-3 space-y-2">
                                                                <div className="grid grid-cols-2 gap-4 pb-1 border-b border-border/10 text-[10px] font-medium text-muted-foreground/60">
                                                                    <span>Serviço</span>
                                                                    <span className="text-right">Valor</span>
                                                                </div>
                                                                {p.services.map((svc, idx) => (
                                                                    <div key={idx} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border/5 last:border-0 hover:bg-primary/5 transition-colors rounded-sm px-1">
                                                                        <span className="text-muted-foreground font-medium">{svc.name}</span>
                                                                        <span className="text-right font-semibold text-foreground/60">{formatCurrency(svc.price)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                            {stats?.projects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                                        Nenhum registro financeiro encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Summary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="linear-card p-6"
                >
                    <h2 className="heading-2 mb-6">Eficiência de Faturamento</h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-medium">
                                <span className="text-muted-foreground">Liquidez Geral (Recebido / Total)</span>
                                <span className="text-primary">
                                    {stats?.totalValue ? Math.round((stats.totalPaid / stats.totalValue) * 100) : 0}%
                                </span>
                            </div>
                            <Progress
                                value={stats?.totalValue ? (stats.totalPaid / stats.totalValue) * 100 : 0}
                                className="h-1.5 bg-secondary"
                            />
                        </div>
                        <div className="p-3 bg-muted/30 rounded-md border border-border/40">
                            <p className="text-[11px] text-muted-foreground flex items-start gap-2 italic">
                                <BadgePercent className="h-3.5 w-3.5 mt-0.5 text-primary/60" />
                                <span>Dica: Tente manter a liquidez acima de 40% solicitando uma entrada maior em novos projetos.</span>
                            </p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="linear-card p-8 flex flex-col justify-center items-center text-center gap-4 bg-muted/5 group"
                >
                    <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 transition-all group-hover:scale-110 group-hover:rotate-6">
                        <TrendingUp className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Crescimento de Caixa</h3>
                        <p className="body-text text-muted-foreground max-w-[280px]">
                            Seus projetos atuais garantem uma projeção de <span className="text-foreground font-semibold">{formatCurrency(stats?.totalRemaining || 0)}</span> para recebimento futuro.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 text-xs border-border/60 hover:bg-background">
                        Ver projeção detalhada
                    </Button>
                </motion.div>
            </div>

            <CostsBreakdownModal
                open={isCostsModalOpen}
                onOpenChange={setIsCostsModalOpen}
            />

            <FinancialReportsModal
                open={isReportsModalOpen}
                onOpenChange={setIsReportsModalOpen}
            />

            <Dialog open={isDetailedStatsOpen} onOpenChange={setIsDetailedStatsOpen}>
                <DialogContent className="max-w-xl border-border/40 bg-sidebar/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>
                            {activeStatDetail === 'income' && "Detalhamento de Entradas"}
                            {activeStatDetail === 'profit' && "Visão de Lucratividade"}
                            {activeStatDetail === 'future' && "Projeção de Recebíveis"}
                        </DialogTitle>
                        <DialogDescription>
                            Análise por projeto baseada nos filtros atuais.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {stats.projects.map(p => {
                            const val = activeStatDetail === 'income' ? p.advance_payment :
                                activeStatDetail === 'future' ? ((p.value || 0) - (p.advance_payment || 0)) :
                                    0;

                            if (activeStatDetail === 'profit') {
                                return (
                                    <div key={p.id} className="p-3 rounded-lg bg-muted/5 border border-border/20 flex items-center justify-between">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{p.client_name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-foreground">{formatCurrency(p.value || 0)}</p>
                                            <p className="text-[9px] text-emerald-500">Vol. Financeiro</p>
                                        </div>
                                    </div>
                                );
                            }

                            if (val <= 0 && activeStatDetail === 'future') return null;

                            return (
                                <div key={p.id} className="p-3 rounded-lg bg-muted/5 border border-border/20 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{p.client_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={cn(
                                            "text-sm font-bold tabular-nums",
                                            activeStatDetail === 'future' ? "text-amber-500" : "text-emerald-500"
                                        )}>
                                            {formatCurrency(val || 0)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {activeStatDetail === 'income' ? "Valor Pago" : "Saldo Pendente"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import * as React from "react";
