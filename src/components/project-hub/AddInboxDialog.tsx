
import { useState, useEffect } from "react";
import { Inbox, Loader2, Zap, Lightbulb, Terminal, Type, FileText, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface AddInboxDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId?: string;
    initialType?: string;
    onConfirm?: (item: any) => void;
}

export function AddInboxDialog({ open, onOpenChange, projectId, initialType = "idea", onConfirm }: AddInboxDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState(initialType);

    useEffect(() => {
        if (open) {
            setType(initialType);
            setTitle("");
            setContent("");
        }
    }, [open, initialType]);

    const createInboxMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await (supabase as any).from("inbox").insert({
                title: title.trim(),
                content: content.trim(),
                type,
                project_id: projectId,
                user_id: user.id,
                created_at: new Date().toISOString()
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({ title: "Capturado!", description: "O item foi guardado na sua rede de captura." });
            onOpenChange(false);
            if (onConfirm) onConfirm(data);
        },
        onError: (error: any) => {
            toast({ title: "Erro ao capturar", description: error.message, variant: "destructive" });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-[#E5E7EB] dark:bg-[#1A1C1E] rounded-[24px]">
                <div className="p-8 space-y-6">
                    <header className="space-y-1 relative">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="absolute -top-2 -right-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                <Zap className="h-6 w-6 text-primary fill-primary/20" />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground/90">Captura Rápida</h2>
                        </div>
                        <p className="text-[13px] text-muted-foreground font-medium pl-13">
                            Não deixe a ideia escapar. Salve agora, organize depois.
                        </p>
                    </header>

                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[12px] font-semibold text-muted-foreground flex items-center gap-2">
                                <Type className="h-3 w-3" /> O que é isso?
                            </Label>
                            <Input
                                placeholder="Título curto..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 bg-white dark:bg-[#25282C] border-2 border-transparent focus:border-primary/30 rounded-xl text-sm font-medium transition-all shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[12px] font-semibold text-muted-foreground flex items-center gap-2">
                                <LayoutGrid className="h-3 w-3" /> Tipo de Entrada
                            </Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-12 bg-white dark:bg-[#25282C] border-2 border-transparent focus:border-primary/30 rounded-xl text-sm font-medium shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border shadow-2xl bg-white dark:bg-[#25282C]">
                                    <SelectItem value="idea" className="py-3 rounded-lg"><div className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" /> Ideia / Insight</div></SelectItem>
                                    <SelectItem value="prompt" className="py-3 rounded-lg"><div className="flex items-center gap-2"><Terminal className="h-4 w-4 text-primary" /> Prompt de IA</div></SelectItem>
                                    <SelectItem value="note" className="py-3 rounded-lg"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Nota Contextual</div></SelectItem>
                                    <SelectItem value="snippet" className="py-3 rounded-lg"><div className="flex items-center gap-2"><Type className="h-4 w-4 text-primary" /> Snippet de Código</div></SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[12px] font-semibold text-muted-foreground flex items-center gap-2">
                                <Inbox className="h-3 w-3" /> Conteúdo / Detalhes
                            </Label>
                            <Textarea
                                placeholder="Descreva sua ideia, cole um link ou anote um prompt..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[140px] bg-white dark:bg-[#25282C] border-2 border-transparent focus:border-primary/30 rounded-2xl text-sm leading-relaxed p-4 transition-all shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    <footer className="pt-2">
                        <Button
                            className={cn(
                                "w-full h-14 rounded-xl text-white font-bold text-base shadow-lg transition-all transform active:scale-[0.98]",
                                createInboxMutation.isPending || !content ? "bg-primary opacity-50 grayscale" : "bg-primary hover:bg-primary shadow-primary/20"
                            )}
                            onClick={() => createInboxMutation.mutate()}
                            disabled={createInboxMutation.isPending || !content}
                        >
                            {createInboxMutation.isPending ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <Check className="h-5 w-5" />
                                    <span>Salvar na Rede de Captura</span>
                                </div>
                            )}
                        </Button>
                    </footer>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Helper icons added locally to avoid extra imports if possible (LayoutGrid was missing from lucide-react imports above)
function LayoutGrid(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    )
}

