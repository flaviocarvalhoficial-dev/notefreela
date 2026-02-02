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
    List
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ClientDetailsDialog } from "@/components/clients/ClientDetailsDialog";

type Client = {
    id: string;
    name: string;
    company_name?: string;
    email?: string;
    phone?: string;
    city?: string;
    business_type?: string;
    // Computed or Joined
    project_count?: number;
    total_value?: number;
    projects?: any[];
};

const Clientes = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: clients = [], isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            // 1. Fetch Clients from DB
            const { data: dbClients, error: clientsError } = await (supabase as any)
                .from("clients")
                .select("*")
                .order("name");

            if (clientsError) throw clientsError;

            // 2. Fetch Projects to aggregate and find implicit clients
            const { data: projectsData, error: projectsError } = await supabase
                .from("projects")
                .select("id, name, client_name, value, status, client_id, deadline, services");

            if (projectsError) throw projectsError;

            // 3. Identify implicit clients (from projects.client_name) not in dbClients
            const registeredNames = new Set((dbClients || []).map((c: any) => c.name.toLowerCase()));
            const implicitClients: Client[] = [];

            (projectsData || []).forEach((p: any) => {
                if (p.client_name && !registeredNames.has(p.client_name.toLowerCase()) && !p.client_id) {
                    // Check if we already added this implicit client to our temp list
                    const existsInImplicit = implicitClients.find(ic => ic.name.toLowerCase() === p.client_name.toLowerCase());
                    if (!existsInImplicit) {
                        implicitClients.push({
                            id: `virtual-${p.client_name}`,
                            name: p.client_name,
                            city: "Não cadastrado",
                            business_type: "Automático"
                        });
                    }
                }
            });

            // 4. Merge and Aggregate
            const allClients = [...(dbClients || []), ...implicitClients];

            return allClients.map((client: any) => {
                const clientProjects = (projectsData || []).filter((p: any) =>
                    p.client_id === client.id ||
                    (p.client_name && p.client_name.toLowerCase() === client.name.toLowerCase()) ||
                    (p.client_name && client.company_name && p.client_name.toLowerCase() === client.company_name.toLowerCase())
                );

                const totalValue = clientProjects.reduce((acc: number, p: any) => acc + (p.value || 0), 0);

                return {
                    ...client,
                    project_count: clientProjects.length,
                    total_value: totalValue,
                    projects: clientProjects
                };
            }).sort((a, b) => a.name.localeCompare(b.name));
        }
    });

    const deleteClientMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from("clients").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            toast({ title: "Cliente removido" });
        }
    });

    const filteredClients = clients.filter((client: Client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.company_name && client.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="h-full flex flex-col gap-6 pb-10" >
            <div>
                <h1 className="text-3xl font-semibold tracking-tight mb-1">Clientes</h1>
                <p className="text-muted-foreground text-sm">Gerencie sua carteira de clientes e negócios.</p>
            </div>

            {/* Actions Bar */}
            <motion.div
                className="bento-card bento-card--compact p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                        <Input
                            placeholder="Buscar cliente ou empresa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 glass-light text-foreground"
                        />
                    </div>

                    <div className="h-8 w-px bg-border/60 mx-2 hidden sm:block" />

                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={cn("h-8 px-2 rounded-sm", viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={cn("h-8 px-2 rounded-sm", viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <NewClientDialog />
            </motion.div >

            <ClientDetailsDialog
                client={selectedClient as any}
                open={!!selectedClient}
                onOpenChange={(open) => !open && setSelectedClient(null)}
            />

            {/* Content */}
            {
                isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <Users className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm">Nenhum cliente encontrado.</p>
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
                                layout
                            >
                                {filteredClients.map((client: Client, i: number) => (
                                    <ClientCard
                                        key={client.id}
                                        client={client}
                                        index={i}
                                        onDelete={deleteClientMutation.mutate}
                                        onClick={() => setSelectedClient(client)}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                className="space-y-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                layout
                            >
                                {filteredClients.map((client: Client, i: number) => (
                                    <ClientListItem
                                        key={client.id}
                                        client={client}
                                        index={i}
                                        onDelete={deleteClientMutation.mutate}
                                        onClick={() => setSelectedClient(client)}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )
            }
        </div >
    );
};

function ClientCard({ client, onDelete, onClick, index }: { client: Client, onDelete: (id: string) => void, onClick: () => void, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card border border-border/60 rounded-xl p-5 hover:border-border transition-colors group relative overflow-hidden h-full flex flex-col cursor-pointer"
            onClick={onClick}
        >
            <div className="absolute top-2 right-2 z-10">
                <ClientActions client={client} onDelete={onDelete} />
            </div>

            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                        {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-semibold text-base leading-none mb-1 text-foreground">{client.name}</h3>
                        {client.company_name && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {client.company_name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3 mb-5 flex-1">
                {client.city && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground/50" />
                        {client.city}
                    </div>
                )}
                {(client.email || client.phone) && (
                    <div className="flex flex-col gap-1">
                        {client.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground/50" />
                                {client.email}
                            </div>
                        )}
                        {client.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground/50" />
                                {client.phone}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-4 mt-auto">
                <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Projetos</p>
                    <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold">{client.project_count || 0}</span>
                    </div>
                </div>
                <div>
                    <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Valor Total</p>
                    <span className="text-sm font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total_value || 0)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

function ClientListItem({ client, onDelete, onClick, index }: { client: Client, onDelete: (id: string) => void, onClick: () => void, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className="flex items-center justify-between p-4 bg-card border border-border/60 rounded-lg hover:bg-muted/10 group transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 pr-6 gap-0.5">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground truncate">{client.name}</h3>
                        {client.company_name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50 truncate max-w-[150px]">
                                {client.company_name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {client.email && <span>{client.email}</span>}
                        {client.phone && <span className="hidden sm:inline">• {client.phone}</span>}
                        {client.city && <span className="hidden md:inline">• {client.city}</span>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6 md:gap-12 mr-4">
                <div className="hidden sm:flex flex-col items-end w-20">
                    <span className="text-[10px] text-muted-foreground font-medium">Projetos</span>
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                        <Briefcase className="h-3 w-3 text-primary/70" />
                        {client.project_count || 0}
                    </div>
                </div>
                <div className="flex flex-col items-end w-24">
                    <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                    <span className="text-sm font-semibold text-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(client.total_value || 0)}
                    </span>
                </div>
            </div>

            <div className="pl-4 border-l border-border/30">
                <ClientActions client={client} onDelete={onDelete} />
            </div>
        </motion.div>
    );
}

function ClientActions({ client, onDelete }: { client: Client, onDelete: (id: string) => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {client.id.startsWith("virtual-") ? (
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        Gerado via Projetos
                    </DropdownMenuItem>
                ) : (
                    <>
                        <NewClientDialog
                            client={client}
                            trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2 w-full cursor-pointer">
                                    <Edit className="h-3.5 w-3.5" /> Editar
                                </DropdownMenuItem>
                            }
                        />
                        <DeleteConfirmDialog
                            title="Excluir Cliente"
                            description="Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita."
                            onConfirm={() => onDelete(client.id)}
                            trigger={
                                <DropdownMenuItem
                                    className="text-destructive gap-2 focus:text-destructive w-full cursor-pointer"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                                </DropdownMenuItem>
                            }
                        />
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default Clientes;
