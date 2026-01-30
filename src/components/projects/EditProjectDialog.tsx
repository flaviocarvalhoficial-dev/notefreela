import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";

type ProjectStatus = "active" | "planning" | "review" | "completed";

interface Project {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    deadline: string | null;
    progress: number;
}

interface EditProjectDialogProps {
    project: Project;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function EditProjectDialog({ project, open: externalOpen, onOpenChange: setExternalOpen, trigger }: EditProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = externalOpen !== undefined;
    const open = isControlled ? externalOpen : internalOpen;
    const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Form State
    const [newName, setNewName] = useState(project.name);
    const [newDesc, setNewDesc] = useState(project.description || "");
    const [newStatus, setNewStatus] = useState<ProjectStatus>(project.status as ProjectStatus);
    const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">(project.priority as any);
    const [newDeadline, setNewDeadline] = useState(project.deadline || "");
    const [newProgress, setNewProgress] = useState(project.progress);

    useEffect(() => {
        if (open) {
            setNewName(project.name);
            setNewDesc(project.description || "");
            setNewStatus(project.status as ProjectStatus);
            setNewPriority(project.priority as any);
            setNewDeadline(project.deadline || "");
            setNewProgress(project.progress);
        }
    }, [open, project]);

    const updateProjectMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from("projects")
                .update({
                    name: newName,
                    description: newDesc,
                    status: newStatus,
                    priority: newPriority,
                    deadline: newDeadline || null,
                    progress: newProgress,
                })
                .eq("id", project.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
            queryClient.invalidateQueries({ queryKey: ["project", project.id] });
            queryClient.invalidateQueries({ queryKey: ["projects-index"] });
            toast({
                title: "Sucesso!",
                description: "Projeto atualizado com sucesso.",
            });
            setOpen(false);
        },
        onError: (error: any) => {
            toast({
                title: "Erro ao atualizar projeto",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="glass border-border/50 max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Editar Projeto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-project-name">Nome do Projeto</Label>
                        <Input
                            id="edit-project-name"
                            className="glass-light border-border/50"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-project-desc">Descrição</Label>
                        <Input
                            id="edit-project-desc"
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-project-deadline">Prazo</Label>
                            <Input
                                id="edit-project-deadline"
                                type="date"
                                className="glass-light border-border/50 [color-scheme:dark]"
                                value={newDeadline}
                                onChange={(e) => setNewDeadline(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-project-progress">Progresso (%)</Label>
                            <Input
                                id="edit-project-progress"
                                type="number"
                                min="0"
                                max="100"
                                className="glass-light border-border/50"
                                value={newProgress}
                                onChange={(e) => setNewProgress(Number(e.target.value))}
                            />
                        </div>
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
                            onClick={() => updateProjectMutation.mutate()}
                            disabled={updateProjectMutation.isPending || !newName}
                        >
                            {updateProjectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
