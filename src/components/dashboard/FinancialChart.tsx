
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
    ComposedChart
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toValidDate } from "@/utils/date";

interface FinancialChartProps {
    projects: any[];
}

export function FinancialChart({ projects }: FinancialChartProps) {
    const [chartType, setChartType] = useState<"bar" | "line">("line");

    // Process data: Aggregate by month
    const data = useMemo(() => {
        const monthlyData: Record<string, { name: string; total: number; received: number; date: Date }> = {};

        projects.forEach(project => {
            // 1. Setup values (on created_at month)
            const setupDate = toValidDate(project.created_at);
            if (setupDate) {
                const key = format(setupDate, "yyyy-MM");
                if (!monthlyData[key]) {
                    monthlyData[key] = {
                        name: format(setupDate, "MMM/yy", { locale: ptBR }),
                        total: 0,
                        received: 0,
                        date: startOfMonth(setupDate)
                    };
                }
                monthlyData[key].total += Number(project.value || 0);
                monthlyData[key].received += Number(project.advance_payment || 0);
            }

            // 2. Recurring values (projected on future months)
            const isRecurringActive = project.billing_type === "recorrente" && project.contract_status === "active";
            if (isRecurringActive) {
                const billingConfig = (project.services as any[] || []).find(s => s.name === "__billing_config__");
                let currentBillingDate = project.next_billing_date;
                const duration = billingConfig?.contractDuration || 12;

                for (let i = 0; i < duration; i++) {
                    if (!currentBillingDate) break;
                    const d = toValidDate(currentBillingDate + 'T12:00:00');
                    if (!d) break;

                    const key = format(d, "yyyy-MM");
                    if (!monthlyData[key]) {
                        monthlyData[key] = {
                            name: format(d, "MMM/yy", { locale: ptBR }),
                            total: 0,
                            received: 0,
                            date: startOfMonth(d)
                        };
                    }
                    // For charting purposes, we consider recurring as both 'total' and 'received' for that future month
                    monthlyData[key].total += Number(project.value || 0);
                    monthlyData[key].received += Number(project.value || 0);

                    // Move to next month
                    d.setMonth(d.getMonth() + 1);
                    currentBillingDate = d.toISOString().split('T')[0];
                }
            }
        });

        return Object.values(monthlyData)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(item => ({
                ...item,
                name: item.name.charAt(0).toUpperCase() + item.name.slice(1)
            }));
    }, [projects]);

    const formatCurrency = (value: number) => {
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
        return <span className="mask-value">{formatted}</span>;
    };

    return (
        <div className="bento-card p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight">Fluxo Financeiro</h3>
                    <p className="text-sm text-muted-foreground">Evolução de faturamento e recebimentos</p>
                </div>
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChartType("bar")}
                        className={cn(
                            "h-7 px-3 text-xs gap-2 rounded-md transition-all",
                            chartType === "bar" ? "bg-background shadow-sm text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
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
                            chartType === "line" ? "bg-background shadow-sm text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LineChartIcon className="h-3.5 w-3.5" />
                        Linhas
                    </Button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(212, 52%, 52%)" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="hsl(212, 52%, 52%)" stopOpacity={0.3} />
                                </linearGradient>
                                <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.8} />
                                    <stop offset="100%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.3} />
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
                                                className="mask-value"
                                            >
                                                {`R$${payload.value / 1000}k`}
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
                                formatter={(value: number) => [formatCurrency(value), ""]}
                                labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                            />
                            <Bar
                                dataKey="total"
                                name="Total Contratado"
                                fill="url(#totalGradient)"
                                radius={[4, 4, 0, 0]}
                                barSize={32}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                            <Bar
                                dataKey="received"
                                name="Recebido"
                                fill="url(#receivedGradient)"
                                radius={[4, 4, 0, 0]}
                                barSize={32}
                                animationDuration={1500}
                                animationEasing="ease-out"
                            />
                        </BarChart>
                    ) : (
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(212, 52%, 52%)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="hsl(212, 52%, 52%)" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0} />
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
                                                className="mask-value"
                                            >
                                                {`R$${payload.value / 1000}k`}
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
                                    fontSize: '12px',
                                    boxShadow: 'var(--shadow-glow-sm)'
                                }}
                                formatter={(value: number) => [formatCurrency(value), ""]}
                            />
                            <Area
                                type="natural"
                                dataKey="total"
                                name="Total Contratado"
                                stroke="hsl(212, 52%, 52%)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                            <Area
                                type="natural"
                                dataKey="received"
                                name="Recebido"
                                stroke="hsl(158, 64%, 52%)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorReceived)"
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(212,52%,52%)]"></div>
                    <span className="text-[10px] text-muted-foreground  tracking-wider font-semibold">Total Contratado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[hsl(158,64%,52%)]"></div>
                    <span className="text-[10px] text-muted-foreground  tracking-wider font-semibold">Recebido</span>
                </div>
            </div>
        </div>
    );
}


