import * as React from "react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// List of professional-looking flat icons for project profiles
const PROJECT_ICONS = [
    "Briefcase", "Layout", "Code", "Camera", "Music", "PenTool",
    "Globe", "MessageSquare", "Settings", "Database", "Cpu", "HardDrive",
    "Smartphone", "Tv", "Watch", "Gamepad", "Headphones", "Mic",
    "Palette", "Terminal", "Shield", "Zap", "Star", "Heart",
    "Coffee", "Pizza", "Truck", "ShoppingBag", "CreditCard", "DollarSign",
    "TrendingUp", "BarChart", "PieChart", "Users", "User", "Smile",
    "Cloud", "Sun", "Moon", "Wind", "Umbrella", "Droplet",
    "Home", "Building", "MapPin", "Flag", "Bookmark",
    "Search", "Filter", "Eye", "EyeOff", "Lock",
    "Calendar", "Clock", "AlarmClock", "Timer", "CheckCircle", "HelpCircle"
];

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
    trigger?: React.ReactNode;
}

export function IconPicker({ value, onChange, trigger }: IconPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filteredIcons = PROJECT_ICONS.filter(name =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    const SelectedIcon = (LucideIcons as any)[value] || LucideIcons.Briefcase;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-md bg-background shadow-sm">
                        <SelectedIcon className="h-5 w-5" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border shadow-2xl">
                <DialogHeader className="p-4 border-b border-border/40">
                    <DialogTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">
                        Escolher Ícone do Projeto
                    </DialogTitle>
                    <div className="mt-2">
                        <Input
                            placeholder="Buscar ícones..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 bg-muted/20 border-border/40 text-xs"
                        />
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[300px] p-4">
                    <div className="grid grid-cols-6 gap-2">
                        {filteredIcons.map((iconName) => {
                            const Icon = (LucideIcons as any)[iconName];
                            if (!Icon) return null;

                            return (
                                <Button
                                    key={iconName}
                                    variant="ghost"
                                    className={cn(
                                        "h-12 w-12 p-0 rounded-md transition-all",
                                        value === iconName ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted"
                                    )}
                                    onClick={() => {
                                        onChange(iconName);
                                        setOpen(false);
                                    }}
                                >
                                    <Icon className="h-5 w-5" />
                                </Button>
                            );
                        })}
                    </div>
                    {filteredIcons.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-xs font-medium">
                            Nenhum ícone encontrado para "{search}"
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
