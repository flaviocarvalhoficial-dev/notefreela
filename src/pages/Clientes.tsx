import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Loader2,
    Briefcase,
    MapPin,
    Building2,
    Phone,
    Mail,
    MoreVertical,
    Trash2,
    Edit,
    LayoutGrid,
    List as ListIcon,
    Calendar,
    Filter,
    TrendingUp,
    CheckCircle2,
    Clock,
    Plus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";
import { useClientsData } from "@/hooks/use-clients-data";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

const Clientes = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [selectedClient, setSelectedClient] = useState<any | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const {
        clients,
        stats,
        filterOptions,
        isLoading,
        filters
    } = useClientsData();

    const deleteClientMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("clients").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients-raw"] });
            toast({ title: "Cliente removido" });
        }
    });

    const months = [
        { label: "Janeiro", value: "0" },
        { label: "Fevereiro", value: "1" },
        { label: "Março", value: "2" },
        { label: "Abril", value: "3" },
        { label: "Maio", value: "4" },
        { label: "Junho", value: "5" },
        { label: "Julho", value: "6" },
        { label: "Agosto", value: "7" },
        { label: "Setembro", value: "8" },
        { label: "Outubro", value: "9" },
        { label: "Novembro", value: "10" },
        { label: "Dezembro", value: "11" },
    ];

    const statsConfig = [
        { title: "Investimento Total", value: stats.totalInvested, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { title: "Projetos", value: stats.totalProjects, icon: Briefcase, color: "text-primary", bg: "bg-primary/10" },
        { title: "Ativos", value: stats.totalActive, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Consolidated Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 bg-card border border-border rounded-lg shadow-sm divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden"
            >
                {statsConfig.map((stat) => (
                    <div
                        key={stat.title}
                        className="p-6 flex items-center gap-4 transition-colors hover:bg-muted/30"
                    >
                        <div className={cn("p-2.5 rounded-lg", stat.bg, stat.color)}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-0.5">{stat.title}</p>
                            <p className="text-xl font-medium tracking-tight tabular-nums text-foreground mask-value">
                                {typeof stat.value === 'number' && stat.title.includes("Total")
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)
                                    : stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Filters Bar */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar cliente..."
                            value={filters.searchQuery}
                            onChange={(e) => filters.setSearchQuery(e.target.value)}
                            className="pl-9 h-9 bg-card/50 border-border/60"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                                "h-9 px-3 gap-2 text-xs font-medium border-none",
                                (filters.selectedYear !== "all" || filters.selectedMonth !== "all" || filters.selectedServiceType !== "all") && "bg-primary/5 text-primary"
                            )}
                            onClick={() => {
                                const el = document.getElementById('advanced-filters-clients');
                                if (el) el.classList.toggle('hidden');
                            }}
                        >
                            <Filter className="h-3.5 w-3.5" />
                            Filtros
                        </Button>

                        <div className="flex bg-muted/20 p-1 rounded-lg ml-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7 rounded-md transition-all", viewMode === "grid" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                                onClick={() => setViewMode("grid")}
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-7 w-7 rounded-md transition-all", viewMode === "list" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                                onClick={() => setViewMode("list")}
                            >
                                <ListIcon className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Ghost Filters Bar */}
                <div id="advanced-filters-clients" className="hidden animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-muted/20 rounded-lg">
                        <Select value={filters.selectedYear} onValueChange={filters.setSelectedYear}>
                            <SelectTrigger className="h-8 w-[100px] text-[10px] font-medium bg-card border-border rounded-md">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent className="glass border-border">
                                <SelectItem value="all">Ano</SelectItem>
                                {filterOptions.years.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.selectedMonth} onValueChange={filters.setSelectedMonth}>
                            <SelectTrigger className="h-8 w-[120px] text-[10px] font-medium bg-card border-border rounded-md">
                                <SelectValue placeholder="Mês" />
                            </SelectTrigger>
                            <SelectContent className="glass border-border">
                                <SelectItem value="all">Mês</SelectItem>
                                {months.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filters.selectedServiceType} onValueChange={filters.setSelectedServiceType}>
                            <SelectTrigger className="h-8 w-[160px] text-[10px] font-medium bg-card border-border rounded-md">
                                <SelectValue placeholder="Serviço" />
                            </SelectTrigger>
                            <SelectContent className="glass border-border max-w-[300px]">
                                <SelectItem value="all">Serviço</SelectItem>
                                {filterOptions.services.map(svc => (
                                    <SelectItem key={svc} value={svc} className="truncate">{svc}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                            onClick={() => {
                                filters.setSearchQuery("");
                                filters.setSelectedYear("all");
                                filters.setSelectedMonth("all");
                                filters.setSelectedServiceType("all");
                            }}
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {
                isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground bg-muted/5 rounded-lg border-none">
                        <Users className="h-16 w-16 mb-4 opacity-10" />
                        <p className="font-medium tracking-tight">Nenhum cliente disponível nos filtros atuais.</p>
                        <Button variant="link" size="sm" onClick={() => {
                            filters.setSearchQuery("");
                            filters.setSelectedYear("all");
                            filters.setSelectedMonth("all");
                            filters.setSelectedServiceType("all");
                        }} className="mt-2 text-primary/60">Limpar filtros</Button>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {viewMode === "grid" ? (
                            <motion.div
                                key="grid"
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {clients.map((client: any, i: number) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        index={i}
                                        onDelete={deleteClientMutation.mutate}
                                        onClick={() => {
                                            toast({ title: "Detalhes do Cliente", description: `Abrindo painel de ${client.name}` });
                                            setSelectedClient(client);
                                        }}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                className="bg-card rounded-xl overflow-hidden shadow-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ClientTableView
                                    clients={clients}
                                    onDelete={deleteClientMutation.mutate}
                                    onSelect={(client) => {
                                        toast({ title: "Detalhes do Cliente", description: `Abrindo painel de ${client.name}` });
                                        setSelectedClient(client);
                                    }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )
            }

            <ClientDetailsDialog
                client={selectedClient}
                open={!!selectedClient}
                onOpenChange={(open) => {
                    if (!open) setSelectedClient(null);
                }}
            />
        </div>
    );
};

function ClientCard({ client, onDelete, onClick, index }: { client: any, onDelete: (id: string) => void, onClick: () => void, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4) }}
            className="group relative h-full flex flex-col"
        >
            <div
                className="bg-card hover:bg-card rounded-lg p-8 transition-all h-full cursor-pointer flex flex-col shadow-sm"
                onClick={onClick}
            >
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ClientActions client={client} onDelete={onDelete} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-md bg-primary/5 flex items-center justify-center text-primary font-medium text-xl border-none transition-colors group-hover:bg-primary/10">
                        {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 pr-6">
                        <h3 className="font-medium text-lg leading-tight mb-1 text-foreground truncate">{client.name}</h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-normal">
                            <Building2 className="h-3 w-3" />
                            {client.company_name || "Pessoa Física"}
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-8 flex-1">
                    {client.city && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                            <MapPin className="h-3.5 w-3.5 text-primary/40" />
                            {client.city}
                        </div>
                    )}
                    {(client.email || client.phone) && (
                        <div className="flex flex-col gap-1.5 pt-1">
                            {client.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate font-normal">
                                    <Mail className="h-3.5 w-3.5 text-primary/40" />
                                    {client.email}
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
                                    <Phone className="h-3.5 w-3.5 text-primary/40" />
                                    {client.phone}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-none flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border-none group-hover:bg-primary/10 transition-colors">
                            <Briefcase className="h-4 w-4 text-primary/70" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium tracking-tight tabular-nums text-foreground">{client.projects?.length || 0}</span>
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Projetos</span>
                        </div>
                    </div>
                    <div className="text-right flex flex-col">
                        <span className="text-sm font-medium tracking-tight text-foreground tabular-nums mask-value">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.totalValue || 0)}
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">Investido</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ClientTableView({ clients, onDelete, onSelect }: { clients: any[], onDelete: (id: string) => void, onSelect: (client: any) => void }) {
    return (
        <TooltipProvider>
            <Table>
                <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="w-[40px] pl-5">
                            <Checkbox className="rounded-[4px] border-muted-foreground/30" />
                        </TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-4">Cliente</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-4">Projetos</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-4">Serviços</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-4 hidden md:table-cell">Local</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-4 text-right pr-5">Investimento</TableHead>
                        <TableHead className="w-[50px] pr-5"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => {
                        const allServices = Array.from(new Set(
                            client.allProjects?.flatMap((p: any) =>
                                (p.services || []).map((s: any) => typeof s === 'string' ? s : s.name)
                            )
                        )).filter(Boolean) as string[];

                        const activeProjects = client.projects?.filter((p: any) => p.status !== 'completed').length || 0;

                        return (
                            <TableRow
                                key={client.id}
                                className="group cursor-pointer border-none hover:bg-muted/20 transition-colors"
                                onClick={() => onSelect(client)}
                            >
                                <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox className="rounded-[4px] border-muted-foreground/30" />
                                </TableCell>
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-none rounded-lg shadow-sm">
                                            <AvatarImage src={client.avatar_url} />
                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-semibold rounded-lg">
                                                {client.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                {client.name}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground truncate opacity-70">
                                                {client.company_name || client.email || "Pessoa Física"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-foreground tabular-nums">
                                            {client.allProjects?.length || 0}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">jobs</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                                        {allServices.slice(0, 2).map((service, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="outline"
                                                className="text-[10px] font-medium py-0 h-5 px-2 bg-muted/30 border-border/50 text-muted-foreground whitespace-nowrap"
                                            >
                                                {service}
                                            </Badge>
                                        ))}
                                        {allServices.length > 2 && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Badge variant="outline" className="text-[10px] font-medium py-0 h-5 px-1.5 bg-primary/5 border-primary/10 text-primary cursor-help">
                                                        +{allServices.length - 2}
                                                    </Badge>
                                                </TooltipTrigger>
                                                <TooltipContent className="p-2 border-border shadow-md">
                                                    <div className="flex flex-col gap-1">
                                                        {allServices.slice(2).map((s, i) => (
                                                            <span key={i} className="text-[10px]">{s}</span>
                                                        ))}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                        {allServices.length === 0 && <span className="text-[11px] text-muted-foreground/40 italic">Nenhum</span>}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 opacity-50" />
                                        {client.city || "—"}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {activeProjects > 0 ? (
                                        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15 border-none text-[10px] font-semibold px-2 h-5">
                                            <Clock className="h-2.5 w-2.5 mr-1" />
                                            {activeProjects} Ativo{activeProjects > 1 ? 's' : ''}
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 border-none text-[10px] font-semibold px-2 h-5">
                                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                            Concluído
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right pr-5">
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-semibold text-foreground tracking-tight tabular-nums">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.totalValue || 0)}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">Total Bruto</span>
                                    </div>
                                </TableCell>
                                <TableCell className="pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                                    <ClientActions client={client} onDelete={onDelete} />
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TooltipProvider>
    );
}

function ClientActions({ client, onDelete }: { client: any, onDelete: (id: string) => void }) {
    return (
        <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <NewClientDialog
                        client={client}
                        trigger={
                            <DropdownMenuItem className="gap-2 w-full cursor-pointer font-medium text-xs">
                                <Edit className="h-3.5 w-3.5" /> Editar Dados
                            </DropdownMenuItem>
                        }
                    />
                    <DeleteConfirmDialog
                        title="Excluir Cliente"
                        description="Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita."
                        onConfirm={() => onDelete(client.id)}
                        trigger={
                            <DropdownMenuItem
                                className="text-destructive gap-2 focus:text-destructive w-full cursor-pointer font-medium text-xs"
                            >
                                <Trash2 className="h-3.5 w-3.5" /> Remover Registro
                            </DropdownMenuItem>
                        }
                    />
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export default Clientes;
