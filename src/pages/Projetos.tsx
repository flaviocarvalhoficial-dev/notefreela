import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Filter, Search, MoreVertical, Users, Calendar, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

type ProjectStatus = "active" | "planning" | "review" | "completed";

const statusColors: Record<ProjectStatus, string> = {
  active: "hsl(158, 64%, 52%)",
  planning: "hsl(212, 52%, 52%)",
  review: "hsl(262, 52%, 65%)",
  completed: "hsl(220, 9%, 55%)",
};

const statusLabels: Record<ProjectStatus, string> = {
  active: "Em Progresso",
  planning: "Planejamento",
  review: "Em Revisão",
  completed: "Concluído",
};

const Projetos = () => {
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Form State removed (handled by NewProjectDialog)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Operations moved to NewProjectDialog or kept as needed
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Sucesso", description: "Projeto excluído." });
    }
  });

  const filteredProjects = projects.filter(project => {
    const matchesStatus = selectedStatus === "all" || project.status === selectedStatus;
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Projetos</h1>
          <p className="text-muted-foreground text-sm">{projects.length} projetos no total</p>
        </div>

        <NewProjectDialog
          trigger={
            <Button className="bg-primary hover:bg-primary/90 transition-all font-bold">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          }
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Buscar projetos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border/80 h-10 shadow-sm"
          />
        </div>

        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {(["all", "status", "active", "planning", "review", "completed"] as const).map((status) => {
            if (status === "status") return null; // Small fix for types
            return (
              <motion.div
                key={status}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status as any)}
                  className={
                    selectedStatus === status
                      ? "bg-foreground text-background font-bold border-foreground shadow-sm"
                      : "bg-background border-border/80 text-muted-foreground font-medium hover:bg-muted"
                  }
                >
                  {status === "all" ? "Todos" : statusLabels[status as ProjectStatus]}
                </Button>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando projetos reais...</p>
        </div>
      ) : (
        <motion.div
          className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/projetos/${project.id}`)}
              >
                <div className="bento-card group cursor-pointer h-full transition-all hover:ring-2 hover:ring-primary/20">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        {project.priority === "high" && (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity -mt-1 -mr-2"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass border-border/50 z-50">
                        <EditProjectDialog
                          project={project}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              Editar
                            </DropdownMenuItem>
                          }
                        />
                        <DropdownMenuItem>Arquivar</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive font-medium"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Deseja realmente excluir este projeto?")) {
                              deleteProjectMutation.mutate(project.id);
                            }
                          }}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Status Badge */}
                  <Badge
                    variant="secondary"
                    className="mb-4 glass-light border-border/50"
                    style={{
                      borderColor: `${statusColors[project.status as ProjectStatus]}30`,
                      color: statusColors[project.status as ProjectStatus]
                    }}
                  >
                    {statusLabels[project.status as ProjectStatus]}
                  </Badge>

                  {/* Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>{project.team_size || 1}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{project.deadline ? format(new Date(project.deadline), "dd MMM") : "S/ prazo"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {!isLoading && filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-24"
        >
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-border">
            <Plus className="text-muted-foreground h-6 w-6" />
          </div>
          <p className="text-muted-foreground">Nenhum projeto encontrado</p>
          <NewProjectDialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            trigger={
              <Button variant="link">Criar meu primeiro projeto</Button>
            }
          />
        </motion.div>
      )}
    </div>
  );
};

export default Projetos;