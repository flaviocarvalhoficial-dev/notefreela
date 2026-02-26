import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Filter,
    CreditCard,
    Calendar,
    ArrowUpRight,
    MoreVertical,
    Clock,
    Trash2,
    Edit2,
    Globe,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    Briefcase,
    LayoutGrid,
    List as ListIcon,
    Loader2
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { format, addMonths, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { IconPicker } from "@/components/projects/IconPicker";

type Subscription = {
    id: string;
    name: string;
    icon: string;
    price: number;
    currency: string;
    billing_cycle: string;
    next_payment_date: string;
    status: string;
    category: string;
    description: string | null;
    payment_method: string | null;
    link: string | null;
};

const MOCK_DATA: Subscription[] = [
    {
        id: "1",
        name: "Figma Professional",
        icon: "Hexagon",
        price: 75.0,
        currency: "BRL",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-12",
        status: "active",
        category: "Design",
        description: "Plano para edição colaborativa e prototipagem avançada.",
        payment_method: "Cartão de Crédito (Visa)",
        link: "https://figma.com",
    },
    {
        id: "2",
        name: "Adobe Creative Cloud",
        icon: "si:adobecreativecloud",
        price: 185.0,
        currency: "BRL",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-05",
        status: "active",
        category: "Design",
        description: "Pacote completo: Photoshop, Illustrator, After Effects.",
        payment_method: "PayPal",
        link: "https://adobe.com",
    },
    {
        id: "3",
        name: "CapCut Pro",
        icon: "si:capcut",
        price: 40.0,
        currency: "BRL",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-10",
        status: "active",
        category: "Vídeo",
        description: "Edição de vídeo profissional e efeitos avançados.",
        payment_method: "Cartão de Crédito",
        link: "https://capcut.com",
    },
    {
        id: "4",
        name: "Suno AI",
        icon: "si:suno",
        price: 10.0,
        currency: "USD",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-15",
        status: "active",
        category: "Música",
        description: "Geração de músicas com IA.",
        payment_method: "Cartão Virtual",
        link: "https://suno.com",
    },
    {
        id: "5",
        name: "Canva Pro",
        icon: "si:canva",
        price: 35.0,
        currency: "BRL",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-20",
        status: "active",
        category: "Design",
        description: "Design gráfico simplificado para redes sociais.",
        payment_method: "Cartão de Crédito",
        link: "https://canva.com",
    },
    {
        id: "6",
        name: "Google Workspace",
        icon: "Mail",
        price: 35.0,
        currency: "BRL",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-24",
        status: "active",
        category: "Produtividade",
        description: "E-mail personalizado e armazenamento drive.",
        payment_method: "Cartão de Crédito (Master)",
        link: "https://workspace.google.com",
    },
    {
        id: "7",
        name: "ChatGPT Plus",
        icon: "si:openai",
        price: 20.0,
        currency: "USD",
        billing_cycle: "mensal",
        next_payment_date: "2026-03-15",
        status: "active",
        category: "AI",
        description: "Acesso total ao GPT-4 e ferramentas de análise.",
        payment_method: "Cartão Virtual",
        link: "https://chat.openai.com",
    },
];

export default function Assinaturas() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Queries
    const { data: subscriptions = [], isLoading, error } = useQuery({
        queryKey: ["tool-subscriptions"],
        queryFn: async () => {
            try {
                const { data, error } = await (supabase as any)
                    .from("tool_subscriptions")
                    .select("*")
                    .order("next_payment_date", { ascending: true });

                if (error) {
                    // Se a tabela não existir, retorna MOCK para visualização
                    if (error.code === '42P01') {
                        console.warn("Table tool_subscriptions does not exist, using mock data");
                        return MOCK_DATA;
                    }
                    throw error;
                }
                return (data as unknown) as Subscription[];
            } catch (err) {
                console.error("Migration check failed:", err);
                return MOCK_DATA;
            }
        },
    });

    // Mutations (simulated for now since table might not exist)
    const addMutation = useMutation({
        mutationFn: async (newSub: any) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth required");

            const { error } = await (supabase as any).from("tool_subscriptions").insert({
                ...newSub,
                user_id: user.id
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tool-subscriptions"] });
            toast({ title: "Assinatura adicionada!" });
            setIsAddOpen(false);
        },
        onError: (err: any) => {
            if (err.code === '42P01') {
                toast({
                    title: "Erro de Persistência",
                    description: "A tabela 'tool_subscriptions' não foi criada no banco de dados.",
                    variant: "destructive"
                });
            } else {
                toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
            }
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (updatedSub: any) => {
            const { error } = await (supabase as any)
                .from("tool_subscriptions")
                .update(updatedSub)
                .eq("id", updatedSub.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tool-subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["finance_projects"] });
            toast({ title: "Assinatura atualizada!" });
            setEditingSubscription(null);
            setIsAddOpen(false);
        },
        onError: (err: any) => {
            toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from("tool_subscriptions").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tool-subscriptions"] });
            queryClient.invalidateQueries({ queryKey: ["finance_projects"] });
            toast({ title: "Assinatura removida." });
        }
    });

    // Calculations
    const filteredSubscriptions = useMemo(() => {
        return subscriptions.filter((sub) => {
            const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === "all" || sub.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [subscriptions, searchQuery, filterCategory]);

    const totalMonthly = useMemo(() => {
        return subscriptions
            .filter(s => s.status === 'active')
            .reduce((acc, curr) => {
                // Simplificação: assume 1 USD = 6 BRL para o total
                const price = curr.currency === 'USD' ? curr.price * 6 : curr.price;
                return acc + (curr.billing_cycle === 'anual' ? price / 12 : price);
            }, 0);
    }, [subscriptions]);

    const nextRenewal = useMemo(() => {
        if (subscriptions.length === 0) return null;
        const active = subscriptions.filter(s => s.status === 'active');
        if (active.length === 0) return null;
        return active[0]; // Já ordenado por data
    }, [subscriptions]);

    const categories = Array.from(new Set(subscriptions.map(s => s.category)));

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide italic">Sincronizando faturamento...</p>
            </div>
        );
    }

    return (
        <div className="page-container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-1.5 w-8 bg-primary rounded-full" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase">Faturamento & Gestão</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Assinaturas</h1>
                        <p className="text-muted-foreground font-normal text-sm max-w-md">Gerencie suas ferramentas, planos recorrentes e controle de custos fixos.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-muted/20 p-1 rounded-lg border border-border">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => setViewMode("grid")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            className="h-8 w-8 rounded-md"
                            onClick={() => setViewMode("list")}
                        >
                            <ListIcon className="h-4 w-4" />
                        </Button>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingSubscription(null);
                            setIsAddOpen(true);
                        }}
                        className="gap-2 h-9 px-4 font-medium text-sm rounded-lg bg-primary text-primary-foreground shadow-sm transition-all active:scale-95 group"
                    >
                        <CreditCard className="h-3.5 w-3.5" />
                        Nova Ferramenta
                    </Button>
                </div>
            </header>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bento-card p-6 flex flex-col justify-between border-l-4 border-l-primary"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-primary/5 rounded-xl border border-primary/10">
                            <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/5 text-emerald-500 border-emerald-500/20">Mensal</Badge>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ">ESTIMATIVA MENSAL</p>
                        <h2 className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthly)}
                        </h2>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bento-card p-6 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-500/5 rounded-xl border border-blue-500/10">
                            <Calendar className="h-5 w-5 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-medium text-blue-500 opacity-60">Próximos 30 dias</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ">PRÓXIMO VENCIMENTO</p>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold tracking-tight truncate max-w-[180px]">
                                {nextRenewal?.name || "Nenhum"}
                            </h2>
                            {nextRenewal && (
                                <span className="text-xs font-medium text-muted-foreground">
                                    {format(parseISO(nextRenewal.next_payment_date), "dd/MM", { locale: ptBR })}
                                </span>
                            )}
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bento-card p-6 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-500/5 rounded-xl border border-purple-500/10">
                            <Briefcase className="h-5 w-5 text-purple-500" />
                        </div>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 ">FERRAMENTAS ATIVAS</p>
                        <h2 className="text-3xl font-bold tracking-tight tabular-nums">
                            {subscriptions.filter(s => s.status === 'active').length}
                        </h2>
                    </div>
                </motion.div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-card/40 p-4 rounded-2xl border border-border backdrop-blur-sm">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Pesquisar ferramenta..."
                        className="pl-10 h-11 bg-background border-border hover:border-border/60 transition-all rounded-xl shadow-inner focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[160px] h-11 bg-background border-border rounded-xl">
                            <Filter className="h-3.5 w-3.5 mr-2 opacity-40" />
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent className="glass border-border">
                            <SelectItem value="all">Todas</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content Display */}
            <AnimatePresence mode="wait">
                {filteredSubscriptions.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-32 flex flex-col items-center bento-card border-dashed"
                    >
                        <div className="w-20 h-20 bg-muted/10 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-border group-hover:scale-110 transition-transform">
                            <CreditCard className="text-muted-foreground/40 h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold tracking-tight mb-2">Sem assinaturas encontradas</h3>
                        <p className="text-sm text-muted-foreground font-normal max-w-xs mx-auto">Tente ajustar seus filtros ou adicione uma nova assinatura recorrente para começar.</p>
                        <Button variant="ghost" className="mt-6 text-primary gap-2" onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}>
                            Limpar busca
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key={viewMode}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={cn(
                            viewMode === "grid"
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                                : "space-y-3"
                        )}
                    >
                        {filteredSubscriptions.map((sub) => (
                            viewMode === "grid" ? (
                                <SubscriptionCard
                                    key={sub.id}
                                    subscription={sub}
                                    onDelete={() => deleteMutation.mutate(sub.id)}
                                    onEdit={() => {
                                        setEditingSubscription(sub);
                                        setIsAddOpen(true);
                                    }}
                                />
                            ) : (
                                <SubscriptionListItem
                                    key={sub.id}
                                    subscription={sub}
                                    onDelete={() => deleteMutation.mutate(sub.id)}
                                    onEdit={() => {
                                        setEditingSubscription(sub);
                                        setIsAddOpen(true);
                                    }}
                                />
                            )
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Form Dialog (Handles Add and Edit) */}
            <SubscriptionFormDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onSubmit={async (values) => {
                    if (editingSubscription) {
                        await updateMutation.mutateAsync({ ...values, id: editingSubscription.id });
                    } else {
                        await addMutation.mutateAsync(values);
                    }
                }}
                isSubmitting={addMutation.isPending || updateMutation.isPending}
                subscription={editingSubscription}
            />
        </div>
    );
}



function SubscriptionIcon({ iconName, className }: { iconName: string; className?: string }) {
    const [imgError, setImgError] = React.useState(false);

    if (iconName.startsWith("si:") && !imgError) {
        const slug = iconName.split(":")[1];
        // Scale up brand logos slightly since they are often more complex than strokes
        return (
            <img
                src={`https://api.iconify.design/simple-icons:${slug}.svg?color=white`}
                className={cn(
                    "w-full h-full object-contain p-0.5 transition-all opacity-80 brightness-90",
                    "group-hover:opacity-100 group-hover:brightness-110",
                    // We extract the container size or pass it implicitly
                    className.includes("h-24") ? "h-24 w-24" : "h-11 w-11" // If it's the background icon use full size, else use larger default
                )}
                alt="Icon"
                onError={() => setImgError(true)}
            />
        );
    }
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.CreditCard || CreditCard;
    return <Icon className={className} />;
}

function SubscriptionCard({ subscription, onDelete, onEdit }: { subscription: Subscription; onDelete: () => void; onEdit: () => void }) {
    const isOverdue = isAfter(new Date(), parseISO(subscription.next_payment_date));

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="group bento-card p-6 flex flex-col justify-between hover:shadow-glow-sm transition-all duration-300 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-125 transition-transform pointer-events-none">
                <SubscriptionIcon iconName={subscription.icon} className="h-24 w-24 text-foreground brightness-0 invert opacity-10" />
            </div>

            <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm overflow-hidden">
                        <SubscriptionIcon iconName={subscription.icon} className="h-6 w-6" />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border">
                            <DropdownMenuItem className="gap-2 text-xs font-medium" onClick={onEdit}> <Edit2 className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-xs font-medium text-destructive" onClick={onDelete}>
                                <Trash2 className="h-3.5 w-3.5" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div>
                    <Badge variant="outline" className="text-[10px] h-4 mb-2 font-medium tracking-tight bg-secondary/30 border-border">
                        {subscription.category}
                    </Badge>
                    <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{subscription.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 font-normal opacity-70 italic">{subscription.description || "Sem descrição"}</p>
                </div>
            </div>

            <div className="mt-8 space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">VALOR</span>
                        <span className="text-lg font-bold tabular-nums">
                            {subscription.currency === 'USD' ? '$' : 'R$'} {subscription.price.toLocaleString('pt-BR')}
                            <span className="text-[10px] text-muted-foreground ml-1 font-medium">/{subscription.billing_cycle === 'anual' ? 'ano' : 'mês'}</span>
                        </span>
                    </div>
                    {subscription.link && (
                        <a href={subscription.link} target="_blank" rel="noopener" className="p-2.5 bg-muted/20 rounded-xl hover:bg-primary/10 hover:text-primary transition-all group-hover:translate-x-1">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    )}
                </div>

                <div className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold tracking-[0.1em] border uppercase",
                    isOverdue
                        ? "bg-rose-500/5 text-rose-500 border-rose-500/20"
                        : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                )}>
                    <div className="flex items-center gap-1.5 ">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Vence {format(parseISO(subscription.next_payment_date), "dd/MM", { locale: ptBR })}</span>
                    </div>
                    {isOverdue && <AlertCircle className="w-3.5 h-3.5" />}
                </div>
            </div>
        </motion.div>
    );
}

function SubscriptionListItem({ subscription, onDelete, onEdit }: { subscription: Subscription; onDelete: () => void; onEdit: () => void }) {

    return (
        <motion.div
            whileHover={{ x: 4 }}
            className="group flex items-center justify-between p-4 bg-card border border-border rounded-xl hover:bg-muted/10 cursor-pointer transition-all shadow-sm"
        >
            <div className="flex items-center gap-4 flex-1 min-w-0 pr-8">
                <div className="h-10 w-10 flex items-center justify-center bg-primary/5 text-primary rounded-lg shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all overflow-hidden">
                    <SubscriptionIcon iconName={subscription.icon} className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm truncate">{subscription.name}</h3>
                        <Badge variant="outline" className="text-[9px] h-3.5  tracking-tight py-0 opacity-60">{subscription.category}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate font-normal opacity-60 bg-muted/30 w-fit px-1 rounded">{subscription.payment_method || "Não informado"}</p>
                </div>
            </div>

            <div className="flex items-center gap-12 pr-6">
                <div className="hidden lg:flex flex-col text-right w-24">
                    <span className="text-xs font-bold tabular-nums ">
                        {subscription.currency === 'USD' ? '$' : 'R$'} {subscription.price.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">VALOR</span>
                </div>
                <div className="hidden sm:flex flex-col text-right w-24">
                    <span className="text-xs font-semibold">{format(parseISO(subscription.next_payment_date), "dd MMM", { locale: ptBR })}</span>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">VENCIMENTO</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-40 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass border-border">
                        <DropdownMenuItem className="gap-2 text-xs font-medium" onClick={onEdit}> <Edit2 className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-xs font-medium text-destructive" onClick={onDelete}>
                            <Trash2 className="h-3.5 w-3.5" /> Remover
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all text-primary/40" />
            </div>
        </motion.div>
    );
}

function SubscriptionFormDialog({
    open,
    onOpenChange,
    onSubmit,
    isSubmitting,
    subscription
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    onSubmit: (v: any) => Promise<void>;
    isSubmitting: boolean;
    subscription: Subscription | null;
}) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState("BRL");
    const [cycle, setCycle] = useState("mensal");
    const [cat, setCat] = useState("Software");
    const [date, setDate] = useState("");
    const [icon, setIcon] = useState("CreditCard");
    const [link, setLink] = useState("");

    // Effect to pre-fill data when editing
    React.useEffect(() => {
        if (subscription && open) {
            setName(subscription.name);
            setPrice(subscription.price.toString());
            setCurrency(subscription.currency);
            setCycle(subscription.billing_cycle);
            setCat(subscription.category);
            setDate(subscription.next_payment_date);
            setIcon(subscription.icon);
            setLink(subscription.link || "");
        } else if (!open) {
            // Reset fields when closing
            setName(""); setPrice(""); setDate(""); setLink(""); setCurrency("BRL"); setCycle("mensal"); setCat("Software"); setIcon("CreditCard");
        }
    }, [subscription, open]);

    const handleSave = async () => {
        if (!name || !price || !date) return;
        await onSubmit({
            name,
            icon,
            price: Number(price),
            currency,
            billing_cycle: cycle,
            next_payment_date: date,
            category: cat,
            link,
            status: 'active'
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] glass-dark border-border p-0 overflow-hidden rounded-3xl">
                <div className="p-8 space-y-8">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-8 bg-primary rounded-full" />
                            <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase">
                                {subscription ? "EDITAR FERRAMENTA" : "NOVA FERRAMENTA"}
                            </span>
                        </div>
                        <DialogTitle className="text-3xl font-semibold tracking-tight">
                            {subscription ? "Atualizar Assinatura" : "Vincular Assinatura"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm font-normal">
                            {subscription
                                ? "Mantenha os dados da sua assinatura atualizados para um controle financeiro preciso."
                                : "Cadastre um serviço recorrente para automatizar seu fluxo financeiro."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6">
                        <div className="flex gap-4">
                            <div className="space-y-3 shrink-0">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">ÍCONE</Label>
                                <IconPicker
                                    value={icon}
                                    onChange={setIcon}
                                    trigger={
                                        <Button
                                            variant="outline"
                                            className="w-16 h-16 rounded-2xl border-2 border-dashed border-border bg-muted/5 hover:border-primary/50 transition-all flex flex-col items-center justify-center p-0"
                                        >
                                            {(() => {
                                                const SelectedIcon = (LucideIcons as any)[icon] || LucideIcons.CreditCard;
                                                return <SelectedIcon className="h-6 w-6 text-muted-foreground" />;
                                            })()}
                                        </Button>
                                    }
                                />
                            </div>
                            <div className="space-y-3 flex-1">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">NOME DO SERVIÇO</Label>
                                <Input
                                    placeholder="Ex: Figma, Adobe, Spotify..."
                                    className="h-12 bg-muted/10 border-border rounded-xl px-4 text-sm font-medium tracking-tight"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">VALOR</Label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground pb-0.5">{currency}</div>
                                    <Input
                                        type="number"
                                        placeholder="0,00"
                                        className="h-12 pl-12 bg-muted/10 border-border rounded-xl font-medium tracking-tight"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">MOEDA</Label>
                                <Select value={currency} onValueChange={setCurrency}>
                                    <SelectTrigger className="h-12 bg-muted/10 border-border rounded-xl font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-border">
                                        <SelectItem value="BRL">Real (BRL)</SelectItem>
                                        <SelectItem value="USD">Dólar (USD)</SelectItem>
                                        <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">PRÓXIMO VENCIMENTO</Label>
                                <Input
                                    type="date"
                                    className="h-12 bg-muted/10 border-border rounded-xl font-medium tracking-tight block w-full"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">CICLO</Label>
                                <Select value={cycle} onValueChange={setCycle}>
                                    <SelectTrigger className="h-12 bg-muted/10 border-border rounded-xl font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-border">
                                        <SelectItem value="mensal">Mensal</SelectItem>
                                        <SelectItem value="trimestral">Trimestral</SelectItem>
                                        <SelectItem value="anual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ">VINCULAR SITE (LINK)</Label>
                            <div className="relative group">
                                <LucideIcons.Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="https://..."
                                    className="h-12 pl-12 bg-muted/10 border-border rounded-xl font-normal text-xs"
                                    value={link}
                                    onChange={(e) => setLink(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 p-8 flex gap-3 border-t border-border">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 font-semibold text-xs tracking-tight">CANCELAR</Button>
                    <Button onClick={handleSave} disabled={isSubmitting} className="flex-1 shadow-xl shadow-primary/10 transition-all active:scale-95 font-semibold text-xs tracking-tight">
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (subscription ? "SALVAR ALTERAÇÕES" : "VINCULAR SERVIÇO")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
