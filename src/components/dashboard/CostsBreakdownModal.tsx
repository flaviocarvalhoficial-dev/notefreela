
import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import {
    TrendingDown,
    Calendar,
    Trash2,
    Loader2,
    Briefcase,
    Tag,
    X,
    Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFinancialData } from "@/hooks/use-financial-data";
import { CostRegistrationDialog } from "./CostRegistrationDialog";
import {
    Pencil
} from "lucide-react";

interface Cost {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    project_id: string | null;
    projects?: { name: string } | null;
}

interface CostsBreakdownModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CostsBreakdownModal({ open, onOpenChange }: CostsBreakdownModalProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [editingCost, setEditingCost] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const {
        subscriptions = [],
        isLoading: isLoadingSubs
    } = useFinancialData();

    const { data: costs = [], isLoading: isLoadingCosts } = useQuery({
        queryKey: ["project_costs_detailed"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("project_costs")
                .select("*, projects(name)")
                .neq("category", "receita_parcela") // Exclude income installments
                .order("date", { ascending: false });

            if (error) throw error;
            return data as Cost[];
        }
    });

    const isLoading = isLoadingCosts || isLoadingSubs;

    const deleteCostMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("project_costs").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["project_costs_detailed"] });
            queryClient.invalidateQueries({ queryKey: ["finance_projects"] }); // Invalidate hook data
            toast({ title: "Custo removido", description: "O registro foi excluído com sucesso." });
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao excluir",
                description: error.message || "Não foi possível excluir o registro.",
                variant: "destructive"
            });
        }
    });

    const formatCurrency = (value: number) => {
        const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        return <span className="mask-value">{formatted}</span>;
    };

    const categories = [
        { value: "all", label: "Todas" },
        { value: "subscription", label: "Assinaturas" },
        { value: "tool", label: "Software" },
        { value: "hourly", label: "Hora Técnica" },
        { value: "service", label: "Serviço" },
        { value: "marketing", label: "Marketing" },
        { value: "other", label: "Outros" }
    ];

    const unifiedCosts = useMemo(() => {
        const projectCostsFormatted = costs.map(c => ({
            ...c,
            type: 'project_cost'
        }));

        const subscriptionCostsFormatted = subscriptions.filter(s => s.status === 'active').map(s => {
            const priceBRL = s.currency === 'USD' ? s.price * 6 : s.price;
            const monthlyValue = s.billing_cycle === 'anual' ? priceBRL / 12 : priceBRL;

            return {
                id: s.id,
                title: s.name,
                amount: monthlyValue,
                category: 'subscription',
                date: s.next_payment_date,
                project_id: null,
                projects: null,
                type: 'subscription'
            };
        });

        return [...projectCostsFormatted, ...subscriptionCostsFormatted].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [costs, subscriptions]);

    const filteredCosts = unifiedCosts.filter(c => filterCategory === "all" || c.category === filterCategory);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl border-border bg-sidebar/95 backdrop-blur-xl h-[90vh] max-h-[850px] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl">Detalhamento de Custos</DialogTitle>
                                <DialogDescription className="text-xs">Visualize todos os investimentos e despesas registradas.</DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex items-center gap-2 px-6 py-3 bg-muted/5 border-b border-border overflow-x-auto custom-scrollbar">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {categories.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setFilterCategory(cat.value)}
                            className={cn(
                                "text-[10px] font-medium px-3 py-1 rounded-full transition-all border whitespace-nowrap",
                                filterCategory === cat.value
                                    ? "bg-primary/20 border-primary/30 text-primary"
                                    : "bg-background/20 border-border text-muted-foreground hover:bg-background/40"
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-scroll custom-scrollbar p-6 pb-60 min-h-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-xs text-muted-foreground">Carregando despesas...</p>
                        </div>
                    ) : filteredCosts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-3">
                                <TrendingDown className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground font-medium">Nenhum custo encontrado neste filtro.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCosts.map((cost) => (
                                <div
                                    key={cost.id}
                                    className="group flex items-center justify-between p-3 rounded-xl border border-border bg-card/40 hover:bg-muted/10 transition-all"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-lg bg-muted/10 text-muted-foreground group-hover:scale-110 transition-transform">
                                            <Tag className="h-3.5 w-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-medium truncate text-foreground">{cost.title}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {format(new Date(cost.date), "dd 'de' MMM", { locale: ptBR })}
                                                </span>
                                                {cost.projects?.name && (
                                                    <>
                                                        <span className="text-[10px] text-muted-foreground">•</span>
                                                        <span className="text-[10px] text-primary/70 font-medium flex items-center gap-1">
                                                            <Briefcase className="h-2.5 w-2.5" />
                                                            {cost.projects.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-medium text-red-500/90 tabular-nums">
                                            {formatCurrency(cost.amount)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingCost(cost);
                                                    setIsEditOpen(true);
                                                }}
                                                className="p-1.5 rounded-md hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm("Deseja realmente excluir este custo?")) {
                                                        deleteCostMutation.mutate(cost.id);
                                                    }
                                                }}
                                                disabled={deleteCostMutation.isPending}
                                                className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                                                title="Excluir"
                                            >
                                                {deleteCostMutation.isPending && deleteCostMutation.variables === cost.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-border bg-muted/5 flex items-center justify-between mt-auto">
                    <div>
                        <p className="text-[10px] text-muted-foreground  font-medium tracking-tight">Total Acumulado</p>
                        <p className="text-lg font-medium text-red-500">
                            {formatCurrency(filteredCosts.reduce((acc, c) => acc + c.amount, 0))}
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
                        Fechar
                    </Button>
                </div>
            </DialogContent>

            <CostRegistrationDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                costToEdit={editingCost}
            />
        </Dialog>
    );
}



