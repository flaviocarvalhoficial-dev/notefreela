import { useState } from "react";
import { motion } from "framer-motion";
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
    List
} from "lucide-react";
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

import {
    AnimatePresence
} from "framer-motion";

interface Project {
    id: string;
    name: string;
    value: number;
    advance_payment: number;
    client_name: string;
    status: string;
    services?: { name: string; price: number }[];
}

export default function Financeiro() {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);

    const toggleRow = (id: string) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const { data: stats, isLoading } = useQuery({
        queryKey: ["finance_stats"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            const projects = (data as any) as Project[];

            const totalValue = projects.reduce((acc, p) => acc + (p.value || 0), 0);
            const totalPaid = projects.reduce((acc, p) => acc + (p.advance_payment || 0), 0);
            const totalRemaining = totalValue - totalPaid;

            return {
                totalValue,
                totalPaid,
                totalRemaining,
                projects: projects || [],
                projectCount: projects?.length || 0,
                completedCount: projects?.filter(p => p.status === 'completed').length || 0
            };
        }
    });

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
            </div>
        );
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-1">Financeiro</h1>
                    <p className="text-muted-foreground text-sm">Gestão de pagamentos e fluxo de caixa por projeto</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="glass-light border-border/50 gap-2 text-xs">
                        <Filter className="h-3.5 w-3.5" /> Filtros
                    </Button>
                    <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 gap-2 text-xs font-bold">
                        <Download className="h-3.5 w-3.5" /> Relatório Financeiro
                    </Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { label: "Valor Total Contratado", value: formatCurrency(stats?.totalValue || 0), icon: Briefcase, color: "hsl(212, 52%, 52%)" },
                    { label: "Total Recebido (Entradas)", value: formatCurrency(stats?.totalPaid || 0), icon: DollarSign, color: "hsl(158, 64%, 52%)" },
                    { label: "Total à Receber", value: formatCurrency(stats?.totalRemaining || 0), icon: Clock, color: "hsl(340, 75%, 60%)" }
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bento-card p-6 flex items-center gap-6"
                    >
                        <div className="p-4 rounded-2xl glass-light" style={{ boxShadow: `0 0 20px ${kpi.color}10` }}>
                            <kpi.icon className="h-6 w-6" style={{ color: kpi.color }} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{kpi.label}</p>
                            <h3 className="text-2xl font-bold tabular-nums">{kpi.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Projects Financial Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card overflow-hidden"
            >
                <div className="p-6 border-b border-border/40 flex items-center justify-between">
                    <h2 className="text-lg font-semibold tracking-tight">Status de Pagamentos</h2>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {stats?.projectCount} Projetos Listados
                    </Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-muted/30 text-left border-b border-border/40">
                                <th className="p-4 font-bold text-muted-foreground/70 uppercase text-[10px] tracking-widest">Projeto / Cliente</th>
                                <th className="p-4 font-bold text-muted-foreground/70 uppercase text-[10px] tracking-widest">Valor Total</th>
                                <th className="p-4 font-bold text-muted-foreground/70 uppercase text-[10px] tracking-widest">Entrada / Pago</th>
                                <th className="p-4 font-bold text-muted-foreground/70 uppercase text-[10px] tracking-widest">Restante</th>
                                <th className="p-4 font-bold text-muted-foreground/70 uppercase text-[10px] tracking-widest text-center">Status Pagto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.projects.map((p, i) => {
                                const remaining = (p.value || 0) - (p.advance_payment || 0);
                                const isPaid = remaining <= 0 && (p.value || 0) > 0;
                                const hasAdvance = (p.advance_payment || 0) > 0;

                                return (
                                    <>
                                        <tr
                                            key={p.id}
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
                                                        <span className="font-bold text-foreground truncate max-w-[180px]">{p.name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{p.client_name || "Sem cliente"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-semibold text-foreground/80">
                                                {formatCurrency(p.value || 0)}
                                            </td>
                                            <td className="p-4 font-semibold text-emerald-500">
                                                {formatCurrency(p.advance_payment || 0)}
                                            </td>
                                            <td className="p-4 font-semibold text-amber-500">
                                                {formatCurrency(remaining)}
                                            </td>
                                            <td className="p-4 text-center">
                                                <Badge
                                                    className={cn(
                                                        "text-[9px] font-bold uppercase tracking-widest",
                                                        isPaid ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                                            hasAdvance ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                                                                "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                                    )}
                                                >
                                                    {isPaid ? "Quitado" : hasAdvance ? "Entrada Paga" : "Pendente"}
                                                </Badge>
                                            </td>
                                        </tr>
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
                                                            <div className="grid grid-cols-2 gap-4 pb-1 border-b border-border/10 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                <span>Serviço</span>
                                                                <span className="text-right">Valor</span>
                                                            </div>
                                                            {p.services.map((svc, idx) => (
                                                                <div key={idx} className="grid grid-cols-2 gap-4 text-xs py-1 border-b border-border/5 last:border-0 hover:bg-primary/5 transition-colors rounded-sm px-1">
                                                                    <span className="text-muted-foreground font-medium">{svc.name}</span>
                                                                    <span className="text-right font-bold text-foreground/80">{formatCurrency(svc.price)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bento-card p-6"
                >
                    <h2 className="text-lg font-semibold tracking-tight mb-6">Eficiência de Faturamento</h2>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-muted-foreground uppercase">Liquidez (Recebido vs Total)</span>
                                <span className="text-emerald-500">
                                    {stats?.totalValue ? Math.round((stats.totalPaid / stats.totalValue) * 100) : 0}%
                                </span>
                            </div>
                            <Progress
                                value={stats?.totalValue ? (stats.totalPaid / stats.totalValue) * 100 : 0}
                                className="h-2 bg-muted-foreground/10"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground italic">
                            Dica: Melhore sua liquidez solicitando uma porcentagem maior de entrada no fechamento dos serviços.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bento-card p-6 flex flex-col justify-center items-center text-center gap-2"
                >
                    <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold">Projeção de Caixa</h3>
                    <p className="text-sm text-muted-foreground max-w-[300px]">
                        Você tem {formatCurrency(stats?.totalRemaining || 0)} pendentes de recebimento nos projetos atuais.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

