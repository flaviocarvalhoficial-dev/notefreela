import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type EventType = "project" | "task" | "personal";

interface AgendaEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  start_time: string;
  end_time: string;
  participants?: string[] | null;
}

const typeColors: Record<EventType, string> = {
  project: "hsl(158, 64%, 52%)",
  task: "hsl(262, 52%, 65%)",
  personal: "hsl(212, 52%, 52%)",
};

const Agenda = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<EventType>("task");
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("10:00");

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      // Buscar eventos manuais
      const { data: manualEvents, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

      if (eventsError) throw eventsError;

      // Buscar tarefas com data de vencimento
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .not("due_date", "is", null);

      if (tasksError) throw tasksError;

      // Unificar
      const taskEvents = tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        type: "task" as EventType,
        date: task.due_date,
        start_time: "09:00", // Horário padrão para tarefas
        end_time: "18:00",
        participants: []
      }));

      return [...(manualEvents as AgendaEvent[]), ...taskEvents];
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("events").insert({
        title: newTitle,
        type: newType,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: newStartTime,
        end_time: newEndTime,
        user_id: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsModalOpen(false);
      setNewTitle("");
      toast({ title: "Evento criado!" });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast({ title: "Evento removido" });
    }
  });

  const selectedEvents = allEvents.filter((event) => isSameDay(new Date(event.date + "T12:00:00"), selectedDate));

  const hasEvents = (date: Date) => allEvents.some((event) => isSameDay(new Date(event.date + "T12:00:00"), date));

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Agenda</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus eventos e compromissos reais</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-glow">
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border/50 max-w-sm">
            <DialogHeader>
              <DialogTitle>Novo Compromisso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ex: Call com Cliente" className="glass-light" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                  <SelectTrigger className="glass-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="project">Projeto</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="personal">Pessoal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="glass-light" />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="glass-light" />
                </div>
              </div>
              <Button className="w-full bg-primary" onClick={() => createEventMutation.mutate()} disabled={!newTitle}>
                Salvar Evento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendário */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bento-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 glass-light"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="glass-light"
                  onClick={() => {
                    const today = new Date();
                    setCurrentMonth(today);
                    setSelectedDate(today);
                  }}
                >
                  Hoje
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 glass-light"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              modifiers={{
                hasEvents: (date) => hasEvents(date),
              }}
              modifiersClassNames={{
                hasEvents: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary",
              }}
            />
          </div>
        </motion.div>

        {/* Eventos do dia */}
        <div className="flex flex-col gap-4">
          <div className="bento-card h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {isToday(selectedDate) ? "Hoje" : format(selectedDate, "dd MMM", { locale: ptBR })}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedEvents.length} {selectedEvents.length === 1 ? "evento" : "eventos"}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum evento neste dia
                  </div>
                ) : (
                  selectedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="glass-light p-3 rounded-lg group relative"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-1 h-10 rounded-full mt-1"
                          style={{ backgroundColor: typeColors[event.type] }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium truncate">{event.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                        >
                          <Plus className="h-3 w-3 rotate-45 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agenda;