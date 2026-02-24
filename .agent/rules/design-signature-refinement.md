---
trigger: always_on
---

# DESIGN SYSTEM – ASSINATURA VISUAL DO SAAS

## 1. DIAGNÓSTICO DO ESTADO ATUAL

### Estrutura Geral
- Layout com sidebar fixa esquerda
- Topbar leve com filtros e actions
- Cards minimalistas com bordas suaves
- Alto uso de cinza neutro
- Radius padrão 8px aproximado
- Ícones finos (stroke 1.5~2px)
- Hierarquia tipográfica discreta
- Pouca diferenciação entre planos de profundidade

### Problema identificado
- Está tecnicamente correto
- Está consistente
- Mas está visualmente genérico
- Falta tensão visual
- Falta contraste hierárquico
- Falta assinatura emocional
- Falta identidade de peso tipográfico
- Falta personalidade na paleta

O design hoje comunica:
“Ferramenta funcional”

Ele precisa comunicar:
“Ferramenta com identidade própria, inteligência e intenção”

---

## 2. PRINCÍPIO DA NOVA ASSINATURA

### Conceito:
Minimalismo Estruturado com Peso Intelectual

Não é criativo colorido.
Não é tech frio.
É sofisticado, silencioso, confiante.

Palavras-chave:
- Precisão
- Silêncio
- Estrutura
- Clareza
- Profundidade sutil
- Micro tensão visual

---

## 3. SISTEMA DE TIPOGRAFIA (ÚNICA FAMÍLIA)

Fonte recomendada:
→ Inter (ou Geist se quiser algo mais contemporâneo)

Pesos permitidos:
- 400 Regular
- 500 Medium
- 600 SemiBold

Proibição:
- Não usar mais que 3 pesos
- Não usar bold extremo
- Não usar light excessivo

Hierarquia:

H1 → 600 / 20-22px
H2 → 600 / 18px
Section title → 500 / 14px
Card title → 500 / 14px
Body → 400 / 13-14px
Meta / label → 400 / 12px
Badge text → 500 / 12px

Regra fundamental:
A hierarquia deve ser feita por peso + espaçamento,
não por variação exagerada de tamanho.

---

## 4. SISTEMA DE ESPAÇAMENTO

Base unit: 4px

Escala oficial:
4
8
12
16
20
24
32
40

Proibição:
- Não usar valores quebrados
- Não usar 10, 14, 18 arbitrários

Sidebar padding:
16px horizontal
12px vertical items

Card padding:
16px interno
Gap entre cards: 12px

Seção:
32px entre blocos principais

---

## 5. SISTEMA DE BORDAS E RADIUS

Radius oficial:
- Componentes pequenos: 6px
- Cards: 10px
- Modal: 14px

Nunca misturar radius inconsistentes.

Borda:
1px solid

Light mode:
rgba(0,0,0,0.06)

Dark mode:
rgba(255,255,255,0.08)

---

## 6. PROFUNDIDADE (SEM SOMBRA PESADA)

Sombras devem ser quase invisíveis.

Card:
box-shadow: 0 1px 2px rgba(0,0,0,0.04)

Modal:
0 10px 30px rgba(0,0,0,0.12)

Nada de sombra difusa exagerada.

---

## 7. ÍCONES

Estilo:
Stroke uniforme
Espessura 1.5px
Rounded caps

Tamanho padrão:
16px sidebar
18px actions
14px inline

Ícones nunca devem ser mais pesados que o texto.

---

## 8. BADGES E STATUS

Status não deve depender só de cor.
Adicionar:
- leve fundo tonal
- peso 500
- micro padding 6px 10px

Exemplo:

Backlog:
bg: neutral subtle
text: 500

In Progress:
bg: tonal amarelo suave
text: 500

Done:
bg: tonal verde suave

Cancel:
bg: tonal cinza frio

Dark mode deve usar versões translúcidas:
rgba(color, 0.12)

---

## 9. BOTÕES

Primary:
Background sólido
Radius 8px
Peso 500

Hover:
Elevação mínima
Leve escurecimento

Secondary:
Fundo transparente
Borda 1px

Nunca usar gradiente.

---

## 10. SIDEBAR

Problema atual:
Muito plana.
Muito neutra.

Melhoria:
- Fundo levemente diferente do main
- Separação clara entre grupos
- Texto 400
- Item ativo: 500 + leve fundo tonal

Nada chamativo.
Elegância silenciosa.

---

## 11. DARK MODE (OBRIGATÓRIO CONSISTENTE)

Nunca inverter apenas cores.

Criar tokens específicos:

Light:
Background main: #F7F8FA
Card: #FFFFFF
Sidebar: #F3F4F6
Text primary: #111111
Text secondary: #6B7280

Dark:
Background main: #0F1115
Card: #151821
Sidebar: #111318
Text primary: #E6E8EC
Text secondary: #9AA0A6

Evitar preto absoluto.
Evitar branco puro.

---

## 12. MICRO-INTENCIONALIDADE

Adicionar:
- micro delays de hover
- estados de foco claros
- transições 120ms ease-out
- destaque sutil em inputs ativos

Isso cria “vida”.

---

## 13. O QUE NÃO FAZER

❌ Não usar padrão genérico de Tailwind puro  
❌ Não misturar múltiplos radius  
❌ Não usar sombra forte  
❌ Não usar 4 pesos de fonte  
❌ Não usar cor vibrante sem intenção  
❌ Não usar espaçamento inconsistente  

---

# SKILL PARA O ANTIGRAVITY

Nome da Skill:
DesignSignatureRefinement_v1

Objetivo:
Refinar o design atual mantendo layout e estrutura, mas aplicando um sistema visual autoral e consistente.

Regras da Skill:

1. Não alterar arquitetura de layout.
2. Não adicionar novos componentes.
3. Apenas refinar:
   - tipografia
   - espaçamento
   - bordas
   - contraste
   - profundidade
   - estados
4. Aplicar sistema de 1 tipografia com 3 pesos.
5. Implementar tokens de cor para light e dark.
6. Garantir consistência de radius.
7. Ajustar sidebar para ter plano visual distinto.
8. Aplicar hierarquia baseada em peso e espaçamento.
9. Padronizar botões e badges.
10. Garantir que dark mode não seja apenas invertido.

Resultado esperado:
Um sistema com assinatura própria.
Silencioso.
Elegante.
Intelectual.
Não genérico.
Consistente em todas as telas.