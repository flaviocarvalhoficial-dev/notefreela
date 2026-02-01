---
trigger: manual
---

# Linear Design System

> Design System completo extraído da interface Linear para implementação consistente

---

## 🎨 Paleta de Cores

### Cores Principais

```css
--color-primary: #5E6AD2;        /* Azul primário (botões, links ativos) */
--color-primary-hover: #4F5BC4;  /* Hover do primário */
--color-primary-active: #424DB8; /* Active do primário */
```

### Cores de Fundo

```css
--color-background-primary: #000000;     /* Fundo principal */
--color-background-secondary: #0D0D0D;   /* Fundo secundário (sidebar) */
--color-background-tertiary: #1A1A1A;    /* Fundo terciário (cards, modais) */
--color-background-elevated: #252525;    /* Elementos elevados */
--color-background-hover: #2A2A2A;       /* Hover states */
--color-background-input: #1C1C1C;       /* Campos de input */
```

### Cores de Texto

```css
--color-text-primary: #FFFFFF;       /* Texto principal */
--color-text-secondary: #8A8A8A;     /* Texto secundário */
--color-text-tertiary: #6B6B6B;      /* Texto terciário/disabled */
--color-text-muted: #505050;         /* Texto extremamente muted */
```

### Cores de Borda

```css
--color-border-primary: #2E2E2E;     /* Bordas principais */
--color-border-secondary: #3A3A3A;   /* Bordas secundárias */
--color-border-focus: #5E6AD2;       /* Bordas em foco (inputs) */
```

### Cores Funcionais

```css
--color-success: #10B981;    /* Verde - sucesso */
--color-warning: #F59E0B;    /* Amarelo - aviso */
--color-error: #EF4444;      /* Vermelho - erro */
--color-info: #3B82F6;       /* Azul - informação */
```

### Cores Semânticas (Ícones e Status)

```css
--color-icon-primary: #FFFFFF;
--color-icon-secondary: #8A8A8A;
--color-icon-accent: #B294FF;        /* Roxo para destaque */
```

---

## 📝 Tipografia

### Família de Fontes

```css
--font-family-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
--font-family-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

### Tamanhos de Fonte

```css
--font-size-xs: 11px;      /* Legendas, hints */
--font-size-sm: 12px;      /* Labels, secondary text */
--font-size-base: 14px;    /* Texto base */
--font-size-md: 15px;      /* Texto médio */
--font-size-lg: 16px;      /* Subtítulos */
--font-size-xl: 18px;      /* Títulos pequenos */
--font-size-2xl: 20px;     /* Títulos médios */
--font-size-3xl: 24px;     /* Títulos grandes */
--font-size-4xl: 32px;     /* Títulos muito grandes */
```

### Pesos de Fonte

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

### Estilos de Texto Predefinidos

```css
/* Heading 1 */
.heading-1 {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

/* Heading 2 */
.heading-2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}

/* Body */
.body {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
}

/* Caption */
.caption {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
}

/* Label */
.label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
}
```

---

## 📐 Espaçamentos (Grid de 8px)

### Sistema de Espaçamento

```css
--spacing-0: 0px;
--spacing-1: 4px;      /* 0.5 * 8px */
--spacing-2: 8px;      /* 1 * 8px */
--spacing-3: 12px;     /* 1.5 * 8px */
--spacing-4: 16px;     /* 2 * 8px */
--spacing-5: 20px;     /* 2.5 * 8px */
--spacing-6: 24px;     /* 3 * 8px */
--spacing-8: 32px;     /* 4 * 8px */
--spacing-10: 40px;    /* 5 * 8px */
--spacing-12: 48px;    /* 6 * 8px */
--spacing-16: 64px;    /* 8 * 8px */
--spacing-20: 80px;    /* 10 * 8px */
--spacing-24: 96px;    /* 12 * 8px */
```

### Aplicações Comuns

```css
/* Padding interno de componentes */
--padding-component-sm: var(--spacing-2);
--padding-component-md: var(--spacing-4);
--padding-component-lg: var(--spacing-6);

/* Gaps entre elementos */
--gap-sm: var(--spacing-2);
--gap-md: var(--spacing-4);
--gap-lg: var(--spacing-6);

/* Margens */
--margin-section: var(--spacing-8);
```

---

## 🔲 Border Radius

```css
--radius-none: 0px;
--radius-sm: 4px;      /* Pequenos elementos */
--radius-md: 6px;      /* Padrão (botões, inputs) */
--radius-lg: 8px;      /* Cards, modais */
--radius-xl: 12px;     /* Containers grandes */
--radius-full: 9999px; /* Círculos, pills */
```

---

## 🎭 Sombras e Elevação

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.3);

/* Sombra para elementos interativos */
--shadow-focus: 0 0 0 3px rgba(94, 106, 210, 0.3);
```

---

## 🎯 Componentes

### 1. Botões

#### Botão Primário

```css
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

.button-primary:active {
  background-color: var(--color-primary-active);
  transform: scale(0.98);
}

.button-primary:focus {
  box-shadow: var(--shadow-focus);
  outline: none;
}
```

#### Botão Secundário

```css
.button-secondary {
  background-color: var(--color-background-elevated);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-secondary:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-secondary);
}
```

#### Botão Ghost

```css
.button-ghost {
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-ghost:hover {
  background-color: var(--color-background-hover);
  color: var(--color-text-primary);
}
```

### 2. Inputs

#### Input de Texto

```css
.input-text {
  background-color: var(--color-background-input);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-primary);
  width: 100%;
  transition: all 0.2s ease;
}

.input-text::placeholder {
  color: var(--color-text-tertiary);
}

.input-text:hover {
  border-color: var(--color-border-secondary);
}

.input-text:focus {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus);
  outline: none;
}

.input-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Input Label

```css
.input-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
  display: block;
}
```

### 3. Cards

```css
.card {
  background-color: var(--color-background-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  border: 1px solid var(--color-border-primary);
  transition: all 0.2s ease;
}

.card:hover {
  border-color: var(--color-border-secondary);
  box-shadow: var(--shadow-md);
}
```

### 4. Navigation Items (Sidebar)

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-item:hover {
  background-color: var(--color-background-hover);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-background-elevated);
  color: var(--color-text-primary);
}
```

### 5. Dropdowns

```css
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-background-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-trigger:hover {
  background-color: var(--color-background-hover);
  border-color: var(--color-border-secondary);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-1));
  left: 0;
  background-color: var(--color-background-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-2);
  min-width: 200px;
  z-index: 1000;
}

.dropdown-item {
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background-color: var(--color-background-hover);
}
```

### 6. Modal

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background-color: var(--color-background-tertiary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-8);
  max-width: 600px;
  width: 90%;
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border-primary);
}

.modal-header {
  margin-bottom: var(--spacing-6);
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
}

.modal-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}
```

### 7. Empty State

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) var(--spacing-8);
  text-align: center;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  margin-bottom: var(--spacing-6);
  opacity: 0.6;
}

.empty-state-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
}

.empty-state-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
  max-width: 400px;
  margin-bottom: var(--spacing-6);
}
```

### 8. Toggle Buttons / Tabs

```css
.toggle-group {
  display: inline-flex;
  background-color: var(--color-background-tertiary);
  border-radius: var(--radius-md);
  padding: var(--spacing-1);
  gap: var(--spacing-1);
}

.toggle-item {
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--radius-sm);
