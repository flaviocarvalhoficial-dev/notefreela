export const PASTEL_COLORS = [
    { name: "Ardósia", value: "hsl(215, 15%, 70%)" },
    { name: "Indigo", value: "hsl(230, 80%, 85%)" },
    { name: "Esmeralda", value: "hsl(150, 70%, 82%)" },
    { name: "Âmbar", value: "hsl(40, 95%, 82%)" },
    { name: "Coral", value: "hsl(10, 90%, 85%)" },
    { name: "Púrpura", value: "hsl(265, 80%, 85%)" },
    { name: "Ciano", value: "hsl(190, 85%, 82%)" },
];

export const DEFAULT_SCENARIOS = [
    { id: "default-scenario", title: "Fluxo Principal", type: "kanban", position: 0, project_id: "" }
];

export const DEFAULT_COLUMNS = [
    { id: "todo", title: "Início", hint: "Planeje e quebre em passos", color: "hsl(220, 15%, 75%)", scenario_id: "default-scenario" },
    { id: "inprogress", title: "Em Progresso", hint: "Foco no que está em execução", color: "hsl(200, 85%, 82%)", scenario_id: "default-scenario" },
    { id: "done", title: "Concluído", hint: "Entrega e validação", color: "hsl(150, 65%, 82%)", scenario_id: "default-scenario" },
];
