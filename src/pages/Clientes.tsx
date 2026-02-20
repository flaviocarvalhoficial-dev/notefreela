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
    Clock
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

const Clientes = () => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
        <div className="flex flex-col gap-8 pb-10 pt-4">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-1">Clientes</h1>
                <p className="text-muted-foreground text-sm">Gerencie sua carteira de clientes e negócios.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statsConfig.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bento-card bento-card--compact p-5 flex items-center gap-4 bg-card/40 border-border/40"
                    >
                        <div className={cn("p-2 rounded-lg", stat.bg)}>
                            <stat.icon className={cn("h-5 w-5", stat.color)} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{stat.title}</p>
                            <p className="text-xl font-bold tracking-tight">
                                {typeof stat.value === 'number' && stat.title.includes("Total")
                                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stat.value)
                                    : stat.value}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters Bar */}
            <motion.div
                className="bento-card bento-card--compact p-4 flex flex-col lg:flex-row items-center justify-between gap-4 bg-card/30 border-border/30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                        <Input
                            placeholder="Buscar cliente ou empresa..."
                            value={filters.searchQuery}
                            onChange={(e) => filters.setSearchQuery(e.target.value)}
                            className="pl-9 glass-light text-sm h-10 border-border/40"
                        />
                    </div>

                    <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block" />

                    <Select value={filters.selectedYear} onValueChange={filters.setSelectedYear}>
                        <SelectTrigger className="w-full sm:w-28 h-10 glass-light border-border/40">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Anos</SelectItem>
                            {filterOptions.years.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.selectedMonth} onValueChange={filters.setSelectedMonth}>
                        <SelectTrigger className="w-full sm:w-32 h-10 glass-light border-border/40">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Meses</SelectItem>
                            {months.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filters.selectedServiceType} onValueChange={filters.setSelectedServiceType}>
                        <SelectTrigger className="w-full sm:w-40 h-10 glass-light border-border/40 text-left truncate">
                            <SelectValue placeholder="Serviço" />
                        </SelectTrigger>
                        <SelectContent className="max-w-[300px]">
                            <SelectItem value="all">Todos Serviços</SelectItem>
                            {filterOptions.services.map(svc => (
                                <SelectItem key={svc} value={svc} className="truncate">{svc}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/40">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn("h-8 w-9 p-0 rounded-md", viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn("h-8 w-9 p-0 rounded-md", viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <NewClientDialog />
            </motion.div >

            {/* Content Area */}
            {
                isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground/40 bg-card/10 rounded-2xl border border-dashed border-border/40">
                        <Users className="h-16 w-16 mb-4 opacity-10" />
                        <p className="font-medium tracking-tight">Nenhum cliente disponível nos filtros atuais.</p>
                        <Button variant="link" size="sm" onClick={() => {
                            filters.setSearchQuery("");
                            filters.setSelectedYear("all");
                            filters.setSelectedMonth("all");
                            filters.setSelectedServiceType("all");
                        }} className="mt-2 opacity-60">Limpar filtros</Button>
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
                                className="space-y-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                {clients.map((client: any, i: number) => (
                                    <ClientListItem
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.4) }}
            className="group relative h-full flex flex-col"
        >
            <div
                className="bg-card/40 hover:bg-card border border-border/40 hover:border-primary/30 rounded-2xl p-6 transition-all h-full cursor-pointer flex flex-col shadow-sm group-hover:shadow-md"
                onClick={onClick}
            >
                <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ClientActions client={client} onDelete={onDelete} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/5 transition-colors group-hover:bg-primary/20">
                        {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 pr-6">
                        <h3 className="font-bold text-lg leading-tight mb-1 text-foreground truncate">{client.name}</h3>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 font-medium">
                            <Building2 className="h-3 w-3" />
                            {client.company_name || "Pessoa Física"}
                        </div>
                    </div>
                </div>

                <div className="space-y-2 mb-8 flex-1">
                    {client.city && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium">
                            <MapPin className="h-3.5 w-3.5 text-primary/40" />
                            {client.city}
                        </div>
                    )}
                    {(client.email || client.phone) && (
                        <div className="flex flex-col gap-1.5 pt-1">
                            {client.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground/80 truncate font-medium">
                                    <Mail className="h-3.5 w-3.5 text-primary/40" />
                                    {client.email}
                                </div>
                            )}
                            {client.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-medium">
                                    <Phone className="h-3.5 w-3.5 text-primary/40" />
                                    {client.phone}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-6 border-t border-border/40 grid grid-cols-2 gap-4 mt-auto">
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">Projetos</p>
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/5 group-hover:bg-primary/10 transition-colors">
                                <Briefcase className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-base font-bold tracking-tight">{client.projects?.length || 0}</span>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest">Total Investido</p>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold tracking-tight text-foreground tabular-nums">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.totalValue || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ClientListItem({ client, onDelete, onClick, index }: { client: any, onDelete: (id: string) => void, onClick: () => void, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.3) }}
            className="group relative bg-card/40 hover:bg-card border border-border/40 hover:border-primary/20 rounded-xl p-4 transition-all cursor-pointer flex items-center shadow-sm"
            onClick={onClick}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0 border border-primary/5 group-hover:bg-primary/20 transition-colors">
                    {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 pr-6 gap-0.5 flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground truncate">{client.name}</h3>
                        {client.company_name && (
                            <Badge variant="outline" className="text-[9px] font-bold border-border/50 text-muted-foreground/70 uppercase tracking-tighter h-5 px-1.5 bg-muted/20">
                                {client.company_name}
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 font-medium whitespace-nowrap overflow-hidden">
                        {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3 opacity-50" /> {client.email}</span>}
                        {client.phone && <span className="hidden sm:flex items-center gap-1"><Phone className="h-3 w-3 opacity-50" /> {client.phone}</span>}
                        {client.city && <span className="hidden md:flex items-center gap-1"><MapPin className="h-3 w-3 opacity-50" /> {client.city}</span>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-8 md:gap-14 mr-8">
                <div className="hidden sm:flex flex-col items-end w-20">
                    <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">Projetos</span>
                    <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                        <Briefcase className="h-3 w-3 text-primary/70" />
                        {client.projects?.length || 0}
                    </div>
                </div>
                <div className="flex flex-col items-end w-28">
                    <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">Investido</span>
                    <span className="text-sm font-bold text-foreground tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.totalValue || 0)}
                    </span>
                </div>
            </div>

            <div className="pl-4 border-l border-border/40 opacity-40 group-hover:opacity-100 transition-opacity">
                <ClientActions client={client} onDelete={onDelete} />
            </div>
        </motion.div>
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
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 w-full cursor-pointer font-medium text-xs">
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
                                onSelect={(e) => e.preventDefault()}
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
