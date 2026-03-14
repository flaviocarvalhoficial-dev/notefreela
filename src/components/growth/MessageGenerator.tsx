import { useState, useRef } from "react";
import {
    MessageSquare,
    Copy,
    Send,
    RefreshCcw,
    Sparkles,
    Mail,
    Smartphone,
    Check,
    Maximize2,
    Minimize2,
    Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { aiService } from "@/services/ai-service";
import { useToast } from "@/hooks/use-toast";
import { NimbusLogoIcon } from "@/components/shared/NimbusLogoIcon";

interface MessageGeneratorProps {
    context: {
        name: string;
        company?: string;
        needs?: string[];
        score?: number;
        userName?: string;
        serviceType?: string;
        companyType?: 'individual' | 'collective';
    };
    initialMessage?: string;
    onMessageUpdate?: (message: string) => void;
    onSend?: (message: string) => void;
}

const MessageGenerator = ({ context, initialMessage = "", onMessageUpdate, onSend }: MessageGeneratorProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState(initialMessage);
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();

    const QUICK_EMOJIS = ["👋", "🚀", "✨", "📈", "🤝", "💡", "📅", "✅", "🔥", "🎯"];

    const addEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            const newMessage = generatedMessage + emoji;
            setGeneratedMessage(newMessage);
            onMessageUpdate?.(newMessage);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = generatedMessage;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const newMessage = before + emoji + after;

        setGeneratedMessage(newMessage);
        onMessageUpdate?.(newMessage);

        // Reset cursor position after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 0);
    };

    const generate = async () => {
        setIsGenerating(true);
        try {
            const isCollective = context.companyType === 'collective';
            const person = isCollective ? "NÓS (1ª pessoa do plural) - Somos uma empresa/equipe" : "EU (1ª pessoa do singular) - Sou um profissional solo";

            const prompt = channel === "whatsapp"
                ? `GERAR MENSAGEM AGORA. 
                PERSONA: Você escreve como ${isCollective ? 'a empresa/estúdio' : 'o profissional'} ${context.userName || 'Especialista'}.
                CONTEXTO: Lead ${context.name} interessado em ${context.serviceType || 'serviços especializados'} para a empresa ${context.company || 'dele'}.
                
                REGRA GRAMATICAL OBRIGATÓRIA: Use a ${person}. Use verbos como "${isCollective ? 'Somos, Temos, Fizemos, Podemos' : 'Sou, Tenho, Fiz, Posso'}".
                
                ESTRUTURA DE APRESENTAÇÃO:
                - Se for coletivo: "Olá [Nome], nós somos da ${context.userName || 'sua parceira estratégica'}..." ou "Nós da ${context.userName}..."
                - Se for individual: "Olá [Nome], eu sou o ${context.userName || 'especialista'}..."
                
                CORPO DA MENSAGEM:
                1. Saudação breve.
                2. Apresentação (conforme regra acima).
                3. Proposta de valor baseada em ${context.serviceType || 'expertise'}.
                4. Chamada para ação amigável (pergunta).`
                : `GERAR E-MAIL AGORA.
                PERSONA: Você escreve como ${isCollective ? 'a empresa/estúdio' : 'o profissional'} ${context.userName || 'Especialista'}.
                CONTEXTO: Lead ${context.name} interessado em ${context.serviceType || 'serviços especializados'}.
                
                REGRA GRAMATICAL OBRIGATÓRIA: Use a ${person}.
                TAREFA: Escreva um e-mail de prospecção profissional e curto com um assunto matador.`;

            const response = await aiService.ask([{ role: 'user', content: prompt }], {
                ...context,
                user_name: context.userName // Alinhando com o que o aiService espera
            });
            setGeneratedMessage(response.content);
            onMessageUpdate?.(response.content);
            toast({
                title: "Mensagem gerada",
                description: "IA criou uma abordagem personalizada baseada no contexto do lead."
            });
        } catch (error) {
            console.error("AI Generation Error:", error);
            toast({
                title: "Erro na IA",
                description: "Não foi possível gerar a mensagem agora.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedMessage);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Copiado para a área de transferência" });
    };

    return (
        <div className={cn("flex flex-col gap-4 p-1 transition-all duration-300", isExpanded ? "min-h-[500px]" : "")}>
            <div className="flex items-center justify-between">
                <div className="flex bg-muted/30 p-1 rounded-lg border border-border/40">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 gap-2 text-[10px] font-bold uppercase transition-all", channel === "whatsapp" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                        onClick={() => setChannel("whatsapp")}
                    >
                        <Smartphone className="h-3.5 w-3.5" /> WhatsApp
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-8 gap-2 text-[10px] font-bold uppercase transition-all", channel === "email" ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}
                        onClick={() => setChannel("email")}
                    >
                        <Mail className="h-3.5 w-3.5" /> E-mail
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className={cn(
                "relative bg-muted/20 border border-border/60 rounded-xl p-4 group transition-all duration-300",
                isExpanded ? "flex-1 min-h-[400px]" : "min-h-[160px]"
            )}>
                {!generatedMessage && !isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                        <MessageSquare className="h-8 w-8 mb-2" />
                        <p className="text-xs font-medium text-center px-8">Clique em gerar para criar uma abordagem de alto impacto.</p>
                    </div>
                ) : null}

                {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/40 backdrop-blur-[1px] z-10 rounded-xl">
                        <NimbusLogoIcon reaction="loading" className="w-20 h-20 mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mt-4">Analisando Lead...</span>
                    </div>
                ) : null}

                {generatedMessage && (
                    <div className="flex flex-col h-full">
                        <textarea
                            ref={textareaRef}
                            value={generatedMessage}
                            onChange={(e) => {
                                setGeneratedMessage(e.target.value);
                                onMessageUpdate?.(e.target.value);
                            }}
                            className="w-full flex-1 bg-transparent border-none resize-none text-xs leading-relaxed text-foreground focus:ring-0 outline-none custom-scrollbar p-0"
                            placeholder="Sua mensagem aparecerá aqui..."
                        />

                        <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-border/40 overflow-x-auto no-scrollbar pb-1">
                            <Smile className="h-3.5 w-3.5 text-muted-foreground shrink-0 mr-1" />
                            {QUICK_EMOJIS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => addEmoji(emoji)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors text-sm shrink-0"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    className="flex-1 bg-primary text-primary-foreground font-semibold gap-2"
                    onClick={generate}
                    disabled={isGenerating}
                >
                    {generatedMessage ? <RefreshCcw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    {generatedMessage ? "Recriar Mensagem" : "Gerar Abordagem"}
                </Button>

                {generatedMessage && (
                    <>
                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-2 px-6"
                            onClick={() => onSend?.(generatedMessage)}
                        >
                            <Send className="h-4 w-4" /> Enviar
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessageGenerator;
