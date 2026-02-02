export const PASTEL_COLORS = [
    { name: "Cinza Suave", value: "hsl(220, 15%, 75%)" },
    { name: "Azul Céu", value: "hsl(200, 85%, 82%)" },
    { name: "Menta", value: "hsl(150, 65%, 82%)" },
    { name: "Creme", value: "hsl(45, 90%, 82%)" },
    { name: "Pêssego", value: "hsl(25, 95%, 82%)" },
    { name: "Rose", value: "hsl(0, 85%, 85%)" },
    { name: "Lavanda", value: "hsl(265, 70%, 85%)" },
];

export const DEFAULT_SCENARIOS = [
    { id: "default-scenario", title: "Fluxo Principal", type: "kanban", position: 0, project_id: "" }
];

export const DEFAULT_COLUMNS = [
    { id: "todo", title: "Início", hint: "Planeje e quebre em passos", color: "hsl(220, 15%, 75%)", scenario_id: "default-scenario" },
    { id: "inprogress", title: "Em Progresso", hint: "Foco no que está em execução", color: "hsl(200, 85%, 82%)", scenario_id: "default-scenario" },
    { id: "done", title: "Concluído", hint: "Entrega e validação", color: "hsl(150, 65%, 82%)", scenario_id: "default-scenario" },
];
