import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeleteConfirmDialogProps {
    title: string;
    description: string;
    onConfirm: () => void;
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DeleteConfirmDialog({
    title,
    description,
    onConfirm,
    trigger,
    open,
    onOpenChange
}: DeleteConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            {trigger ? (
                <AlertDialogTrigger asChild>
                    {trigger}
                </AlertDialogTrigger>
            ) : !onOpenChange && (
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
            )}
            <AlertDialogContent
                className="bg-card border border-border max-w-[400px]"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-medium tracking-tight">{title}</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                    <AlertDialogCancel className="rounded-md font-medium text-xs border-border">
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.stopPropagation();
                            onConfirm();
                        }}
                        className={cn(buttonVariants({ variant: "default" }), "rounded-md font-medium text-xs h-9 bg-orange-500 hover:bg-orange-600 text-white")}
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

