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
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/use-leads";
import { useGrowth, GrowthResult } from "@/hooks/use-growth";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import MessageGenerator from "@/components/growth/MessageGenerator";

const Growth = () => {
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [radius, setRadius] = useState("5km");
    const [currentResults, setCurrentResults] = useState<GrowthResult[]>([]);
    const [activeMessageResult, setActiveMessageResult] = useState<GrowthResult | null>(null);

    const { toast } = useToast();
    const { createLead } = useLeads();
    const { runSearch, isSearching, recentSearches, updateStatus } = useGrowth();

    const handleSearch = async () => {
        if (!query || !location) {
            toast({ title: "Campos obrigatórios", description: "Informe o que buscar e onde buscar.", variant: "destructive" });
            return;
        }

        try {
            const data = await runSearch({ query, location, radius });
            setCurrentResults(data.results as GrowthResult[]);
            toast({
                title: "Busca concluída",
                description: `Encontramos ${data.results.length} potenciais clientes para seu negócio.`
            });
        } catch (error) {
            toast({ title: "Erro na busca", description: "Não foi possível realizar a prospecção.", variant: "destructive" });
        }
    };

    const handleAddAsLead = async (result: GrowthResult) => {
        try {
            await createLead({
                name: result.name,
                company_name: result.name,
                website: result.website,
                phone: result.phone,
                source: "Nimbus Growth",
                score: result.score,
                status: 'novo',
                notes: `Identificado via Nimbus Growth. Necessidades detectadas: ${result.needs.join(', ')}`
            });

            await updateStatus({ id: result.id, status: 'converted' });

            // Update local state to reflect conversion
            setCurrentResults(prev => prev.map(r => r.id === result.id ? { ...r, status: 'converted' } : r));

            toast({
                title: "Lead adicionado!",
                description: `${result.name} agora está no seu pipeline comercial.`
            });
        } catch (error) {
            toast({ title: "Erro", description: "Não foi possível converter em lead.", variant: "destructive" });
        }
    };

    return (
        <div className="page-container relative overflow-hidden h-screen flex flex-col">
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="flex items-center justify-between gap-4 mb-8 h-12 relative z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                        Nimbus Lead Engine <Sparkles className="h-5 w-5 text-primary" />
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Prospecção Inteligente</p>
                </div>

                {recentSearches.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mr-2">Buscas Recentes:</span>
                        {recentSearches.slice(0, 2).map((s) => (
                            <Badge key={s.id} variant="secondary" className="bg-muted/50 border-border h-7 px-3 text-[10px] flex items-center gap-2">
                                <Clock className="h-3 w-3" /> {s.query} em {s.location}
                            </Badge>
                        ))}
                    </div>
                )}
            </header>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-8 relative z-10 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">O que buscar?</label>
                        <Input
                            placeholder="Ex: Cafeterias, Academias..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="h-11 bg-muted/20 border-border"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Onde?</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Ex: São Paulo, Pinheiros..."
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="h-11 pl-9 bg-muted/20 border-border"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground pl-1">Raio (km)</label>
                        <Input
                            placeholder="5km"
                            className="h-11 bg-muted/20 border-border"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                        />
                    </div>
                    <Button
                        className="h-11 bg-primary text-primary-foreground shadow-glow-sm gap-2"
                        onClick={handleSearch}
                        disabled={isSearching}
                    >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        {isSearching ? "Minerando..." : "Iniciar Prospecção"}
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 -mx-2 px-2">
                {currentResults.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
                        <AnimatePresence>
                            {currentResults.map((result, i) => (
                                <ResultCard
                                    key={result.id}
                                    result={result}
                                    index={i}
                                    onAddLead={() => handleAddAsLead(result)}
                                    onMessage={() => setActiveMessageResult(result)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
                        <div className="h-20 w-20 rounded-full bg-muted border border-border flex items-center justify-center mb-4">
                            <Layers className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Aguardando busca...</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">Defina o tipo de empresa e localidade para começar a minerar leads inteligentes.</p>
                    </div>
                )}
            </div>

            <Dialog open={!!activeMessageResult} onOpenChange={(open) => !open && setActiveMessageResult(null)}>
                <DialogContent className="sm:max-w-md border-border/60 shadow-float bg-card">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Nimbus AI Message Generator
                        </DialogTitle>
                    </DialogHeader>
                    {activeMessageResult && (
                        <MessageGenerator
                            context={{
                                name: activeMessageResult.name,
                                company: activeMessageResult.name,
                                needs: activeMessageResult.needs,
                                score: activeMessageResult.score
                            }}
                            onSend={(msg) => {
                                const cleanPhone = activeMessageResult.phone?.replace(/\D/g, '');
                                if (cleanPhone) {
                                    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                }
                                setActiveMessageResult(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

function ResultCard({ result, index, onAddLead, onMessage }: { result: GrowthResult, index: number, onAddLead: () => void, onMessage: () => void }) {
    const [isAdding, setIsAdding] = useState(false);
    const [status, setStatus] = useState(result.status);

    const handleAdd = async () => {
        setIsAdding(true);
        try {
            await onAddLead();
            setStatus('converted');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all shadow-sm group relative",
                status === 'converted' && "opacity-80"
            )}
        >
            {status === 'converted' && (
                <div className="absolute top-3 right-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
            )}

            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-base text-foreground truncate">{result.name}</h4>
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold bg-primary/5 text-primary border-primary/20">
                            Score: {result.score}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        {result.address || "Endereço não disponível"}
                    </p>
                </div>
                {status !== 'converted' && (
                    <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold text-foreground">{result.rating || "--"}</span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">({result.reviews_count || 0})</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {result.needs && result.needs.length > 0 ? result.needs.map((need: string, idx: number) => (
                    <Badge key={idx} className="bg-amber-500/10 text-amber-600 border-none text-[10px] font-semibold px-2 py-0.5">
                        {need}
                    </Badge>
                )) : (
                    <Badge className="bg-muted text-muted-foreground border-none text-[10px] font-semibold px-2 py-0.5">
                        Análise de necessidades pendente
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-foreground font-medium group/link overflow-hidden">
                    <Globe className="h-3 w-3 text-primary/60 shrink-0" />
                    <span className="truncate flex-1">{result.website || "Sem site"}</span>
                    {result.website && <ExternalLink className="h-2.5 w-2.5 hidden group-hover/link:block opacity-40" />}
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-foreground font-medium overflow-hidden">
                    <Phone className="h-3 w-3 text-primary/60 shrink-0" />
                    <span className="truncate flex-1">{result.phone || "Sem telefone"}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                <Button
                    className={cn(
                        "flex-1 h-9 text-xs font-semibold gap-2 rounded-md transition-all shadow-sm",
                        status === 'converted'
                            ? "bg-muted text-muted-foreground cursor-default hover:bg-muted"
                            : "bg-primary text-primary-foreground hover:shadow-md"
                    )}
                    onClick={handleAdd}
                    disabled={isAdding || status === 'converted'}
                >
                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (status === 'converted' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />)}
                    {isAdding ? "Adicionando..." : (status === 'converted' ? "Já é um Lead" : "Adicionar Lead")}
                </Button>
                <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 text-xs font-semibold border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-md shadow-sm"
                    onClick={onMessage}
                    disabled={status === 'converted'}
                >
                    <MessageSquare className="h-3.5 w-3.5" /> {status === 'converted' ? "Chat" : "IA Chat"}
                </Button>
            </div>
        </motion.div>
    );
}

export default Growth;
