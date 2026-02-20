import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Briefcase, Calendar, CheckCircle2, Clock, ShieldCheck, List, Search, Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
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

    if (!client) return null;

    const allProjects = client.projects || [];

    // Gerar opções de filtros com base nos projetos DESTE cliente
    const filterOptions = useMemo(() => {
        const years = new Set<string>();
        const services = new Set<string>();

        allProjects.forEach(p => {
            if (p.created_at) years.add(getYear(parseISO(p.created_at)).toString());
            p.services?.forEach(s => services.add(s.name));
        });

        return {
            years: Array.from(years).sort((a, b) => b.localeCompare(a)),
            services: Array.from(services).sort()
        };
    }, [allProjects]);

    // Lógica de Filtragem
    const filteredProjects = useMemo(() => {
        return allProjects.filter(p => {
            const pDate = p.created_at ? parseISO(p.created_at) : null;

            // Filtro de Status
            const matchesStatus = statusFilter === "all" ||
                (statusFilter === "active" ? !["completed", "done"].includes(p.status) : ["completed", "done"].includes(p.status));

            // Filtro de Ano
            const matchesYear = yearFilter === "all" || (pDate && getYear(pDate).toString() === yearFilter);

            // Filtro de Mês
            const matchesMonth = monthFilter === "all" || (pDate && getMonth(pDate).toString() === monthFilter);

            // Filtro de Serviço
            const matchesService = serviceFilter === "all" ||
                p.services?.some(s => s.name.toLowerCase().includes(serviceFilter.toLowerCase()));

            return matchesStatus && matchesYear && matchesMonth && matchesService;
        });
    }, [allProjects, statusFilter, yearFilter, monthFilter, serviceFilter]);

    // Cálculo dos Indicadores baseados nos filtros
    const stats = useMemo(() => {
        const total = filteredProjects.reduce((acc, p) => acc + (p.value || 0), 0);
        const active = filteredProjects.filter(p => !["completed", "done"].includes(p.status)).length;
        return { total, active, count: filteredProjects.length };
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
            <DialogContent
                className="max-w-[1100px] h-[92vh] flex flex-col p-0 border-border/40 bg-[#0B0B0B] gap-0 overflow-hidden shadow-2xl"
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 100
                }}
            >
                {/* Header Premium */}
                <div className="p-8 pb-6 bg-gradient-to-b from-[#141414] to-transparent">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1.5">
                            <DialogTitle className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                                {client.name}
                                {client.company_name && <Badge variant="outline" className="text-[10px] font-bold border-primary/20 bg-primary/5 text-primary tracking-widest px-2 h-5">CNPJ ATIVO</Badge>}
                            </DialogTitle>
                            <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                                {client.company_name && <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> {client.company_name}</span>}
                                {client.email && <span className="opacity-40">•</span>}
                                {client.email && <span>{client.email}</span>}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full hover:bg-white/5 h-10 w-10">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Stats de Visão Geral (Filtradas) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-[#141414] border border-border/10 p-6 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                <Briefcase className="h-16 w-16" />
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-2">Total Investido (Filtrado)</p>
                            <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.total)}
                            </p>
                        </div>
                        <div className="bg-[#141414] border border-border/10 p-6 rounded-2xl">
                            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-2">Projetos no Período</p>
                            <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums">{stats.count}</p>
                        </div>
                        <div className="bg-[#141414] border border-border/10 p-6 rounded-2xl">
                            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest mb-2">Projetos Ativos</p>
                            <p className="text-3xl font-black tracking-tighter text-primary tabular-nums">{stats.active}</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar de Filtros Internos */}
                <div className="px-8 py-4 border-y border-border/5 bg-[#0E0E0E] flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 mr-2">
                        <Filter className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Filtros de Análise:</span>
                    </div>

                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-[100px] h-9 bg-transparent border-border/20 text-[11px] font-bold rounded-lg">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-border/20">
                            <SelectItem value="all">Todos Anos</SelectItem>
                            {filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="w-[120px] h-9 bg-transparent border-border/20 text-[11px] font-bold rounded-lg">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-border/20">
                            <SelectItem value="all">Todos Meses</SelectItem>
                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                        <SelectTrigger className="w-[160px] h-9 bg-transparent border-border/20 text-[11px] font-bold rounded-lg">
                            <SelectValue placeholder="Serviço" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-border/20">
                            <SelectItem value="all">Categorias</SelectItem>
                            {filterOptions.services.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-transparent border-border/20 text-[11px] font-bold rounded-lg">
                            <SelectValue placeholder="Situação" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-border/20">
                            <SelectItem value="all">Todos Status</SelectItem>
                            <SelectItem value="active">Em Andamento</SelectItem>
                            <SelectItem value="completed">Concluídos</SelectItem>
                        </SelectContent>
                    </Select>

                    {(yearFilter !== "all" || monthFilter !== "all" || statusFilter !== "all" || serviceFilter !== "all") && (
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 px-3 text-[10px] font-bold text-primary/60 hover:text-primary hover:bg-primary/5 uppercase tracking-widest">
                            <X className="h-3 w-3 mr-1.5" /> Limpar
                        </Button>
                    )}
                </div>

                {/* Lista de Projetos Filtrada */}
                <ScrollArea className="flex-1 px-8 py-6">
                    <div className="space-y-4">
                        {filteredProjects.length === 0 ? (
                            <div className="py-24 text-center border border-dashed border-border/10 rounded-3xl bg-[#141414]/20">
                                <Search className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
                                <p className="text-sm font-bold text-muted-foreground/30 uppercase tracking-widest">Nenhum registro encontrado para estes filtros.</p>
                            </div>
                        ) : (
                            filteredProjects.map((project) => (
                                <div key={project.id} className="group bg-[#141414]/40 hover:bg-[#141414] border border-border/10 rounded-2xl p-6 transition-all duration-300">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                        {/* Nome e Info Principal */}
                                        <div className="lg:col-span-4 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                                                <h4 className="text-lg font-black text-foreground group-hover:text-primary transition-colors truncate">
                                                    {project.name}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest ml-5">
                                                <Calendar className="h-3 w-3" />
                                                {project.created_at ? format(parseISO(project.created_at), "dd MMM, yyyy", { locale: ptBR }) : "--"}
                                            </div>
                                        </div>

                                        {/* Status Progress */}
                                        <div className="lg:col-span-2 flex flex-col gap-2">
                                            <Badge className={cn("text-[9px] font-black h-6 border-none px-3 uppercase tracking-tighter w-fit", getStatusColor(project.status))}>
                                                {translateStatus(project.status)}
                                            </Badge>
                                        </div>

                                        {/* Financial Insight */}
                                        <div className="lg:col-span-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                                                    (project.value - (project.advance_payment || 0)) <= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                                                )}>
                                                    {(project.value - (project.advance_payment || 0)) <= 0 ? "Faturado / Pago" : "Recebimento Pendente"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="space-y-1">
                                                    <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-wider">Total</span>
                                                    <p className="text-xs font-bold text-foreground tabular-nums">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 text-emerald-500/80">
                                                    <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider">Pago</span>
                                                    <p className="text-xs font-bold tabular-nums">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.advance_payment || 0)}
                                                    </p>
                                                </div>
                                                <div className="space-y-1 text-amber-500/80">
                                                    <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider">Resto</span>
                                                    <p className="text-xs font-bold tabular-nums">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value - (project.advance_payment || 0))}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Prazo */}
                                        <div className="lg:col-span-2">
                                            <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-wider block mb-1">Prazo de Entrega</span>
                                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
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
                                                        <span className="text-[11px] font-medium text-foreground/70">{svc.name}</span>
                                                    </div>
                                                    <span className="text-[11px] font-black text-foreground/40 tabular-nums">
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
                <div className="p-6 bg-[#0E0E0E] border-t border-border/5 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">Exibindo {stats.count} de {allProjects.length} projetos vinculados</p>
                    <Button variant="ghost" className="h-10 px-8 rounded-xl border border-border/10 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all" onClick={() => onOpenChange(false)}>
                        Fechar Painel
                    </Button>
                </div>
            </DialogContent>
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
