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
    ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { aiService, Message } from "@/services/ai-service";
import { useAIContext } from "@/hooks/use-ai-context";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export function AIAssistantSidebar() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const context = useAIContext();
    const { toast } = useToast();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await aiService.ask([...messages, userMessage], context);
            setMessages(prev => [...prev, response]);
        } catch (error) {
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
        <div className="flex flex-col h-full bg-sidebar-accent/30 backdrop-blur-sm rounded-l-xl border-l border-sidebar-border animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-sidebar-border flex items-center justify-between bg-sidebar-accent/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-sidebar-border flex items-center justify-center overflow-hidden p-0.5 group-hover:rotate-3 transition-transform">
                        <img src="/ai-partner.png" alt="AI Partner" className="w-full h-full object-cover" />
                    </div>
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
                <ScrollArea className="flex-1 pr-4" viewportRef={scrollRef}>
                    <AnimatePresence initial={false}>
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center h-full py-12 text-center"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                    <Bot className="h-6 w-6 text-primary/40" />
                                </div>
                                <h3 className="text-[13px] font-semibold text-foreground mb-1">Como posso ajudar?</h3>
                                <p className="text-[11px] text-muted-foreground max-w-[200px] leading-relaxed">
                                    Estou pronto para analisar seu contexto e sugerir as melhores rotas para seu trabalho.
                                </p>

                                <div className="mt-8 w-full flex flex-col gap-2">
                                    <p className="text-[9px] uppercase font-bold text-muted-foreground/40 tracking-widest text-left px-2">Sugestões Contextuais</p>
                                    {quickActions.map((action, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setInput(action.prompt); handleSend(); }}
                                            className="text-left p-2.5 rounded-lg border border-sidebar-border hover:border-primary/30 hover:bg-primary/5 transition-all group"
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

                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={cn(
                                    "mb-4 flex flex-col",
                                    msg.role === 'user' ? "items-end" : "items-start"
                                )}
                            >
                                <div className={cn(
                                    "max-w-[90%] p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-tr-none"
                                        : "bg-sidebar-accent border border-sidebar-border text-foreground rounded-tl-none"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[9px] text-muted-foreground/50 mt-1 px-1">
                                    {msg.role === 'user' ? 'Você' : 'Assistente'}
                                </span>
                            </motion.div>
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
                </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-sidebar-border bg-sidebar/40">
                <div className="relative group">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Pergunte qualquer coisa..."
                        className="pr-10 bg-background/50 border-sidebar-border focus-visible:ring-primary/20 h-10 text-xs rounded-xl"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                            "absolute right-1 top-1 h-8 w-8 text-primary transition-all",
                            input.trim() ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        )}
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-[9px] text-muted-foreground/40 text-center mt-2 flex items-center justify-center gap-1">
                    <Info className="h-2 w-2" /> Nimbus Command Center • gpt-4o-mini
                </p>
            </div>
        </div>
    );
}

const Info = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
);
