import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BrainCircuit,
    Send,
    Bot,
    User,
    Sparkles,
    Terminal,
    Zap,
    Briefcase,
    Target,
    HandCoins,
    ChevronDown,
    PlusCircle,
    Copy,
    Share2,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { useAIContext } from "@/hooks/use-ai-context";
import { aiService, Message } from "@/services/ai-service";
import { AIChatMessage } from "@/components/ai/AIChatMessage";
import { CopilotInsights } from "@/components/ai/CopilotInsights";
import { NimbusLogoIcon } from "@/components/shared/NimbusLogoIcon";

const MOCK_MESSAGES: (Message & { id: string, timestamp: string })[] = [
    {
        id: "1",
        role: "assistant",
        content: "Olá! Sou o Nimbus Partner, seu copiloto de operação. Como posso ajudar você a escalar sua carreira hoje?",
        timestamp: "10:00"
    }
];

const SUGGESTIONS = [
    { label: "Analisar lucratividade dos projetos", prompt: "/diagnostico" },
    { label: "Sugestão de precificação para Web Design", prompt: "Pode me dar uma sugestão de precificação para Web Design?" },
    { label: "Detectar gargalos na minha semana", prompt: "/proxima" },
    { label: "Gerar proposta para novo lead", prompt: "/radar" },
];

const NimbusAI = () => {
    const [messages, setMessages] = useState(MOCK_MESSAGES);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const context = useAIContext();

    const handleSend = async (overrideInput?: string) => {
        const text = overrideInput || input;
        if (!text.trim() || isTyping) return;

        const userMsg = {
            id: Date.now().toString(),
            role: "user" as const,
            content: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const currentMessages = [...messages];
        const newMessages = [...currentMessages, userMsg];
        setMessages(newMessages);
        if (!overrideInput) setInput("");
        setIsTyping(true);

        try {
            // Use unified aiService with advanced context enrichment
            const response = await aiService.ask(newMessages.map(({ role, content }) => ({ role, content })), context);

            const aiResponse = {
                id: (Date.now() + 1).toString(),
                role: "assistant" as const,
                content: response.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("AI Assistant Error:", error);
        } finally {
            setIsTyping(false);
        }
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

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10 shrink-0">
                <div className="space-y-1">
                    <div className="flex items-center gap-4">
                        <NimbusLogoIcon className="w-12 h-12" reaction={isTyping ? "loading" : "static"} />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold tracking-[0.2em] text-primary/70 uppercase">Artificial Intelligence</span>
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Nimbus Partner</h1>
                        </div>
                    </div>
                    <p className="text-muted-foreground font-normal text-sm max-w-md italic">Seu consultor estratégico 24/7 alimentado pelos dados da sua operação.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 px-3 border-primary/20 bg-primary/5 text-primary text-[10px] font-bold uppercase tracking-widest gap-2">
                        <Sparkles className="h-3 w-3" /> Partner v1.0
                    </Badge>
                </div>
            </header>

            <div className="flex-1 flex flex-col min-h-0 bg-card/40 backdrop-blur-md rounded-2xl border border-border/60 relative z-10 overflow-hidden shadow-float">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    {/* Proactive insights at the top of chat area */}
                    <CopilotInsights context={context} onAction={(p) => handleSend(p)} />

                    <AnimatePresence initial={false}>
                        {messages
                            .filter(msg => msg.role !== 'system')
                            .map((msg) => (
                                <AIChatMessage
                                    key={msg.id}
                                    role={msg.role as "user" | "assistant"}
                                    content={msg.content}
                                    isProjectContext={context.is_project_context}
                                />
                            ))}
                    </AnimatePresence>
                    {isTyping && (
                        <div className="flex items-center gap-4 max-w-[80%]">
                            <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 border border-border shadow-sm">
                                <BrainCircuit className="h-4 w-4 animate-pulse" />
                            </div>
                            <div className="bg-card border border-border/60 text-foreground p-4 rounded-2xl rounded-tl-none flex gap-1">
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce" />
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="h-1.5 w-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestions Area */}
                {messages.length < 3 && (
                    <div className="p-6 pt-0 flex flex-wrap gap-2">
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(s.prompt)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-[11px] font-medium text-muted-foreground hover:text-primary active:scale-95"
                            >
                                <Zap className="h-3 w-3" />
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-muted/10 border-t border-border/60">
                    <div className="relative group">
                        <Input
                            placeholder="Pergunte qualquer coisa sobre sua operação..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            className="pr-12 h-12 bg-card border-border/60 rounded-xl shadow-inner focus-visible:ring-primary/20 group-focus-within:border-primary/40 transition-all"
                        />
                        <Button
                            size="icon"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || isTyping}
                            className="absolute right-1.5 top-1.5 h-9 w-9 bg-primary text-primary-foreground rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-muted-foreground/60 font-medium uppercase tracking-widest">
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> /diagnostico</span>
                            <span className="flex items-center gap-1"><Terminal className="h-3 w-3" /> /previsao</span>
                        </div>
                        <div className="flex gap-4">
                            <RefreshCw className="h-3 w-3 cursor-pointer hover:rotate-180 transition-all duration-500" />
                            <Share2 className="h-3 w-3 cursor-pointer hover:text-primary transition-colors" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NimbusAI;
