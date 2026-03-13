import { useState } from "react";
import {
    MessageSquare,
    Copy,
    Send,
    RefreshCcw,
    Sparkles,
    Mail,
    Smartphone,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGeminiResponse } from "@/services/gemini";
import { useToast } from "@/hooks/use-toast";

interface MessageGeneratorProps {
    context: {
        name: string;
        company?: string;
        needs?: string[];
        score?: number;
    };
    onSend?: (message: string) => void;
}

const MessageGenerator = ({ context, onSend }: MessageGeneratorProps) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState("");
    const [copied, setCopied] = useState(false);
    const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
    const { toast } = useToast();

    const generate = async () => {
        setIsGenerating(true);
        try {
            const prompt = channel === "whatsapp"
                ? `Gere uma mensagem curta e persuasiva para WhatsApp abordando o lead ${context.name} da empresa ${context.company}. Foque nestas necessidades: ${context.needs?.join(', ')}. O tom deve ser profissional, direto e amigável.`
                : `Gere um e-mail de prospecção profissional para ${context.name} da empresa ${context.company}. O e-mail deve incluir um assunto cativante, abordar as necessidades (${context.needs?.join(', ')}) e propor uma breve reunião.`;

            const msg = await getGeminiResponse(prompt, { leadContext: context });
            setGeneratedMessage(msg);
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
        <div className="flex flex-col gap-4 p-1">
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

                <Badge variant="outline" className="gap-1.5 py-1 px-2 border-primary/20 bg-primary/5 text-primary">
                    <Sparkles className="h-3 w-3" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">IA Powered</span>
                </Badge>
            </div>

            <div className="relative min-h-[160px] bg-muted/20 border border-border/60 rounded-xl p-4 group">
                {!generatedMessage && !isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                        <MessageSquare className="h-8 w-8 mb-2" />
                        <p className="text-xs font-medium text-center px-8">Clique em gerar para criar uma abordagem de alto impacto.</p>
                    </div>
                ) : null}

                {isGenerating ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/40 backdrop-blur-[1px] z-10 rounded-xl">
                        <Sparkles className="h-6 w-6 text-primary animate-pulse mb-2" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Analisando Lead...</span>
                    </div>
                ) : null}

                {generatedMessage && (
                    <textarea
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                        className="w-full h-full min-h-[140px] bg-transparent border-none resize-none text-xs leading-relaxed text-foreground focus:ring-0 custom-scrollbar"
                    />
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
