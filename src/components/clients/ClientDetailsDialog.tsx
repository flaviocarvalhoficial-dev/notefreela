import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Briefcase, Calendar, CheckCircle2, Clock, ShieldCheck, List, Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface Project {
    id: string;
    name: string;
    status: string;
    value: number;
    deadline?: string;
    advance_payment?: number;
    services?: { name: string; price: number }[];
    created_at?: string;
}

interface ClientWithProjects {
    id: string;
    name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    totalValue?: number;
    projects?: Project[];
    allProjects?: Project[];
}

interface ClientDetailsDialogProps {
    client: ClientWithProjects | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClientDetailsDialog({ client, open, onOpenChange }: ClientDetailsDialogProps) {
    // Estados dos Filtros INTERNOS
    const [statusFilter, setStatusFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");
    const [monthFilter, setMonthFilter] = useState("all");
    const [serviceFilter, setServiceFilter] = useState("all");

    // Resetar filtros toda vez que abrir um NOVO cliente
    useEffect(() => {
        if (open && client) {
            setStatusFilter("all");
            setYearFilter("all");
            setMonthFilter("all");
            setServiceFilter("all");
        }
    }, [open, client?.id]);

    const allProjects = useMemo(() => client?.allProjects || [], [client]);

    const filterOptions = useMemo(() => {
        const years = new Set<string>();
        const services = new Set<string>();

        allProjects.forEach(p => {
            if (p.created_at) years.add(getYear(parseISO(p.created_at)).toString());
            const pServices = (p.services as any[]) || [];
            pServices.forEach(s => {
                const sName = typeof s === 'string' ? s : s?.name;
                if (sName) services.add(sName);
            });
        });

        return {
            years: Array.from(years).sort((a, b) => b.localeCompare(a)),
            services: Array.from(services).sort()
        };
    }, [allProjects]);

    const filteredProjects = useMemo(() => {
        const results = allProjects.filter(p => {
            const pDate = p.created_at ? parseISO(p.created_at) : null;

            // 1. Status
            const isCompleted = ["completed", "done"].includes(p.status);
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" ? !isCompleted : isCompleted);

            // 2. Ano
            const matchesYear = yearFilter === "all" ||
                (pDate && getYear(pDate).toString() === yearFilter);

            // 3. Mês
            const matchesMonth = monthFilter === "all" ||
                (pDate && getMonth(pDate).toString() === monthFilter);

            // 4. Serviço
            const pServices = (p.services as any[]) || [];
            const matchesService = serviceFilter === "all" ||
                pServices.some(s => {
                    const sName = typeof s === 'string' ? s : s?.name;
                    return sName === serviceFilter;
                });

            return matchesStatus && matchesYear && matchesMonth && matchesService;
        });

        console.log(`[Filter] ${client?.name}:`, {
            total: allProjects.length,
            filtered: results.length,
            filters: { statusFilter, yearFilter, monthFilter, serviceFilter }
        });

        return results;
    }, [allProjects, statusFilter, yearFilter, monthFilter, serviceFilter, client?.id]);

    const stats = useMemo(() => {
        const total = filteredProjects.reduce((acc, p) => acc + (p.value || 0), 0);
        const activeCount = filteredProjects.filter(p => !["completed", "done"].includes(p.status)).length;
        return { total, active: activeCount, count: filteredProjects.length };
    }, [filteredProjects]);

    const months = [
        { label: "Janeiro", value: "0" }, { label: "Fevereiro", value: "1" }, { label: "Março", value: "2" },
        { label: "Abril", value: "3" }, { label: "Maio", value: "4" }, { label: "Junho", value: "5" },
        { label: "Julho", value: "6" }, { label: "Agosto", value: "7" }, { label: "Setembro", value: "8" },
        { label: "Outubro", value: "9" }, { label: "Novembro", value: "10" }, { label: "Dezembro", value: "11" },
    ];

    const resetFilters = () => {
        setStatusFilter("all");
        setYearFilter("all");
        setMonthFilter("all");
        setServiceFilter("all");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {client && (
                <DialogContent
                    className="max-w-[1100px] h-[92vh] flex flex-col p-0 border-border bg-background gap-0 overflow-hidden shadow-2xl z-50"
                >
                    {/* Header Premium */}
                    <div className="p-8 pb-6 bg-gradient-to-b from-card/50 to-transparent">
                        <div className="flex items-center justify-between mb-8">
                            <div className="space-y-1.5">
                                <DialogTitle className="text-4xl font-medium tracking-tight text-foreground flex items-center gap-3">
                                    {client.name}
                                    {client.company_name && <Badge variant="outline" className="text-[10px] font-medium border-primary/20 bg-primary/5 text-primary tracking-tight px-2 h-5 rounded-md">CNPJ ATIVO</Badge>}
                                </DialogTitle>
                                <div className="flex items-center gap-4 text-[11px] font-medium text-muted-foreground  tracking-tight">
                                    {client.company_name && <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {client.company_name}</span>}
                                    {client.email && <span className="opacity-40">•</span>}
                                    {client.email && <span>{client.email}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Stats de Visão Geral (Filtradas) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <Briefcase className="h-16 w-16" />
                                </div>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Investido (Filtrado)</p>
                                <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums mask-value">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}
                                </p>
                            </div>
                            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Projetos no Período</p>
                                <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">{stats.count}</p>
                            </div>
                            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm border-l-4 border-l-primary">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Projetos Ativos</p>
                                <p className="text-3xl font-semibold tracking-tight text-primary tabular-nums">{stats.active}</p>
                            </div>
                        </div>
                    </div>

                    {/* Toolbar de Filtros Internos */}
                    <div className="px-8 py-4 border-y border-border bg-muted/20 flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 mr-2">
                            <Filter className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-medium text-muted-foreground  tracking-tight">Filtros de Análise:</span>
                        </div>

                        <Select value={yearFilter} onValueChange={setYearFilter}>
                            <SelectTrigger className="w-[100px] h-9 bg-background border-border text-[11px] font-medium rounded-md">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="all">Todos Anos</SelectItem>
                                {filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={monthFilter} onValueChange={setMonthFilter}>
                            <SelectTrigger className="w-[120px] h-9 bg-background border-border text-[11px] font-medium rounded-md">
                                <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="all">Todos Meses</SelectItem>
                                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                            <SelectTrigger className="w-[160px] h-9 bg-background border-border text-[11px] font-medium rounded-md">
                                <SelectValue placeholder="Serviço" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="all">Categorias</SelectItem>
                                {filterOptions.services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px] h-9 bg-background border-border text-[11px] font-medium rounded-md">
                                <SelectValue placeholder="Situação" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border">
                                <SelectItem value="all">Todos Status</SelectItem>
                                <SelectItem value="active">Em Andamento</SelectItem>
                                <SelectItem value="completed">Concluídos</SelectItem>
                            </SelectContent>
                        </Select>

                        {(yearFilter !== "all" || monthFilter !== "all" || statusFilter !== "all" || serviceFilter !== "all") && (
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 px-3 text-[10px] font-medium text-primary/60 hover:text-primary hover:bg-primary/5  tracking-tight">
                                <X className="h-3 w-3 mr-1.5" /> Limpar
                            </Button>
                        )}
                    </div>

                    {/* Lista de Projetos Filtrada */}
                    <ScrollArea className="flex-1 px-8 py-6">
                        <div className="space-y-4">
                            {filteredProjects.length === 0 ? (
                                <div className="py-24 text-center border border-dashed border-border rounded-3xl bg-muted/10">
                                    <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-10" />
                                    <p className="text-sm font-medium text-muted-foreground  tracking-tight">Nenhum registro encontrado para estes filtros.</p>
                                </div>
                            ) : (
                                filteredProjects.map((project) => (
                                    <div key={project.id} className="group bg-card/40 hover:bg-card border border-border rounded-2xl p-6 transition-all duration-300 shadow-sm">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                            {/* Nome e Info Principal */}
                                            <div className="lg:col-span-4 min-w-0">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                    <h4 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors truncate tracking-tight">
                                                        {project.name}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground  tracking-tight ml-5">
                                                    <Calendar className="h-3 w-3" />
                                                    {project.created_at ? format(parseISO(project.created_at), "dd MMM, yyyy", { locale: ptBR }) : "--"}
                                                </div>
                                            </div>

                                            {/* Status Progress */}
                                            <div className="lg:col-span-2 flex flex-col gap-2">
                                                <Badge className={cn("text-[9px] font-medium h-6 border-none px-3  tracking-tight w-fit rounded-md", getStatusColor(project.status))}>
                                                    {translateStatus(project.status)}
                                                </Badge>
                                            </div>

                                            {/* Financial Insight */}
                                            <div className="lg:col-span-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className={cn(
                                                        "text-[10px] font-medium  tracking-tight px-2 py-0.5 rounded-md",
                                                        (project.value - (project.advance_payment || 0)) <= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                    )}>
                                                        {(project.value - (project.advance_payment || 0)) <= 0 ? "Faturado / Pago" : "Recebimento Pendente"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="space-y-1">
                                                        <span className="text-[9px] font-medium text-muted-foreground  tracking-tight">Total</span>
                                                        <p className="text-xs font-medium text-foreground tabular-nums mask-value">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 text-emerald-500/80">
                                                        <span className="text-[9px] font-medium opacity-40  tracking-tight">Pago</span>
                                                        <p className="text-xs font-medium tabular-nums mask-value">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.advance_payment || 0)}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 text-amber-500/80">
                                                        <span className="text-[9px] font-medium opacity-40  tracking-tight">Resto</span>
                                                        <p className="text-xs font-medium tabular-nums mask-value">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value - (project.advance_payment || 0))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Prazo */}
                                            <div className="lg:col-span-2">
                                                <span className="text-[9px] font-medium text-muted-foreground  tracking-tight block mb-1">Prazo de Entrega</span>
                                                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                                                    <Clock className="h-4 w-4 text-primary/40" />
                                                    {project.deadline ? format(parseISO(project.deadline), "dd/MM/yyyy") : "--/--/----"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Escopo de Serviços (Aninhado no Projeto) */}
                                        {project.services && project.services.length > 0 && (
                                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {project.services.map((svc, k) => (
                                                    <div key={k} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] group/svc hover:border-primary/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary/30 group-hover/svc:text-primary transition-colors" />
                                                            <span className="text-[11px] font-medium text-foreground">{svc.name}</span>
                                                        </div>
                                                        <span className="text-[11px] font-medium text-foreground tabular-nums mask-value">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price || 0)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Footer contextualizado */}
                    <div className="p-6 bg-muted/20 border-t border-border flex items-center justify-between">
                        <p className="text-[10px] font-medium text-muted-foreground  tracking-tight">Exibindo {stats.count} de {allProjects.length} projetos vinculados</p>
                        <Button variant="ghost" className="h-10 px-8 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" onClick={() => onOpenChange(false)}>
                            Fechar Painel
                        </Button>
                    </div>
                </DialogContent>
            )}
        </Dialog>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'active':
        case 'inprogress': return 'text-emerald-500 bg-emerald-500/10';
        case 'completed':
        case 'done': return 'text-blue-500 bg-blue-500/10';
        case 'planning': return 'text-purple-500 bg-purple-500/10';
        case 'review': return 'text-amber-500 bg-amber-500/10';
        default: return 'text-muted-foreground bg-muted/20';
    }
}

function translateStatus(status: string) {
    const map: Record<string, string> = {
        'active': 'Em Andamento',
        'inprogress': 'Em Andamento',
        'completed': 'Concluído',
        'done': 'Concluído',
        'pending': 'Pendente',
        'review': 'Em Revisão',
        'planning': 'Planejamento'
    };
    return map[status] || status;
}



