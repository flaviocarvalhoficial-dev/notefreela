import { motion } from "framer-motion";
import {
    BarChart3,
    TrendingUp,
    CheckCircle2,
    Clock,
    Calendar,
    Download,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from "recharts";

const COLORS = ["hsl(158, 64%, 52%)", "hsl(212, 52%, 52%)", "hsl(262, 52%, 65%)", "hsl(340, 75%, 60%)"];

export default function Relatorios() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ["reports_stats"],
        queryFn: async () => {
            const [projectsRes, tasksRes, eventsRes] = await Promise.all([
                supabase.from("projects").select("*"),
                supabase.from("tasks").select("*"),
                supabase.from("events").select("*")
            ]);

            const projects = projectsRes.data || [];
            const tasks = tasksRes.data || [];
            const events = eventsRes.data || [];

            // Task distribution by column
            const taskDist = [
                { name: "Início", value: tasks.filter(t => t.column_id === "todo").length },
                { name: "In Progress", value: tasks.filter(t => t.column_id === "inprogress").length },
                { name: "Done", value: tasks.filter(t => t.column_id === "done").length }
            ];

            // Projects by status
            const projectStats = [
                { name: "Ativos", value: projects.filter(p => p.status === "active").length },
                { name: "Planejamento", value: projects.filter(p => p.status === "planning").length },
                { name: "Concluídos", value: projects.filter(p => p.status === "completed").length }
            ];

            return {
                totalProjects: projects.length,
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.column_id === "done").length,
                totalEvents: events.length,
                taskDist,
                projectStats,
                avgProgress: projects.length ? Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) : 0
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight mb-1">Relatórios</h1>
                    <p className="text-muted-foreground text-sm">Análise de performance e produtividade</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="glass-light border-border/50 gap-2">
                        <Filter className="h-4 w-4" /> Filtros
                    </Button>
                    <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 gap-2">
                        <Download className="h-4 w-4" /> Exportar PDF
                    </Button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Taxa de Conclusão", value: `${stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`, icon: CheckCircle2, color: "hsl(158, 64%, 52%)", trend: "+12%" },
                    { label: "Projetos Ativos", value: stats?.projectStats[0].value || 0, icon: TrendingUp, color: "hsl(212, 52%, 52%)", trend: "+2" },
                    { label: "Média de Progresso", value: `${stats?.avgProgress}%`, icon: BarChart3, color: "hsl(262, 52%, 65%)", trend: "+5%" },
                    { label: "Eventos no Mês", value: stats?.totalEvents || 0, icon: Calendar, color: "hsl(340, 75%, 60%)", trend: "-4%" }
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bento-card bento-card--compact p-5 flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 rounded-xl glass-light" style={{ boxShadow: `0 0 20px ${kpi.color}15` }}>
                                <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${kpi.trend.startsWith("+") ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                {kpi.trend.startsWith("+") ? <ArrowUpRight className="h-2 w-2" /> : <ArrowDownRight className="h-2 w-2" />}
                                {kpi.trend}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <h3 className="text-2xl font-bold mt-1 tabular-nums">{kpi.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-8 bento-card p-6 h-[400px]"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold tracking-tight">Status das Tarefas</h2>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Volume por Etapa</p>
                    </div>
                    <div className="h-full pb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.taskDist}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px', color: '#fff' }}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                >
                                    {stats?.taskDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Distribution Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-4 bento-card p-6 h-[400px] flex flex-col"
                >
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold tracking-tight">Mix de Projetos</h2>
                        <p className="text-xs text-muted-foreground">Distribuição por Status</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats?.projectStats}
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {stats?.projectStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '12px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-4">
                        {stats?.projectStats.map((s, i) => (
                            <div key={s.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                                <span className="text-[10px] text-muted-foreground uppercase">{s.name} ({s.value})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Progress Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bento-card p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold tracking-tight">Saúde dos Projetos</h2>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-4">
                    {[
                        { name: "Fluxo de Trabalho", progress: stats?.totalTasks ? 100 : 0, color: "hsl(158, 64%, 52%)" },
                        { name: "Entrega de Prazos", progress: 85, color: "hsl(212, 52%, 52%)" },
                        { name: "Satisfação do Cliente", progress: 92, color: "hsl(262, 52%, 65%)" }
                    ].map((item, i) => (
                        <div key={item.name} className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground uppercase">{item.name}</span>
                                <span className="font-bold">{item.progress}%</span>
                            </div>
                            <Progress value={item.progress} className="h-1.5" />
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
