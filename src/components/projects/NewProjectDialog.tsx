import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

type ProjectStatus = "active" | "planning" | "review" | "completed";

interface NewProjectDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function NewProjectDialog({ open: externalOpen, onOpenChange: setExternalOpen, trigger }: NewProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form State
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newStatus, setNewStatus] = useState<ProjectStatus>("planning");
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
    const [newDeadline, setNewDeadline] = useState("");

    const resetForm = () => {
        setNewName("");
        setNewDesc("");
        setNewStatus("planning");
        setNewPriority("medium");
        setNewDeadline("");
    };

    const createProjectMutation = useMutation({
        mutationFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await supabase
                .from("projects")
                .insert({
                    name: newName,
                    description: newDesc,
                    status: newStatus,
                    priority: newPriority,
                    deadline: newDeadline || null,
                    user_id: user.id,
                    progress: 0,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            toast({
                title: "Sucesso!",
                description: "Projeto criado com sucesso.",
            });
            setOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao criar projeto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
        }}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="glass border-border/50 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Criar Novo Projeto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Nome do Projeto</Label>
                        <Input
                            id="project-name"
                            placeholder="Ex: Redesign Dashboard"
                            className="glass-light border-border/50"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-desc">Descrição</Label>
                        <Input
                            id="project-desc"
                            placeholder="Breve descrição do projeto"
                            className="glass-light border-border/50"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                                <SelectTrigger className="glass-light border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-border/50 z-50">
                                    <SelectItem value="planning">Planejamento</SelectItem>
                                    <SelectItem value="active">Em Progresso</SelectItem>
                                    <SelectItem value="review">Em Revisão</SelectItem>
                                    <SelectItem value="completed">Concluído</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Prioridade</Label>
                            <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                                <SelectTrigger className="glass-light border-border/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass border-border/50 z-50">
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="low">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-deadline">Prazo</Label>
                        <Input
                            id="project-deadline"
                            type="date"
                            className="glass-light border-border/50 [color-scheme:dark]"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="outline"
                            className="flex-1 glass-light border-border/50"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            onClick={() => createProjectMutation.mutate()}
                            disabled={createProjectMutation.isPending || !newName}
                        >
                            {createProjectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Projeto"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
