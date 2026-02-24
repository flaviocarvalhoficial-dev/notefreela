import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priorities = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
] as const;

const NewTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "Informe um título" })
    .max(120, { message: "Máximo de 120 caracteres" }),
  project: z.string().trim().min(1, { message: "Selecione um projeto" }),
  priority: z.enum(["low", "medium", "high"]),
  due: z.date().optional(),
  assignee: z
    .string()
    .trim()
    .max(80, { message: "Máximo de 80 caracteres" })
    .optional()
    .or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  progress: z.number().min(0).max(100).optional().default(0),
});

export type NewTaskValues = z.infer<typeof NewTaskSchema>;

export function NewTaskDialog({
  projects,
  onCreate,
  open: externalOpen,
  onOpenChange: setExternalOpen,
  trigger,
  defaultProjectId
}: {
  projects: { id: string, name: string }[];
  onCreate: (values: NewTaskValues) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  defaultProjectId?: string;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? setExternalOpen! : setInternalOpen;

  const form = useForm<NewTaskValues>({
    resolver: zodResolver(NewTaskSchema),
    defaultValues: {
      title: "",
      project: defaultProjectId ?? projects[0]?.id ?? "",
      priority: "medium",
      due: undefined,
      assignee: "",
      startTime: "09:00",
      endTime: "10:00",
    },
  });

  React.useEffect(() => {
    if (defaultProjectId) {
      form.setValue("project", defaultProjectId, { shouldValidate: true });
    } else {
      const current = form.getValues("project");
      if (!current && projects[0]) form.setValue("project", projects[0].id, { shouldValidate: true });
    }
  }, [projects, form, defaultProjectId]);

  function handleSubmit(values: NewTaskValues) {
    onCreate(values);
    setOpen(false);
    form.reset({
      title: "",
      project: projects[0]?.id ?? "",
      priority: "medium",
      due: undefined,
      assignee: "",
      startTime: "09:00",
      endTime: "10:00",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight">Criar Nova Tarefa</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Revisar layout do dashboard"
                      className="glass-light border-border"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projeto</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="glass-light border-border">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover text-popover-foreground border-border z-[200] shadow-xl">
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="glass-light border-border">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover text-popover-foreground border-border z-[200] shadow-xl">
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "justify-start text-left font-normal glass-light border-border",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                            {field.value ? format(field.value, "dd MMM yyyy") : <span>Sem prazo</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="bg-popover text-popover-foreground border-border w-auto p-0 shadow-xl z-[200]" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className={cn("p-3")}
                        />
                        <div className="p-3 pt-0">
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full glass-light"
                            onClick={() => field.onChange(undefined)}
                          >
                            Limpar prazo
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Opcional — útil para ordenar prioridades e foco.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Ana" className="glass-light border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Início</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="glass-light border-border block w-full"
                        step="600"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">Opcional para a Timeline.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora de Fim</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                        className="glass-light border-border block w-full"
                        step="600"
                      />
                    </FormControl>
                    <FormDescription className="text-[10px]">Sugestão: 1h de duração.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 glass-light border-border"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 border-primary transition-all active:scale-95 font-medium">
                Criar Tarefa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

