import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

type ActivityDetails = {
  id: string;
  title: string;
  meta: string;
  type: "project" | "task" | "personal";
  startLabel: string;
  endLabel: string;
  dateLabel: string;
  avatars: string[];
  extraCount?: number;
};

function typeLabel(t: ActivityDetails["type"]) {
  if (t === "project") return "Projeto";
  if (t === "task") return "Tarefa";
  return "Pessoal";
}

export function ActivityDetailsDrawer({
  open,
  onOpenChange,
  activity,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: ActivityDetails | null;
  onDelete?: (id: string, type: string) => void;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass border-border/50">
        <DrawerHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DrawerTitle className="truncate">{activity?.title ?? ""}</DrawerTitle>
              <DrawerDescription className="truncate">
                {activity ? `${activity.meta} • ${activity.dateLabel} • ${activity.startLabel} → ${activity.endLabel}` : ""}
              </DrawerDescription>
            </div>
            {activity ? (
              <div className="flex items-center gap-2">
                <DeleteConfirmDialog
                  title={`Excluir ${typeLabel(activity.type)}`}
                  description={`Deseja excluir permanentemente "${activity.title}"?`}
                  onConfirm={() => {
                    if (onDelete) onDelete(activity.id, activity.type);
                    onOpenChange(false);
                  }}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
                <Badge variant="secondary" className="glass-light border-border/50">
                  {typeLabel(activity.type)}
                </Badge>
              </div>
            ) : null}
          </div>
        </DrawerHeader>

        <div className="px-4 pb-5">
          <div className="glass-light rounded-2xl border border-border/50 p-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">Participantes</span>
                <span className="text-xs text-muted-foreground">
                  {activity ? activity.avatars.length + (activity.extraCount ?? 0) : 0}
                </span>
              </div>

              {activity && (activity.avatars.length > 0 || activity.extraCount) ? (
                <div className="flex flex-wrap gap-2">
                  {activity.avatars.map((it) => (
                    <div
                      key={it}
                      className="h-8 w-8 rounded-full glass-light border border-border/60 flex items-center justify-center text-[11px] font-semibold"
                      aria-label={`Participante ${it}`}
                      title={it}
                    >
                      {it}
                    </div>
                  ))}
                  {activity.extraCount ? (
                    <div className="h-8 px-3 rounded-full glass-light border border-border/60 flex items-center text-[11px] font-semibold">
                      +{activity.extraCount}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem participantes associados.</p>
              )}

              <div className="h-px bg-border/60" />

              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">Notas</span>
                <p className="text-sm text-muted-foreground">
                  Nenhuma nota adicional para este evento.
                </p>
              </div>

              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">Status</span>
                <p className="text-sm text-muted-foreground">Planejado</p>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
