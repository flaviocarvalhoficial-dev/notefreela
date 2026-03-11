import { useState } from 'react';

interface PropertyItemProps {
    icon: any;
    label: string;
    value: React.ReactNode;
    isEditable?: boolean;
    onSave?: (newValue: string) => void;
    type?: 'text' | 'select' | 'date';
    options?: { label: string, value: string }[];
}

export const PropertyItem = ({
    icon: Icon,
    label,
    value,
    isEditable = true,
    onSave,
    type = 'text',
    options = []
}: PropertyItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState<string>('');

    const handleStartEdit = () => {
        if (!isEditable) return;
        setLocalValue(typeof value === 'string' ? value : '');
        setIsEditing(true);
    };

    const handleSave = () => {
        if (onSave) onSave(localValue);
        setIsEditing(false);
    };

    return (
        <div
            className="grid grid-cols-[140px_1fr] items-center gap-2 group cursor-pointer hover:bg-muted/30 py-1.5 px-2 rounded-md transition-colors min-h-[36px]"
            onClick={() => !isEditing && handleStartEdit()}
        >
            <div className="flex items-center gap-2 text-muted-foreground select-none">
                <Icon className="w-4 h-4" />
                <span className="text-[13px]">{label}</span>
            </div>
            <div className="text-[13px] text-foreground font-medium truncate">
                {isEditing ? (
                    type === 'select' ? (
                        <select
                            autoFocus
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-medium outline-none"
                            value={localValue}
                            onChange={(e) => {
                                setLocalValue(e.target.value);
                                if (onSave) onSave(e.target.value);
                                setIsEditing(false);
                            }}
                            onBlur={() => setIsEditing(false)}
                        >
                            <option value="" disabled>Selecione...</option>
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ) : type === 'date' ? (
                        <input
                            type="date"
                            autoFocus
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-medium outline-none"
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                    ) : (
                        <input
                            autoFocus
                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] font-medium outline-none"
                            value={localValue}
                            onChange={(e) => setLocalValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                    )
                ) : (
                    value || <span className="text-muted-foreground/30 italic font-normal">Vazio</span>
                )}
            </div>
        </div>
    );
};
