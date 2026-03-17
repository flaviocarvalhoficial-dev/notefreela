
import { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    ComposedChart,
    Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon, Activity, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth, subMonths, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toValidDate } from "@/utils/date";

interface ProfitChartProps {
    projects: any[];
    subscriptions?: any[];
}

export function ProfitChart({ projects, subscriptions = [] }: ProfitChartProps) {
    const [chartType, setChartType] = useState<"bar" | "line">("line");

    // Process data: Aggregate Gains, Costs and Profit by month
    const data = useMemo(() => {
        const rangeInMonths = 6; // Show last 6 months
        const end = new Date();
        const start = subMonths(end, rangeInMonths - 1);
        const months = eachMonthOfInterval({ start, end });

        const dataMap: Record<string, { name: string; gains: number; costs: number; profit: number; date: Date }> = {};

        months.forEach(month => {
            const key = format(month, "yyyy-MM");
            dataMap[key] = {
                name: format(month, "MMM/yy", { locale: ptBR }),
                gains: 0,
                costs: 0,
                profit: 0,
                date: startOfMonth(month)
            };
        });

        projects.forEach(project => {
            // 1. Gains from TRANSACTIONS
            const transactions = (project as any).transactions || [];
            transactions.forEach((t: any) => {
                if (!t.payment_date) return;
                const key = t.payment_date.substring(0, 7);
                if (dataMap[key]) {
                    dataMap[key].gains += Number(t.amount || 0);
                }
            });

            // 1.5 Handle 'recebido' installments without transactions
            const installments = (project as any).installments || [];
            installments.filter((i: any) => i.status === 'recebido').forEach(inst => {
                const hasTransaction = transactions.some((t: any) =>
                    t.installment_id === inst.id ||
                    (t.amount === inst.amount && t.description?.includes(inst.origin_label || ''))
                );
                if (!hasTransaction) {
                    const key = inst.due_date.substring(0, 7);
                    if (dataMap[key]) {
                        dataMap[key].gains += Number(inst.amount || 0);
                    }
                }
            });

            // 2. Costs
            const projectCosts = (project as any).project_costs || [];
            projectCosts.forEach((c: any) => {
                const key = c.date?.substring(0, 7);
                if (dataMap[key]) {
                    const amount = Number(c.amount || 0);
                    if (c.category === 'receita_parcela') {
                        // Legacy income fallback if strictly no new installments exist
                        const hasNewInstallments = installments.length > 0;
                        if (!hasNewInstallments) {
                            dataMap[key].gains += amount;
                        }
                    } else {
                        dataMap[key].costs += amount;
                    }
                }
            });
        });

        // 3. Add Subscriptions (Monthly estimates)
        subscriptions.filter(s => s.status === 'active').forEach(sub => {
            const priceBRL = sub.currency === 'USD' ? sub.price * 6.12 : sub.price;
            const monthlyValue = sub.billing_cycle === 'anual' ? priceBRL / 12 : priceBRL;

            // Add this monthly value to all months in the range
            Object.keys(dataMap).forEach(key => {
                dataMap[key].costs += monthlyValue;
            });
        });

        return Object.values(dataMap)
            .map(item => ({
                ...item,
                profit: item.gains - item.costs,
                name: item.name.charAt(0).toUpperCase() + item.name.slice(1)
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [projects]);

    const formatCurrencyStr = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="bento-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight">Lucratividade</h3>
                    <p className="text-sm text-muted-foreground">Comparativo entre faturamento e despesas</p>
                </div>
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChartType("bar")}
                        className={cn(
                            "h-7 px-3 text-xs gap-2 rounded-md transition-all",
                            chartType === "bar" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        Barras
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChartType("line")}
                        className={cn(
                            "h-7 px-3 text-xs gap-2 rounded-md transition-all",
                            chartType === "line" ? "bg-background shadow-sm text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LineChartIcon className="h-3.5 w-3.5" />
                        Linhas
                    </Button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="profitGainsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.3} />
                                </linearGradient>
                                <linearGradient id="profitCostsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={(props) => {
                                    const { x, y, payload } = props;
                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text
                                                x={0}
                                                y={0}
                                                dy={4}
                                                textAnchor="end"
                                                fill="hsl(var(--muted-foreground))"
                                                fontSize={11}
                                            >
                                                {payload.value >= 1000 ? `R$${payload.value / 1000}k` : `R$${payload.value}`}
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border)/0.5)',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    boxShadow: 'var(--shadow-glow-sm)'
                                }}
                                formatter={(value: number) => [formatCurrencyStr(value), ""]}
                            />
                            <Bar
                                dataKey="gains"
                                name="Ganhos"
                                fill="url(#profitGainsGradient)"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                            <Bar
                                dataKey="costs"
                                name="Custos"
                                fill="url(#profitCostsGradient)"
                                radius={[4, 4, 0, 0]}
                                barSize={24}
                            />
                        </BarChart>
                    ) : (
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={(props) => {
                                    const { x, y, payload } = props;
                                    return (
                                        <g transform={`translate(${x},${y})`}>
                                            <text
                                                x={0}
                                                y={0}
                                                dy={4}
                                                textAnchor="end"
                                                fill="hsl(var(--muted-foreground))"
                                                fontSize={11}
                                            >
                                                {payload.value >= 1000 ? `R$${payload.value / 1000}k` : `R$${payload.value}`}
                                            </text>
                                        </g>
                                    );
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border)/0.5)',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                }}
                                formatter={(value: number) => [formatCurrencyStr(value), ""]}
                            />
                            <Area
                                type="monotone"
                                dataKey="gains"
                                name="Ganhos"
                                stroke="hsl(158, 64%, 52%)"
                                strokeWidth={2}
                                fillOpacity={0.1}
                                fill="hsl(158, 64%, 52%)"
                            />
                            <Area
                                type="monotone"
                                dataKey="costs"
                                name="Custos"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={0.1}
                                fill="#ef4444"
                            />
                            <Line
                                type="monotone"
                                dataKey="profit"
                                name="Lucro Líquido"
                                stroke="hsl(var(--foreground))"
                                strokeWidth={3}
                                dot={{ r: 4, fill: "hsl(var(--foreground))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                            />
                        </ComposedChart>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(158,64%,52%)]"></div>
                    <span className="text-[10px] text-muted-foreground  tracking-wider font-semibold">Ganhos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#ef4444]"></div>
                    <span className="text-[10px] text-muted-foreground  tracking-wider font-semibold">Custos</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(var(--foreground))]"></div>
                    <span className="text-[10px] text-muted-foreground  tracking-wider font-semibold">Lucro</span>
                </div>
            </div>
        </div>
    );
}
