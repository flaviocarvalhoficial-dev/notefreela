import { useState } from "react";
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
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLeads } from "@/hooks/use-leads";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import MessageGenerator from "@/components/growth/MessageGenerator";

const MOCK_RESULTS = [
    {
        id: "r1",
        name: "Café Jardim Botânico",
        address: "Rua Jardim, 123",
        website: "cafejardim.com.br",
        phone: "(11) 3333-2222",
        rating: 4.8,
        reviews: 156,
        needs: ["Péssima Presença Digital", "Sem Site Mobile"],
        score: 92
    },
    {
        id: "r2",
        name: "Academia Flex",
        address: "Av. Principal, 456",
        website: "-",
        phone: "(11) 4444-5555",
        rating: 4.2,
        reviews: 89,
        needs: ["Sem Site", "Sem Google My Business"],
        score: 88
    },
    {
        id: "r3",
        name: "Pet Shop Amicão",
        address: "Rua das Flores, 789",
        website: "amicao.com.br",
        phone: "(11) 2222-1111",
        rating: 3.5,
        reviews: 34,
        needs: ["Baixa Atividade no Instagram"],
        score: 75
    }
];

const Growth = () => {
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("");
    const [activeMessageResult, setActiveMessageResult] = useState<any | null>(null);
    const { toast } = useToast();
    const { createLead } = useLeads();

    const handleSearch = () => {
        if (!query) return;
        setIsSearching(true);
        // Simulation of AI Search
        setTimeout(() => {
            setResults(MOCK_RESULTS);
            setIsSearching(false);
            toast({
                title: "Busca concluída",
                description: `Encontramos ${MOCK_RESULTS.length} potenciais clientes para seu negócio.`
            });
        }, 2000);
    };

    const handleAddAsLead = async (result: any) => {
        try {
            await createLead({
                name: result.name,
                company_name: result.name,
                website: result.website !== '-' ? result.website : null,
                phone: result.phone,
                source: "Nimbus Growth",
                score: result.score,
                status: 'novo',
                notes: `Identificado na busca: ${query} em ${location}. Necessidades: ${result.needs.join(', ')}`
            });

            toast({
                title: "Lead adicionado",
                description: `${result.name} agora está no seu pipeline.`
            });
        } catch (error) {
            toast({
                title: "Erro ao adicionar",
                description: "Não foi possível converter o resultado em lead.",
                variant: "destructive"
            });
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
                        <Input placeholder="5km" className="h-11 bg-muted/20 border-border" defaultValue="5km" />
                    </div>
                    <Button
                        className="h-11 bg-primary text-primary-foreground shadow-glow-sm gap-2"
                        onClick={handleSearch}
                        disabled={isSearching}
                    >
                        {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Iniciar Prospecção
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 -mx-2 px-2">
                {results.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">
                        <AnimatePresence>
                            {results.map((result, i) => (
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
                        <p className="text-sm text-muted-foreground max-w-xs mt-1">Defina o tipo de empresa e localidade para começar a minerar leads.</p>
                    </div>
                )}
            </div>

            <Dialog open={!!activeMessageResult} onOpenChange={(open) => !open && setActiveMessageResult(null)}>
                <DialogContent className="sm:max-w-md border-border/60 shadow-float">
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
                                window.open(`https://wa.me/${activeMessageResult.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                setActiveMessageResult(null);
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

function ResultCard({ result, index, onAddLead, onMessage }: { result: any, index: number, onAddLead: () => void, onMessage: () => void }) {
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        setIsAdding(true);
        await onAddLead();
        setIsAdding(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all shadow-sm group"
        >
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
                        {result.address}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-foreground">{result.rating}</span>
                    <span className="text-[10px] text-muted-foreground ml-0.5">({result.reviews})</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {result.needs.map((need: string, idx: number) => (
                    <Badge key={idx} className="bg-amber-500/10 text-amber-600 border-none text-[10px] font-semibold px-2">
                        {need}
                    </Badge>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-foreground font-medium">
                    <Globe className="h-3 w-3 text-primary/60" />
                    <span className="truncate">{result.website}</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50 text-[11px] text-foreground font-medium">
                    <Phone className="h-3 w-3 text-primary/60" />
                    <span className="truncate">{result.phone}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                <Button
                    className="flex-1 h-9 bg-primary text-primary-foreground text-xs font-semibold gap-2 rounded-md"
                    onClick={handleAdd}
                    disabled={isAdding}
                >
                    {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {isAdding ? "Adicionando..." : "Adicionar Lead"}
                </Button>
                <Button
                    variant="outline"
                    className="h-9 px-3 gap-2 text-xs font-semibold border-border bg-secondary hover:bg-secondary/80 text-foreground rounded-md"
                    onClick={onMessage}
                >
                    <MessageSquare className="h-3.5 w-3.5" /> IA Chat
                </Button>
            </div>
        </motion.div>
    );
}

export default Growth;
