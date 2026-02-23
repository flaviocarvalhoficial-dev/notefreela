import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Bar,
    Legend,
    ComposedChart,
    Line
} from "recharts";
import { format, parseISO, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface FinancialReportsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function FinancialReportsModal({ open, onOpenChange }: FinancialReportsModalProps) {
    const [timeRange, setTimeRange] = useState("12");

    const { data: projects = [], isLoading: loadingProjects } = useQuery({
        queryKey: ["finance_projects_report"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("projects")
                .select("value, advance_payment, created_at");
            if (error) throw error;
            return data || [];
        }
    });

    const { data: costs = [], isLoading: loadingCosts } = useQuery({
        queryKey: ["finance_costs_report"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_costs")
                .select("amount, date");
            if (error) throw error;
            return data || [];
        }
    });

    const reportData = useMemo(() => {
        if (!projects.length && !costs.length) {
            // Pre-fill months even if no data to show empty charts
            const end = new Date();
            const start = subMonths(end, parseInt(timeRange) - 1);
            return eachMonthOfInterval({ start, end }).map(m => ({
                month: format(m, "MMM/yy", { locale: ptBR }),
                gains: 0,
                costs: 0,
                profit: 0,
                date: m
            }));
        }

        const rangeInMonths = parseInt(timeRange);
        const end = new Date();
        const start = subMonths(end, rangeInMonths - 1);
        const months = eachMonthOfInterval({ start, end });

        const dataMap: Record<string, { month: string, gains: number, costs: number, profit: number, date: Date }> = {};

        months.forEach(month => {
            const key = format(month, "yyyy-MM");
            dataMap[key] = {
                month: format(month, "MMM/yy", { locale: ptBR }),
                gains: 0,
                costs: 0,
                profit: 0,
                date: month
            };
        });

        projects.forEach(p => {
            if (!p.created_at) return;
            const key = format(parseISO(p.created_at), "yyyy-MM");
            if (dataMap[key]) {
                dataMap[key].gains += Number(p.advance_payment || 0);
            }
        });

        costs.forEach(c => {
            if (!c.date) return;
            const key = format(parseISO(c.date), "yyyy-MM");
            if (dataMap[key]) {
                dataMap[key].costs += Number(c.amount || 0);
            }
        });

        return Object.values(dataMap)
            .map(item => ({
                ...item,
                profit: item.gains - item.costs,
                month: item.month.charAt(0).toUpperCase() + item.month.slice(1)
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [projects, costs, timeRange]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    const totals = useMemo(() => {
        return reportData.reduce((acc, curr) => ({
            gains: acc.gains + curr.gains,
            costs: acc.costs + curr.costs,
            profit: acc.profit + curr.profit
        }), { gains: 0, costs: 0, profit: 0 });
    }, [reportData]);

    const isLoading = loadingProjects || loadingCosts;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl border-border/40 bg-sidebar/95 backdrop-blur-xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border/10 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Relatórios Mensais</DialogTitle>
                            <DialogDescription className="text-xs">Análise comparativa de fluxo financeiro.</DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Intervalo:</span>
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="h-9 w-[150px] text-xs glass border-primary/20 bg-background/50">
                                <Calendar className="h-3.5 w-3.5 mr-2 text-primary" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-border/40">
                                <SelectItem value="3">Últimos 3 meses</SelectItem>
                                <SelectItem value="6">Últimos 6 meses</SelectItem>
                                <SelectItem value="12">Últimos 12 meses</SelectItem>
                                <SelectItem value="18">Últimos 18 meses</SelectItem>
                                <SelectItem value="24">Últimos 2 anos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                    {isLoading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-xs text-muted-foreground font-medium">Processando dados financeiros...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="linear-card p-4 border border-emerald-500/10 bg-emerald-500/[0.02]">
                                    <div className="flex items-center gap-2 text-emerald-500 mb-1">
                                        <TrendingUp className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Ganhos</span>
                                    </div>
                                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.gains)}</p>
                                </div>
                                <div className="linear-card p-4 border border-rose-500/10 bg-rose-500/[0.02]">
                                    <div className="flex items-center gap-2 text-rose-500 mb-1">
                                        <TrendingDown className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Custos</span>
                                    </div>
                                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.costs)}</p>
                                </div>
                                <div className="linear-card p-4 border border-primary/10 bg-primary/[0.02]">
                                    <div className="flex items-center gap-2 text-primary mb-1">
                                        <Wallet className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Lucro Acumulado</span>
                                    </div>
                                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(totals.profit)}</p>
                                </div>
                            </div>

                            {/* Main Chart */}
                            <div className="bento-card p-6 h-[400px] flex flex-col">
                                <h3 className="text-sm font-semibold mb-6 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    Comparativo de Fluxo
                                </h3>
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={reportData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                                                tickFormatter={(val) => `R$${val / 1000}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'hsl(var(--card))',
                                                    borderColor: 'hsl(var(--border)/0.5)',
                                                    borderRadius: '12px',
                                                    fontSize: '12px'
                                                }}
                                                formatter={(val: number) => formatCurrency(val)}
                                            />
                                            <Legend verticalAlign="top" height={36} />
                                            <Bar dataKey="gains" name="Ganhos (Entrada)" fill="hsl(158, 64%, 52%)" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="costs" name="Custos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Line type="monotone" dataKey="profit" name="Lucro Líquido" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Data Table */}
                            <div className="bento-card overflow-hidden">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-muted/30 border-b border-border/40">
                                            <th className="p-4 font-bold uppercase tracking-wider text-muted-foreground/60">Mês</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-muted-foreground/60">Ganhos</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-muted-foreground/60">Custos</th>
                                            <th className="p-4 font-bold uppercase tracking-wider text-muted-foreground/60">Resultado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.slice().reverse().map((row, i) => (
                                            <tr key={row.month} className={cn("border-b border-border/10", i % 2 === 0 ? "bg-transparent" : "bg-muted/5")}>
                                                <td className="p-4 font-semibold">{row.month}</td>
                                                <td className="p-4 text-emerald-500 font-medium">{formatCurrency(row.gains)}</td>
                                                <td className="p-4 text-rose-500 font-medium">{formatCurrency(row.costs)}</td>
                                                <td className={cn("p-4 font-bold", row.profit >= 0 ? "text-primary" : "text-rose-600")}>
                                                    {formatCurrency(row.profit)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
