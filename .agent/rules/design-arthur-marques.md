---
trigger: always_on
---

# IDENTIDADE VISUAL — NoteFreela

## Stack Técnica
- Tailwind CSS para toda estilização (NUNCA criar arquivos .css separados)
- shadcn/ui como base de componentes, customizados via className
- Todos os valores visuais definidos como TOKENS SEMÂNTICOS no tailwind.config
- NUNCA usar valores hardcoded no código — sempre tokens semânticos
- NUNCA usar cores/radius/sombras padrão do Tailwind — apenas tokens deste documento
- A IA que implementa é RESPONSÁVEL por criar SVGs originais e composições visuais únicas baseadas nas descrições abaixo — NÃO use decoração genérica (blobs, dot grids, partículas) como substituto
- A paleta usa UMA cor accent forte + neutros. NÃO crie arco-íris de categorias. A identidade é uma cor só.

---

## A Alma do App

NoteFreela é o cockpit criativo do freelancer.  
Não é um dashboard corporativo — é uma mesa de trabalho viva, onde cada projeto tem direção, cada tarefa tem trajetória e o financeiro tem fluxo claro.  
É organização com energia criativa — visão de negócio sem perder alma autoral.

---

## Referências e Princípios

- **Linear:** Estrutura limpa, foco extremo na hierarquia e uma única cor forte →  
  **Princípio:** Menos cor, mais clareza estrutural →  
  **Aplicação:** NoteFreela usa UMA cor forte (laranja vibrante criativo) + neutros, com foco em fluxo visual.

- **Notion:** Centralidade do conteúdo, editor como coração do sistema →  
  **Princípio:** O conteúdo é o protagonista →  
  **Aplicação:** Tela de Projeto com editor dominante e ações contextuais.

- **ClickUp:** Organização por projetos e visualizações múltiplas →  
  **Princípio:** Estrutura modular por contexto →  
  **Aplicação:** Cada projeto é um universo com tarefas, financeiro e inbox filtrados automaticamente.

---

# Decisões de Identidade

---

## ESTRUTURA

### Navegação

**O que:**  
Sidebar compacta + área central dominante + barra contextual superior dinâmica por projeto.

**Por que:**  
Freelancers pensam por projeto. O projeto deve ser o "mundo atual". Tudo filtra a partir dele.

**Como:**  
- Sidebar com largura reduzida (ícones + labels discretos)
- Topbar contextual exibindo: Nome do Projeto + Status + Métrica principal
- Área central sempre dominante (70%+ da largura)

**Nunca:**  
Não usar layout de dashboard corporativo com múltiplos cards iguais ocupando toda a tela.

---

### Hierarquia

**O que:**  
Cada tela tem um “elemento narrativo principal” que conta a história daquela seção.

**Por que:**  
Evita grid genérico de retângulos. Cria identidade emocional.

**Como:**  
Em cada tela principal (Projeto, Tarefas, Financeiro, Inbox) existe um componente dominante com conceito visual.

**Nunca:**  
Não criar 8 cards iguais competindo visualmente.

---

## LINGUAGEM

### Tipografia

**O que:**  
Fonte principal moderna e geométrica (ex: Satoshi / Inter alternativa customizada).  
Títulos com peso forte. Corpo leve e arejado.

**Por que:**  
Transmitir criatividade organizada.

**Como:**  
- Títulos: peso 600–700  
- Corpo: peso 400  
- Espaçamento generoso

**Nunca:**  
Não usar tipografia genérica com hierarquia fraca.

---

### Geometria

**O que:**  
Cantos médios — nem extremos nem quadrados rígidos.

**Por que:**  
Equilibra criatividade e estrutura.

**Como:**  
- Cards com radius consistente
- Botões levemente arredondados
- Inputs discretos

**Nunca:**  
Não usar border-radius diferente em cada componente.

---

### Cor (REGRA DA COR ÚNICA)

**Cor da Marca:** Laranja energético criativo.

Essa cor representa:
- Ação
- Movimento
- Energia produtiva

Ela aparece:
- Botões primários
- Ícones ativos
- Indicadores de progresso
- Elementos conceituais SVG

Todo o resto é neutro.

---

# RIQUEZA VISUAL

---

## Textura Ambiente

**O que:**  
Grid estrutural invisível inspirado em blueprint de planejamento.

**Temática:**  
Planejamento criativo. Organização de ideias.

**Tratamento:**  
- Linhas finas horizontais e verticais
- Opacidade 3–4%
- Cor: text-muted
- Fixa no background
- Sem gradientes coloridos

Essa textura cria sensação de "mesa de planejamento".

---

# Conceitos Visuais por Componente

---

## 1. Card de Visão do Projeto

**Representa:**  
Direção estratégica do projeto.

**Metáfora visual:**  
Mapa de rota com checkpoints.

**Cena detalhada:**  
- Linha horizontal levemente curva atravessando o card.
- Três círculos pequenos ao longo da linha (marcos).
- Último círculo maior e preenchido com accent-primary.
- Pequeno triângulo (seta) apontando para o próximo checkpoint.
- Linha tracejada atrás da seta.
- Opacidade geral da linha: 8%.
- Círculos passados: neutros.
- Círculo atual: accent-primary.

**Viabilidade:**  
CÓDIGO PURO (SVG simples)

---

## 2. Kanban (Tela de Tarefas)

**Representa:**  
Fluxo de produção.

**Metáfora visual:**  
Esteira de produção modular.

**Cena detalhada (header da tela):**  
- Três colunas representadas como blocos verticais.
- Pequenos retângulos deslocando-se da esquerda para direita.
- Uma linha horizontal conectando colunas.
- Primeiro bloco neutro, último bloco accent-primary.
- Movimento sutil (se framer-motion estiver ativo).

**Viabilidade:**  
CÓDIGO PURO

---

## 3. Card Financeiro

**Representa:**  
Fluxo de entrada e saída de dinheiro.

**Metáfora visual:**  
Dois fluxos opostos convergindo para um ponto central.

**Cena detalhada:**  
- Duas linhas curvas vindas dos lados esquerdo e direito.
- Pequenos círculos percorrendo essas linhas.
- No centro, um círculo maior representando saldo.
- Círculos de fluxo em neutro.
- Saldo central com borda accent-primary.
- Pequeno pulso sutil no saldo (scale leve).

**Viabilidade:**  
CÓDIGO PURO

---

## 4. Inbox do Projeto

**Representa:**  
Comunicação viva ligada ao projeto.

**Metáfora visual:**  
Balões conectados por fio condutor.

**Cena detalhada:**  
- Dois balões minimalistas.
- Linha fina conectando-os.
- Pequenos pontos animados percorrendo a linha.
- Um balão neutro.
- Outro com outline accent-primary.
- Movimento contínuo muito leve.

**Viabilidade:**  
CÓDIGO PURO

---

## 5. Empty State

**Representa:**  
Espaço pronto para criar algo novo.

**Metáfora visual:**  
Mesa vazia com uma folha central.

**Cena detalhada:**  
- Retângulo central simulando folha.
- Linha horizontal representando mesa.
- Pequeno lápis minimalista inclinado.
- Lápis com detalhe accent-primary.
- Tudo em opacidade baixa (10%).

**Viabilidade:**  
CÓDIGO PURO

---

# Tokens de Design

---

## Cores — Fundos

| Token | Valor | Uso |
|---|---|---|
| surface-page | #F7F7F5 | Fundo principal |
| surface-card | #FFFFFF | Cards |
| surface-elevated | #F1F1EE | Elementos elevados |

---

## Cores — Texto

| Token | Valor | Uso |
|---|---|---|
| text-primary | #1F1F1F | Títulos |
| text-secondary | #4A4A4A | Corpo |
| text-muted | #9A9A9A | Hints |

---

## Cores — Accent (UMA COR)

| Token | Valor | Uso |
|---|---|---|
| accent-primary | #FF6A2A | A cor da marca |
| accent-hover | #E85C1F | Hover |
| accent-subtle | rgba(255,106,42,0.08) | Fundos leves |

---

## Cores — Status

| Token | Valor | Uso |
|---|---|---|
| status-success | #16A34A | Feedback positivo |
| status-error | #DC2626 | Erro |
| status-warning | #D97706 | Atenção |

---

## Bordas

| Token | Valor | Uso |
|---|---|---|
| border-default | 1px solid #E4E4E1 | Contorno padrão |
| border-subtle | 1px solid #EFEFED | Contorno leve |

---

## Geometria

| Token | Valor | Uso |
|---|---|---|
| radius-card | 16px | Cards |
| radius-button | 12px | Botões |
| radius-input | 10px | Inputs |

---

## Sombras

| Token | Valor | Uso |
|---|---|---|
| shadow-card | 0 4px 12px rgba(0,0,0,0.04) | Cards |
| shadow-hover | 0 6px 18px rgba(0,0,0,0.06) | Hover |
| shadow-float | 0 12px 30px rgba(0,0,0,0.08) | Modais |

---

# Componentes Shadcn — Overrides

| Componente | Override |
|---|---|
| `<Card>` | surface-card + radius-card + shadow-card |
| `<Button>` | accent-primary + radius-button |
| `<Badge>` | accent-subtle + text-primary |
| `<Avatar>` | border-subtle |
| `<Input>` | surface-elevated + radius-input |

---

# Regra de Ouro

1. Uma cor forte. Sempre.
2. Todo card importante conta uma história visual.
3. Estrutura dominante e limpa.
4. Nada de blobs, nada de arco-íris.
5. Organização com energia criativa.
6. O freelancer sente que está no controle do seu negócio.

---

## Teste Final

Coloque NoteFreela ao lado de um dashboard shadcn padrão:

- Estrutura diferente → projeto como universo.
- Linguagem própria → laranja vibrante único.
- Riqueza real → cada card tem uma metáfora visual clara.
- Nenhuma decoração genérica.
- Nenhum arco-íris.

Se parecer template recolorido, falhou.  
Se parecer cockpit criativo de freelancer, acertou.