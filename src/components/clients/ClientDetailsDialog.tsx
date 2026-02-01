import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Briefcase, Calendar, CheckCircle2, Clock, ChevronDown, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    name?: string; // Projects might be just joined data, assumes 'name' usually exists in 'projects' table
    title?: string; // Fallback
    status: string;
    value: number;
    deadline?: string;
    type?: string;
    advance_payment?: number;
    services?: { name: string; price: number }[];
}

interface ClientWithProjects {
    id: string;
    name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    total_value?: number;
    projects?: Project[];
}

interface ClientDetailsDialogProps {
    client: ClientWithProjects | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClientDetailsDialog({ client, open, onOpenChange }: ClientDetailsDialogProps) {
    const [statusFilter, setStatusFilter] = useState("all");

    if (!client) return null;

    const projects = client.projects || [];
    const filteredProjects = projects.filter(p => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return ["active", "inprogress", "planning", "review", "pending"].includes(p.status);
        if (statusFilter === "completed") return ["completed", "done"].includes(p.status);
        return true;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl max-h-[85vh] overflow-y-auto border-border/50"
                style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed' }}
            >
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-bold flex flex-col gap-1">
                        <span>{client.name}</span>
                        {client.company_name && (
                            <span className="text-sm font-normal text-muted-foreground">{client.company_name}</span>
                        )}
                    </DialogTitle>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                        {client.email && <span>{client.email}</span>}
                        {client.phone && <span>{client.phone}</span>}
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Total Investido</p>
                            <p className="text-2xl font-bold text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total_value || 0)}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary/5 border border-border/50">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Projetos Totais</p>
                            <p className="text-2xl font-bold">
                                {projects.length}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-secondary/5 border border-border/50">
                            <p className="text-xs text-muted-foreground font-semibold uppercase">Projetos Ativos</p>
                            <p className="text-2xl font-bold">
                                {projects.filter(p => p.status === 'active' || p.status === 'inprogress').length}
                            </p>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                Histórico de Projetos
                            </h3>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                    <SelectValue placeholder="Filtrar por Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Projetos</SelectItem>
                                    <SelectItem value="active">Em Andamento</SelectItem>
                                    <SelectItem value="completed">Concluídos</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-md border border-border/50 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border/50 text-left">
                                        <th className="p-3 font-medium text-muted-foreground">Projeto</th>
                                        <th className="p-3 font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 font-medium text-muted-foreground">Valor</th>
                                        <th className="p-3 font-medium text-muted-foreground">Prazo</th>
                                        <th className="p-3 font-medium text-muted-foreground">Escopo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                Nenhum projeto encontrado com este filtro.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProjects.map((project, i) => (
                                            <Fragment key={project.id || i}>
                                                <tr className="group hover:bg-muted/30 transition-colors odd:bg-transparent even:bg-secondary/10 border-b border-border/5">
                                                    <td className="p-3 font-semibold text-foreground">
                                                        {project.name || project.title || "Sem título"}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider h-6", getStatusColor(project.status))}>
                                                            {translateStatus(project.status)}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex flex-col gap-2">
                                                            <Badge
                                                                className={cn(
                                                                    "text-[9px] font-bold uppercase tracking-widest w-fit",
                                                                    (project.value - (project.advance_payment || 0)) <= 0 ? "bg-emerald-500/10 text-emerald-500" :
                                                                        (project.advance_payment || 0) > 0 ? "bg-blue-500/10 text-blue-500" :
                                                                            "bg-amber-500/10 text-amber-500"
                                                                )}
                                                            >
                                                                {(project.value - (project.advance_payment || 0)) <= 0 ? "Quitado" :
                                                                    (project.advance_payment || 0) > 0 ? "Entrada Paga" : "Pendente"}
                                                            </Badge>
                                                            <div className="flex items-center gap-6 text-[10px] font-bold">
                                                                <div className="flex flex-col">
                                                                    <span className="text-muted-foreground/40 uppercase tracking-tighter">Total</span>
                                                                    <span className="text-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value)}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-muted-foreground/40 uppercase tracking-tighter">Pago</span>
                                                                    <span className="text-emerald-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.advance_payment || 0)}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-muted-foreground/40 uppercase tracking-tighter">Restante</span>
                                                                    <span className="text-amber-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.value - (project.advance_payment || 0))}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-xs">
                                                        {project.deadline ? format(new Date(project.deadline), "dd/MM/yyyy") : "-"}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                            <List className="h-3 w-3" />
                                                            {project.services?.length || 0} Itens
                                                        </div>
                                                    </td>
                                                </tr>
                                                {project.services && project.services.length > 0 && (
                                                    <tr className="border-b border-border/5">
                                                        <td colSpan={5} className="p-0 bg-muted/5">
                                                            <div className="flex flex-col">
                                                                {project.services.map((svc, k) => (
                                                                    <div
                                                                        key={k}
                                                                        className={cn(
                                                                            "px-10 py-2.5 text-[11px] flex items-center gap-3 transition-colors",
                                                                            k % 2 === 0 ? "bg-background/40" : "bg-muted/10"
                                                                        )}
                                                                    >
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                                                        <span className="text-foreground/70 font-medium flex-1">{svc.name}</span>
                                                                        <span className="text-primary font-bold pr-4">
                                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(svc.price || 0)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
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
