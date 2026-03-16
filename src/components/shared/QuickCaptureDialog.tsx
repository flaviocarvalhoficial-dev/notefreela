import { useState } from "react";
import { Zap, Loader2, Lightbulb, Terminal, FileText, Type, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function QuickCaptureDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState<'idea' | 'prompt' | 'snippet' | 'note'>('idea');

    const resetForm = () => {
        setTitle("");
        setContent("");
        setType('idea');
    };

    const createItemMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { error } = await supabase.from("inbox").insert({
                user_id: user.id,
                title: title || "Captura Rápida",
                content,
                type,
                category: "Captura Rápida",
                tags: ["quick-capture"]
            });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
            queryClient.invalidateQueries({ queryKey: ["inbox-sidebar"] });
            toast({
                title: "🚀 Capturado!",
                description: "Item adicionado à sua Rede de Captura.",
            });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ title: "Erro ao capturar", description: error.message, variant: "destructive" });
        }
    });

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-120 border border-primary/10"
                    title="Captura Rápida (Alt+C)"
                >
                    <Zap className="h-4 w-4 fill-primary/10" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border/40 p-0 overflow-hidden shadow-float">
                <div className="h-1 w-full bg-primary" />
                <div className="p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-medium tracking-tight">
                            <Zap className="h-5 w-5 text-primary" /> Captura Rápida
                        </DialogTitle>
                        <p className="text-[11px] text-muted-foreground/70">Não deixe a ideia escapar. Salve agora, organize depois.</p>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="quick-title" className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">O que é isso?</Label>
                            <Input
                                id="quick-title"
                                placeholder="Título curto..."
                                className="bg-muted/30 border-border/40 h-10"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Tipo de Entrada</Label>
                                <Select value={type} onValueChange={(val: any) => setType(val)}>
                                    <SelectTrigger className="bg-muted/30 border-border/40 h-10 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border/40">
                                        <SelectItem value="idea">
                                            <div className="flex items-center gap-2"><Lightbulb className="h-3.5 w-3.5" /> Ideia</div>
                                        </SelectItem>
                                        <SelectItem value="note">
                                            <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Nota</div>
                                        </SelectItem>
                                        <SelectItem value="prompt">
                                            <div className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5" /> Prompt</div>
                                        </SelectItem>
                                        <SelectItem value="snippet">
                                            <div className="flex items-center gap-2"><Type className="h-3.5 w-3.5" /> Snippet</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="quick-content" className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">Conteúdo / Detalhes</Label>
                            <Textarea
                                id="quick-content"
                                placeholder="Descreva sua ideia, cole um link ou anote um prompt..."
                                className="bg-muted/30 border-border/40 min-h-[120px] text-xs resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            className="w-full font-medium shadow-sm transition-all duration-200 rounded-lg"
                            onClick={() => createItemMutation.mutate()}
                            disabled={createItemMutation.isPending || !content}
                        >
                            {createItemMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Zap className="h-4 w-4 mr-2" />
                            )}
                            Capturar Informação
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
