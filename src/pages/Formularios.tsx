import { useState } from "react";
import { motion } from "framer-motion";
import {
    LayoutGrid,
    Plus,
    Search,
    MoreVertical,
    Link as LinkIcon,
    Copy,
    Eye,
    Trash2,
    Users,
    Clock,
    CheckCircle2,
    Settings,
    FileText,
    Share2,
    MousePointer2,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const MOCK_FORMS = [
    {
        id: "f1",
        title: "Solicitação de Orçamento",
        responses: 24,
        lastResponse: "Há 2 horas",
        status: "ativo",
        type: "lead"
    },
    {
        id: "f2",
        title: "Briefing de Identidade Visual",
        responses: 12,
        lastResponse: "Há 1 dia",
        status: "ativo",
        type: "briefing"
    },
    {
        id: "f3",
        title: "Feedback de Entrega",
        responses: 45,
        lastResponse: "Há 5 dias",
        status: "arquivado",
        type: "feedback"
    }
];

const Formularios = () => {
    const { toast } = useToast();

    const handleCreateForm = () => {
        toast({
            title: "Novo Formulário",
            description: "Iniciando construtor de formulários Nimbus..."
        });
    };

    return (
        <div className="page-container relative overflow-hidden h-screen flex flex-col">
            {/* Blueprint Texture */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, hsl(var(--muted-foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />

            <header className="flex items-center justify-between gap-4 mb-8 h-12 relative z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Formulários & Captação</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">Camada 1: Captura</p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        className="h-9 px-4 rounded-md bg-primary text-primary-foreground shadow-sm gap-2"
                        onClick={handleCreateForm}
                    >
                        <Plus className="h-4 w-4" /> Criar Formulário
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 shrink-0 mb-8">
                <div className="bento-card p-5 border-primary/10 bg-primary/[0.02]">
                    <div className="flex items-center gap-3 mb-4 text-primary">
                        <Users className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Leads Capturados</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground">81</h2>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase">+12% este mês</span>
                    </div>
                </div>
                <div className="bento-card p-5">
                    <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                        <MousePointer2 className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Taxa de Conversão</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground">24.5%</h2>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Média Geral</span>
                    </div>
                </div>
                <div className="bento-card p-5">
                    <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Briefings Gerados</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-semibold tracking-tight text-foreground">15</h2>
                        <span className="text-[10px] font-bold text-amber-500 uppercase">3 pendentes</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 mb-6 relative z-10 shrink-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input
                        placeholder="Buscar formulários..."
                        className="pl-9 h-10 bg-card/50 border-border/60 rounded-md"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 -mx-2 px-2 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOCK_FORMS.map((form, i) => (
                        <FormCard key={form.id} form={form} index={i} />
                    ))}

                    <button
                        onClick={handleCreateForm}
                        className="bento-card p-6 border-dashed border-primary/20 bg-primary/[0.01] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-primary/[0.03] transition-all h-[180px]"
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Plus className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Novo Fluxo de Captura</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

function FormCard({ form, index }: { form: any, index: number }) {
    const { toast } = useToast();

    const copyLink = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(`https://nimbus.app/f/${form.id}`);
        toast({ title: "Link copiado!", description: "Envie para seu cliente ou divulgue em suas redes." });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-card border border-border hover:border-primary/40 rounded-xl p-5 shadow-sm transition-all cursor-pointer hover:shadow-md h-[180px] flex flex-col"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn(
                            "px-1.5 py-0 h-4 text-[9px] font-bold uppercase tracking-wider border-none",
                            form.status === 'ativo' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                        )}>
                            {form.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest opacity-40">{form.type}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {form.title}
                    </h4>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground -mr-2" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="text-xs gap-2"><Eye className="h-3.5 w-3.5" /> Ver Respostas</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2" onClick={copyLink}><Copy className="h-3.5 w-3.5" /> Copiar Link</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs gap-2"><Settings className="h-3.5 w-3.5" /> Configurar</DropdownMenuItem>
                        <div className="h-px bg-border my-1" />
                        <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Arquivar</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex items-center gap-8 mb-4">
                <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Respostas</span>
                    <span className="text-xl font-semibold tabular-nums text-foreground">{form.responses}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Última em</span>
                    <span className="text-xs font-medium text-foreground">{form.lastResponse}</span>
                </div>
            </div>

            <div className="flex gap-2 mt-auto">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-[10px] font-bold uppercase tracking-tight gap-2" onClick={copyLink}>
                    <Share2 className="h-3 w-3" /> Link de Captura
                </Button>
                <Button size="sm" className="h-8 w-8 rounded-md bg-secondary text-primary hover:bg-primary hover:text-white transition-all">
                    <ArrowRight className="h-3.5 w-3.5" />
                </Button>
            </div>
        </motion.div>
    );
}

export default Formularios;
