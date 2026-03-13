
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

        const addValue = (dateStr: string, amount: number, isReceived: boolean) => {
            const date = toValidDate(dateStr);
            if (!date) return;
            const key = format(date, "yyyy-MM");
            if (!monthlyData[key]) {
                monthlyData[key] = {
                    name: format(date, "MMM/yy", { locale: ptBR }),
                    total: 0,
                    received: 0,
                    date: startOfMonth(date)
                };
            }
            monthlyData[key].total += amount;
            if (isReceived) {
                monthlyData[key].received += amount;
            }
        };

        projects.forEach(project => {
            // 1. Process New Installments System
            const newInst = (project as any).installments || [];
            newInst.forEach((i: any) => {
                addValue(i.due_date, Number(i.amount) || 0, i.status === 'recebido');
            });

            // 2. Process Legacy installments (if any left)
            const legacyInst = (project as any).project_costs?.filter((c: any) => c.category === "receita_parcela") || [];
            legacyInst.forEach((c: any) => {
                // Determine if received (legacy logic often uses some date comparison or flag)
                const isPaid = (project.payment_status === 'paid') || (c.date <= new Date().toISOString().split('T')[0]);
                addValue(c.date, Number(c.amount) || 0, isPaid);
            });

            // 3. Process Advance Payment (Signal) if not already in installments list
            // (In our new system, signal IS an installment, so we check for duplication)
            const hasSignalInInst = newInst.some((i: any) => i.origin_label?.startsWith('Sinal'));
            if (!hasSignalInInst && project.advance_payment > 0) {
                const signalDate = project.created_at;
                const isReceived = project.payment_status === 'paid' || project.payment_status === 'partial';
                addValue(signalDate, Number(project.advance_payment), isReceived);
            }

            // 4. Handle Recurring Cycles (Projected/Virtual) if no physical cycles exist yet
            const isRecurringActive = project.billing_type === "recorrente" && project.contract_status === "active";
            const hasPhysicalRec = newInst.some((i: any) => i.origin_label?.toLowerCase().includes('mensalidade'));

            if (isRecurringActive && !hasPhysicalRec) {
                const servicesArray = Array.isArray(project.services) ? project.services : [];
                const billingConfig = servicesArray.find((s: any) => s.name === "__billing_config__");
                let currentBillingDate = project.next_billing_date;
                const duration = billingConfig?.contractDuration || 12;

                for (let i = 0; i < duration; i++) {
                    if (!currentBillingDate) break;
                    const d = toValidDate(currentBillingDate + 'T12:00:00');
                    if (!d) break;

                    const amt = Number(project.value || 0);
                    // For projections, total is added. Received only if it's the past.
                    const isFuture = currentBillingDate > new Date().toISOString().split('T')[0];
                    addValue(currentBillingDate, amt, !isFuture);

                    // Move to next month
                    d.setMonth(d.getMonth() + 1);
                    currentBillingDate = d.toISOString().split('T')[0];
                }
            }
        });

        const sortedData = Object.values(monthlyData)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(item => ({
                ...item,
                name: item.name.charAt(0).toUpperCase() + item.name.slice(1)
            }));

        // Limit range to relevant months if many exist, or fill gaps?
        // For now just return what we found.
        return sortedData;
    }, [projects]);

    const isEmpty = data.length === 0;

    const formatCurrencyStr = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 h-full flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Financial Flow</h3>
                    <p className="text-[10px] text-muted-foreground/50 font-medium">Contratado vs. Recebido</p>
                </div>
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40 backdrop-blur-sm">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChartType("bar")}
                        className={cn(
                            "h-7 px-3 text-[10px] gap-2 rounded-lg transition-all font-bold",
                            chartType === "bar" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <BarChart3 className="h-3 w-3" />
                        Barras
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setChartType("line")}
                        className={cn(
                            "h-7 px-3 text-[10px] gap-2 rounded-lg transition-all font-bold",
                            chartType === "line" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LineChartIcon className="h-3 w-3" />
                        Linhas
                    </Button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative">
                {isEmpty ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <div className="p-3 bg-muted/10 rounded-full mb-3">
                            <Activity className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Sem dados para o gráfico</p>
                        <p className="text-[10px] text-muted-foreground/60 max-w-[180px]">As movimentações aparecerão aqui conforme você registrar projetos e pagamentos.</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "bar" ? (
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#0080FF" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#0080FF" stopOpacity={0.3} />
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
                                        <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0080FF" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0080FF" stopOpacity={0} />
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
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border)/0.5)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        boxShadow: 'var(--shadow-glow-sm)'
                                    }}
                                    formatter={(value: number) => [formatCurrencyStr(value), ""]}
                                />
                                <Area
                                    type="natural"
                                    dataKey="total"
                                    name="Total Contratado"
                                    stroke="hsl(var(--muted-foreground)/0.4)"
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
                                    stroke="#0080FF"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorReceived)"
                                    animationDuration={2000}
                                    animationEasing="ease-in-out"
                                />
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}


