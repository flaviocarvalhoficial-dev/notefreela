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
import { cn } from "@/lib/utils";

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

const Atividades = ({ hideHeader = false }: { hideHeader?: boolean }) => {
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
      {!hideHeader && (
        <header className="flex items-center justify-between gap-4 mb-8 h-12">
          <div>
            <h1 className="text-2xl font-medium tracking-tight text-foreground">Atividades</h1>
          </div>
        </header>
      )}

      {!hideHeader && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar atividades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-card/50 border-border/60"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 px-3 gap-2 text-xs font-medium border-border/60",
                  filter !== "all" && "bg-primary/5 text-primary border-primary/20"
                )}
                onClick={() => {
                  const el = document.getElementById('advanced-filters-activities');
                  if (el) el.classList.toggle('hidden');
                }}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtros
              </Button>
            </div>
          </div>

          {/* Ghost Filters Bar */}
          <div id="advanced-filters-activities" className="hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex flex-wrap items-center gap-4 py-3 px-4 bg-muted/20 rounded-lg border border-border/40">
              <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="shrink-0">
                <TabsList className="h-8 bg-card border border-border rounded-md p-0.5">
                  <TabsTrigger value="all" className="h-7 text-[10px] px-3">Todas</TabsTrigger>
                  <TabsTrigger value="project" className="h-7 text-[10px] px-3">Projetos</TabsTrigger>
                  <TabsTrigger value="task" className="h-7 text-[10px] px-3">Tarefas</TabsTrigger>
                  <TabsTrigger value="comment" className="h-7 text-[10px] px-3">Comentários</TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setFilter("all");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        className={cn(
          "flex-1 overflow-auto",
          !hideHeader && "bento-card"
        )}
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
          <div className="space-y-0">
            {filteredActivities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || Activity;
              const color = activityColors[activity.type] || "hsl(var(--primary))";

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.03 }}
                  className="p-4 transition-all hover:bg-muted/5 border-b border-border/60 last:border-0"
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
                        <Badge variant="secondary" className="text-[10px] h-5 glass-light shrink-0">
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
                            <Badge variant="outline" className="text-[9px] font-medium border border-border text-muted-foreground  tracking-tight h-5 px-1.5 bg-muted/20">
                              {(activity.metadata as any).project}
                            </Badge>
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

