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

const BRAND_ICONS = [
    { name: "Adobe", slug: "adobe" },
    { name: "Adobe CC", slug: "adobecreativecloud" },
    { name: "Photoshop", slug: "adobephotoshop" },
    { name: "Illustrator", slug: "adobeillustrator" },
    { name: "Canva", slug: "canva" },
    { name: "CapCut", slug: "capcut" },
    { name: "Suno AI", slug: "suno" },
    { name: "ChatGPT", slug: "openai" },
    { name: "Figma", slug: "figma" },
    { name: "Notion", slug: "notion" },
    { name: "Spotify", slug: "spotify" },
    { name: "YouTube", slug: "youtube" },
    { name: "Google Drive", slug: "googledrive" },
    { name: "Dropbox", slug: "dropbox" },
    { name: "Slack", slug: "slack" },
    { name: "Trello", slug: "trello" },
    { name: "Monday", slug: "mondaydotcom" },
    { name: "Asana", slug: "asana" },
    { name: "Midjourney", slug: "midjourney" },
    { name: "Vercel", slug: "vercel" },
    { name: "GitHub", slug: "github" },
    { name: "Discord", slug: "discord" }
];

const BrandItem = ({ brand, selected, onClick }: { brand: any, selected: boolean, onClick: () => void }) => {
    const [error, setError] = React.useState(false);

    // Using Iconify API for total stability and color control
    const iconUrl = `https://api.iconify.design/simple-icons:${brand.slug}.svg?color=${encodeURIComponent(selected ? '#ffffff' : '#a1a1aa')}`;

    return (
        <Button
            variant="ghost"
            title={brand.name}
            className={cn(
                "h-12 w-12 p-1.5 rounded-md transition-all flex items-center justify-center relative",
                selected ? "bg-primary/20 ring-1 ring-primary/50" : "hover:bg-muted"
            )}
            onClick={onClick}
        >
            {error ? (
                <LucideIcons.Image className="h-6 w-6 text-muted-foreground/40" />
            ) : (
                <img
                    src={iconUrl}
                    alt={brand.name}
                    className={cn(
                        "h-8 w-8 object-contain transition-all duration-300",
                        selected ? "scale-110 brightness-110" : "opacity-70 hover:opacity-100",
                    )}
                    onError={() => setError(true)}
                />
            )}
        </Button>
    );
};

const BrandTrigger = ({ slug, fallbackIcon: Fallback }: { slug: string, fallbackIcon: any }) => {
    const [error, setError] = React.useState(false);
    if (error) return <Fallback className="h-5 w-5" />;

    return (
        <img
            src={`https://api.iconify.design/simple-icons:${slug}.svg?color=white`}
            className="h-7 w-7 opacity-95 brightness-100"
            alt="Brand"
            onError={() => setError(true)}
        />
    );
};

interface IconPickerProps {
    value: string;
    onChange: (iconName: string) => void;
    trigger?: React.ReactNode;
}

export function IconPicker({ value, onChange, trigger }: IconPickerProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");

    const filteredProjectIcons = PROJECT_ICONS.filter(name =>
        name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredBrandIcons = BRAND_ICONS.filter(brand =>
        brand.name.toLowerCase().includes(search.toLowerCase())
    );

    const isBrandIcon = value.startsWith("si:");
    const SelectedIcon = isBrandIcon ? null : ((LucideIcons as any)[value] || LucideIcons.Briefcase);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="h-10 w-10 p-0 rounded-md bg-background shadow-sm overflow-hidden text-primary">
                        {isBrandIcon ? (
                            <BrandTrigger slug={value.split(':')[1]} fallbackIcon={LucideIcons.Briefcase} />
                        ) : (
                            <SelectedIcon className="h-5 w-5" />
                        )}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border shadow-2xl">
                <DialogHeader className="p-4 border-b border-border">
                    <DialogTitle className="text-sm font-medium  tracking-tight text-muted-foreground">
                        Escolher Ícone do Projeto
                    </DialogTitle>
                    <div className="mt-2">
                        <Input
                            placeholder="Buscar ícones..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 bg-muted/20 border-border text-xs"
                        />
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[350px] p-4">
                    <div className="space-y-6">
                        {filteredBrandIcons.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Marcas e Softwares</h3>
                                <div className="grid grid-cols-6 gap-2">
                                    {filteredBrandIcons.map((brand) => (
                                        <BrandItem
                                            key={brand.slug}
                                            brand={brand}
                                            selected={value === `si:${brand.slug}`}
                                            onClick={() => {
                                                onChange(`si:${brand.slug}`);
                                                setOpen(false);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {filteredProjectIcons.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Ícones Gerais</h3>
                                <div className="grid grid-cols-6 gap-2">
                                    {filteredProjectIcons.map((iconName) => {
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
                            </div>
                        )}
                    </div>

                    {filteredProjectIcons.length === 0 && filteredBrandIcons.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground text-xs font-medium">
                            Nenhum ícone encontrado para "{search}"
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}



