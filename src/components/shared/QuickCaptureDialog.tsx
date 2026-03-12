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
                    className="h-9 w-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all shadow-glow-subtle border border-primary/20"
                    title="Captura Rápida (Alt+C)"
                >
                    <Zap className="h-4 w-4 fill-primary/10" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-primary/20 p-0 overflow-hidden">
                <div className="h-1.5 w-full bg-primary shadow-glow" />
                <div className="p-6 space-y-4">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold tracking-tight">
                            <Zap className="h-5 w-5 text-primary" /> Captura Rápida
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground">Não deixe a ideia escapar. Salve agora, organize depois.</p>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="quick-title" className="text-xs text-muted-foreground">O que é isso?</Label>
                            <Input
                                id="quick-title"
                                placeholder="Título curto..."
                                className="glass-light border-border h-9"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Tipo de Entrada</Label>
                                <Select value={type} onValueChange={(val: any) => setType(val)}>
                                    <SelectTrigger className="glass-light border-border h-9 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="glass border-border">
                                        <SelectItem value="idea">
                                            <div className="flex items-center gap-2"><Lightbulb className="h-3 w-3" /> Ideia</div>
                                        </SelectItem>
                                        <SelectItem value="note">
                                            <div className="flex items-center gap-2"><FileText className="h-3 w-3" /> Nota</div>
                                        </SelectItem>
                                        <SelectItem value="prompt">
                                            <div className="flex items-center gap-2"><Terminal className="h-3 w-3" /> Prompt</div>
                                        </SelectItem>
                                        <SelectItem value="snippet">
                                            <div className="flex items-center gap-2"><Type className="h-3 w-3" /> Snippet</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quick-content" className="text-xs text-muted-foreground">Conteúdo / Detalhes</Label>
                            <Textarea
                                id="quick-content"
                                placeholder="Descreva sua ideia, cole um link ou anote um prompt..."
                                className="glass-light border-border min-h-[120px] text-xs resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            className="w-full font-bold shadow-glow"
                            onClick={() => createItemMutation.mutate()}
                            disabled={createItemMutation.isPending || !content}
                        >
                            {createItemMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Check className="h-4 w-4 mr-2" />
                            )}
                            Salvar na Rede de Captura
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
