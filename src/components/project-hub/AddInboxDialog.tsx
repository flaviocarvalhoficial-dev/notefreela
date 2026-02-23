
import { useState } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

interface AddInboxDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId?: string;
    onConfirm?: (item: any) => void;
}

export function AddInboxDialog({ open, onOpenChange, projectId, onConfirm }: AddInboxDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState("note");

    const createInboxMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Não autenticado");

            const { data, error } = await supabase.from("inbox").insert({
                title,
                content,
                type,
                project_id: projectId,
                user_id: user.id,
            }).select().single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ["project-inbox", projectId] });
            toast({ title: "Captura realizada", description: "O item foi adicionado à sua inbox." });
            onOpenChange(false);
            if (onConfirm) onConfirm(data);
            setTitle("");
            setContent("");
        },
        onError: (error: any) => {
            toast({ title: "Erro ao capturar", description: error.message, variant: "destructive" });
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="border-border/50 max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 text-primary rounded-lg">
                            <Inbox className="h-5 w-5" />
                        </div>
                        Capturar para Inbox
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Título (Opcional)</Label>
                        <Input
                            placeholder="Dê um nome curto para a ideia..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="glass-light border-border/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger className="glass-light border-border/50">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass border-border/50">
                                <SelectItem value="note">Nota / Texto</SelectItem>
                                <SelectItem value="idea">Ideia / Insight</SelectItem>
                                <SelectItem value="prompt">Prompt de IA</SelectItem>
                                <SelectItem value="snippet">Snippet de Código</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Conteúdo</Label>
                        <Textarea
                            placeholder="O que você está pensando?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[120px] glass-light border-border/50 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button
                            className="bg-primary text-primary-foreground hover:opacity-90"
                            onClick={() => createInboxMutation.mutate()}
                            disabled={createInboxMutation.isPending || !content}
                        >
                            {createInboxMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Capturar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
