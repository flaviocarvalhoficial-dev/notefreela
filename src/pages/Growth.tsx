import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MapPin,
    Globe,
    Instagram,
    Phone,
    Star,
    Zap,
    Plus,
    Loader2,
    Trash2,
    CheckCircle2,
    Filter,
    Layers,
    Sparkles,
    MessageSquare,
    ExternalLink,
    Clock,
    UserPlus,
    Building2,
    Facebook,
    Linkedin
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Growth = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isMining, setIsMining] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: results = [], isLoading } = useQuery({
        queryKey: ["mining-results"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("growth_results")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });

    const mineMutation = useMutation({
        mutationFn: async (query: string) => {
            setIsMining(true);
            const { data, error } = await supabase.functions.invoke('lead-miner', {
                body: { query, location: "Brasil" } // Localização padrão ou vir de um input
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mining-results"] });
            toast({ title: "Mineração concluída", description: "Novos prospects foram encontrados e adicionados." });
        },
        onError: (error) => {
            toast({ title: "Erro na mineração", description: error.message, variant: "destructive" });
        },
        onSettled: () => {
            setIsMining(false);
        }
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        mineMutation.mutate(searchQuery);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex flex-col gap-4">
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Ex: Restaurantes em São Paulo, Advocacia no Rio..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-11 bg-card/50 border-border/60 rounded-xl"
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isMining || !searchQuery.trim()}
                        className="h-11 px-6 rounded-xl gap-2 font-semibold shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isMining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
                        Minerar Leads
                    </Button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-80 border border-dashed border-border/40 rounded-2xl bg-muted/5 p-12 text-center">
                        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-6 border border-primary/10">
                            <Sparkles className="h-8 w-8 text-primary/40" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Sem leads minerados ainda</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            Use o campo acima para buscar empresas e negócios diretamente do Google Maps com inteligência estratégica.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
                        {results.map((result, i) => (
                            <MiningResultCard key={result.id} result={result} index={i} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

function MiningResultCard({ result, index }: { result: any, index: number }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const addLeadMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { error } = await supabase
                .from("leads")
                .insert([{
                    user_id: user.id,
                    name: result.name, // Nome da empresa como nome principal se não houver contato
                    company_name: result.name,
                    email: null,
                    phone: result.phone,
                    website: result.website,
                    source: "Lead Miner",
                    notes: `Minerado do Google Maps. Avaliação: ${result.rating} (${result.reviews_count} reviews). Endereço: ${result.address}. Necessidades identificadas: ${Array.isArray(result.needs) ? result.needs.join(', ') : ''}`,
                    score: result.score || 50,
                    status: 'novo'
                }]);

            if (error) throw error;
        },
        onSuccess: () => {
            toast({ title: "Lead adicionado", description: "O prospect foi salvo na sua lista de leads." });
            queryClient.invalidateQueries({ queryKey: ["leads"] });
        },
        onError: (error) => {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
        }
    });

    const needs = Array.isArray(result.needs) ? result.needs : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-card border border-border hover:border-primary/30 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md h-[300px] flex flex-col"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 transition-colors group-hover:bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary/70" />
                </div>
                <div className="flex gap-1">
                    {result.rating && (
                        <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/10 text-[10px] gap-1 px-1.5 h-6">
                            <Star className="h-3 w-3 fill-current" /> {result.rating}
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex-1 space-y-2">
                <h4 className="font-bold text-sm text-foreground mb-1 truncate leading-tight group-hover:text-primary transition-colors">{result.name}</h4>
                <div className="space-y-1.5 min-h-[60px]">
                    {result.address && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <MapPin className="h-3.5 w-3.5 opacity-40 shrink-0" />
                            <span className="truncate">{result.address}</span>
                        </div>
                    )}
                    {result.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Phone className="h-3.5 w-3.5 opacity-40 shrink-0" />
                            <span>{result.phone}</span>
                        </div>
                    )}
                    {result.website && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <Globe className="h-3.5 w-3.5 opacity-40 shrink-0" />
                            <span className="truncate">{result.website.replace(/^https?:\/\//, '')}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                    {needs.slice(0, 2).map((need: string, i: number) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold uppercase tracking-wider">
                            {need}
                        </span>
                    ))}
                    {needs.length > 2 && <span className="text-[9px] text-muted-foreground font-bold">+{needs.length - 2}</span>}
                </div>
            </div>

            <div className="pt-4 border-t border-border/40 mt-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {result.instagram && (
                        <a href={result.instagram} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-pink-500/10 hover:text-pink-500 transition-all">
                            <Instagram className="h-4 w-4" />
                        </a>
                    )}
                    {result.facebook && (
                        <a href={result.facebook} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-blue-600/10 hover:text-blue-600 transition-all">
                            <Facebook className="h-4 w-4" />
                        </a>
                    )}
                    {result.linkedin && (
                        <a href={result.linkedin} target="_blank" rel="noreferrer" className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center text-muted-foreground hover:bg-blue-700/10 hover:text-blue-700 transition-all">
                            <Linkedin className="h-4 w-4" />
                        </a>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 rounded-lg text-xs gap-1.5 font-semibold hover:bg-primary hover:text-white transition-all border-primary/20"
                    onClick={(e) => {
                        e.stopPropagation();
                        addLeadMutation.mutate();
                    }}
                    disabled={addLeadMutation.isPending}
                >
                    {addLeadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                    Add Lead
                </Button>
            </div>
        </motion.div>
    );
}

export default Growth;
