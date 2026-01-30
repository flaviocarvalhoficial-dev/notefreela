import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  FolderKanban,
  CheckSquare,
  User,
  Clock,
  Search,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

type ActivityType = "project" | "task" | "comment" | "status" | "assignment";

const activityIcons: Record<ActivityType, React.ElementType> = {
  project: FolderKanban,
  task: CheckSquare,
  comment: Activity,
  status: Clock,
  assignment: User,
};

const activityColors: Record<ActivityType, string> = {
  project: "hsl(158, 64%, 52%)",
  task: "hsl(262, 52%, 65%)",
  comment: "hsl(212, 52%, 52%)",
  status: "hsl(45, 93%, 62%)",
  assignment: "hsl(340, 75%, 60%)",
};

const Atividades = () => {
  const [filter, setFilter] = useState<"all" | ActivityType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredActivities = activities.filter((activity) => {
    const matchesFilter = filter === "all" || activity.type === filter;
    const matchesSearch =
      searchQuery === "" ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Atividades</h1>
        <p className="text-muted-foreground text-sm">Histórico de ações e atualizações reais</p>
      </div>

      {/* Filtros */}
      <motion.div
        className="bento-card bento-card--compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atividades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 glass-light"
            />
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="shrink-0">
            <TabsList className="glass-light border border-border/50">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="project">Projetos</TabsTrigger>
              <TabsTrigger value="task">Tarefas</TabsTrigger>
              <TabsTrigger value="comment">Comentários</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </motion.div>

      {/* Lista de Atividades */}
      <motion.div
        className="bento-card flex-1 overflow-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Activity className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">Nenhuma atividade registrada ainda</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || Activity;
              const color = activityColors[activity.type] || "hsl(var(--primary))";

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className="glass-light p-4 rounded-lg hover:bg-muted/10 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-2 rounded-xl glass-light shrink-0"
                      style={{ boxShadow: `0 0 20px ${color}10` }}
                    >
                      <Icon className="h-4 w-4" style={{ color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium">{activity.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[10px] h-5 glass-light shrink-0 uppercase">
                          {activity.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(activity.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        {(activity.metadata as any)?.project && (
                          <>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {(activity.metadata as any).project}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Atividades;