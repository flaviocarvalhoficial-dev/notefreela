import { useState, useRef, useEffect } from "react";
import {
    Send,
    Sparkles,
    Trash2,
    Bot,
    User,
    X,
    Plus,
    Zap,
    Loader2,
    ChevronUp,
    Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiService, Message } from "@/services/ai-service";
import { useAIContext } from "@/hooks/use-ai-context";
import { AIChatMessage } from "@/components/ai/AIChatMessage";
import { CopilotInsights } from "@/components/ai/CopilotInsights";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { NimbusLogoIcon } from "@/components/shared/NimbusLogoIcon";

export function AIAssistantSidebar() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const context = useAIContext();
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isLoading]);

    const handleSend = async (overrideInput?: string) => {
        const text = overrideInput || input;
        if (!text.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        if (!overrideInput) setInput("");
        setIsLoading(true);

        try {
            const response = await aiService.ask([...messages, userMessage], context);
            setMessages(prev => [...prev, response]);
        } catch (error) {
            console.error("AI Sidebar Error Details:", error);
            toast({
                title: "Erro na IA",
                description: "Não foi possível obter uma resposta agora. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAI = () => {
        window.dispatchEvent(new CustomEvent("toggle-ai-assistant"));
    };

    const clearChat = () => {
        setMessages([]);
        toast({
            title: "Chat limpo",
            description: "O histórico de conversa foi removido.",
        });
    };

    const quickActions = [
        { label: "Resumir Projeto", prompt: "Pode me dar um resumo rápido do status deste projeto?" },
        { label: "Sugestões de Tarefas", prompt: "Baseado no contexto, que tarefas você sugere para avançar neste projeto?" },
        { label: "Gerar Ideias", prompt: "Me dê 3 ideias criativas para este projeto." }
    ];

    return (
        <div className="flex flex-col h-full bg-sidebar-accent/30 backdrop-blur-sm rounded-l-xl border-none animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-none flex items-center justify-between bg-sidebar-accent/50">
                <div className="flex items-center gap-3">
                    <NimbusLogoIcon className="w-10 h-10" reaction={isLoading ? "loading" : "static"} />
                    <div>
                        <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
                            Nimbus Partner
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </h2>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Cockpit Interface</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={clearChat} title="Limpar conversa">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={toggleAI} title="Fechar assistente">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 relative">
                {/* Context Indicator */}
                <div className="mb-4 flex items-center justify-between px-2 py-1.5 rounded-lg bg-primary/5 border-none">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            context.global_overview ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500 animate-pulse"
                        )} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                            {context.is_project_context ? `Contexto: ${context.project?.name}` : "Contexto Global Ativo"}
                        </span>
                    </div>
                    {context.global_overview && (
                        <span className="text-[9px] font-medium text-emerald-600/70 bg-emerald-50 px-1.5 py-0.5 rounded border-none italic">
                            Dados atualizados
                        </span>
                    )}
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="flex flex-col">
                        <AnimatePresence initial={false}>
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col h-full py-4 text-center"
                                >
                                    {/* Proactive Insights at the top */}
                                    <CopilotInsights context={context} onAction={(p) => handleSend(p)} />

                                    <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-4 mx-auto">
                                        <Bot className="h-6 w-6 text-primary/40" />
                                    </div>
                                    <h3 className="text-[13px] font-semibold text-foreground mb-1">
                                        Olá! Sou seu Nimbus Partner.
                                    </h3>
                                    <p className="text-[11px] text-muted-foreground max-w-full leading-relaxed mb-6 px-4">
                                        {context.is_project_context
                                            ? `Estou analisando o projeto "${context.project?.name}" e seus dados globais para te ajudar.`
                                            : "Estou pronto para analisar seu workspace e sugerir as melhores rotas estratégicas."
                                        }
                                    </p>

                                    <div className="w-full flex flex-col gap-2">
                                        <p className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-widest text-left px-2">SugestÕES Contextuais</p>
                                        {(context.is_project_context ? [
                                            { label: "Resumir este projeto", prompt: `Me dê um resumo estratégico do projeto ${context.project?.name} com base nos dados que você tem.` },
                                            { label: "Próximos passos", prompt: "Quais as tarefas prioritárias para este projeto agora?" },
                                            { label: "Análise de saúde", prompt: "Como você avalia a saúde deste projeto (prazos e tarefas)?" }
                                        ] : [
                                            { label: "Resumo da Operação", prompt: "/diagnostico" },
                                            { label: "Análise de Leads", prompt: "/radar" },
                                            { label: "Visão Geral", prompt: "Pode me dar um diagnóstico rápido da minha operação freelancer hoje?" }
                                        ]).map((action, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleSend(action.prompt)}
                                                className="text-left p-2.5 rounded-lg border-none hover:bg-primary/5 transition-all group"
                                            >
                                                <span className="text-[11px] text-muted-foreground group-hover:text-foreground inline-flex items-center gap-2">
                                                    <Zap className="h-3 w-3 text-primary/40 group-hover:text-primary" />
                                                    {action.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {messages
                                .filter(msg => msg.role !== 'system')
                                .map((msg, idx) => (
                                    <AIChatMessage
                                        key={idx}
                                        role={msg.role as "user" | "assistant"}
                                        content={msg.content}
                                        isProjectContext={context.is_project_context}
                                    />
                                ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2 text-muted-foreground p-2"
                                >
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span className="text-[11px] italic">Pensando...</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div ref={scrollRef} /> {/* Dedicated scroll anchor */}
                    <div className="h-4" />
                </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 border-none bg-sidebar/40">
                <div className="relative group">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pergunte qualquer coisa ou use /comandos..."
                        className="pr-10 bg-background/50 border-none focus-visible:ring-primary/20 h-10 text-xs rounded-xl"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "absolute right-1 top-1 h-8 w-8 text-primary transition-all",
                            input.trim() ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        )}
                        onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex flex-col gap-2 mt-3">
                    <div className="flex items-center gap-3 px-1 overflow-x-auto custom-scrollbar-hide pb-0.5">
                        <button onClick={() => { setInput("/diagnostico"); }} className="shrink-0 text-[10px] font-bold text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider">
                            <Terminal className="h-2.5 w-2.5" /> /diagnostico
                        </button>
                        <button onClick={() => { setInput("/radar"); }} className="shrink-0 text-[10px] font-bold text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider">
                            <Terminal className="h-2.5 w-2.5" /> /radar
                        </button>
                        <button onClick={() => { setInput("/proxima"); }} className="shrink-0 text-[10px] font-bold text-muted-foreground/50 hover:text-primary transition-colors flex items-center gap-1 uppercase tracking-wider">
                            <Terminal className="h-2.5 w-2.5" /> /proxima
                        </button>
                    </div>
                    <p className="text-[9px] text-muted-foreground/30 text-center flex items-center justify-center gap-1 font-medium uppercase tracking-[0.1em]">
                        <Info className="h-2 w-2" /> Nimbus Command Center • Gemini 1.5
                    </p>
                </div>
            </div>
        </div>
    );
}

const Info = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
