---
trigger: always_on
---

```md
# skill: nimbus-ai-partner-copilot

## Purpose
Implementar no Nimbus um **assistente de IA contextual chamado "Nimbus Partner"**, que funcione como um **copiloto operacional do freelancer**, capaz de interpretar o contexto do sistema (projetos, tarefas, clientes, financeiro) e sugerir ações estratégicas, automações e insights.

A skill deve orientar o Antigravity a implementar um **Command Center de IA**, integrado com o estado da aplicação.

---

# Core Concept

O **Nimbus Partner** não deve ser apenas um chat genérico de IA.

Ele deve ser um **assistente contextual**, capaz de:

• entender em qual tela o usuário está  
• interpretar dados do workspace  
• sugerir ações estratégicas  
• executar comandos dentro do sistema  

Ele atua como um **copiloto da operação freelancer**.

---

# Interface Behavior

## Localização
O Nimbus Partner deve abrir como um **painel lateral deslizante (Right Panel)**.

Estrutura da interface:

HEADER
- Avatar Nimbus
- Nome: Nimbus Partner
- Status online

BODY
- sugestões contextuais
- histórico de conversa
- respostas da IA

FOOTER
- campo de prompt
- botão enviar
- comandos rápidos

---

# Context Awareness

O assistente deve identificar automaticamente o contexto atual da aplicação.

## Contextos possíveis

### Dashboard
Sugestões:

- analisar semana
- priorizar tarefas
- detectar riscos
- gerar plano de trabalho

### Projetos
Sugestões:

- resumir projeto
- detectar riscos de atraso
- sugerir próximas tarefas
- gerar checklist de entrega
- gerar mensagem para cliente

### Clientes
Sugestões:

- analisar histórico do cliente
- sugerir upsell
- gerar follow-up
- criar proposta

### Financeiro
Sugestões:

- analisar lucro do mês
- detectar cliente mais lucrativo
- prever receita
- sugerir reajuste de preço

### Tarefas
Sugestões:

- reorganizar tarefas
- detectar dependências
- priorizar execução

---

# AI Command System

Implementar comandos rápidos no chat.

Formato:

/comando

## Lista de comandos

/resumir-projeto  
/gerar-tarefas  
/analisar-cliente  
/gerar-proposta  
/prever-receita  
/organizar-semana  
/detectar-riscos  

---

# Copilot Mode

Implementar modo automático chamado:

**Copilot Mode**

Quando ativo, o Partner deve gerar automaticamente insights como:

Hoje no Nimbus:

- tarefas críticas
- projetos atrasados
- oportunidades de venda
- clientes sem resposta
- pagamentos pendentes

Esses insights devem aparecer no topo do painel.

---

# Workspace Analysis Engine

A IA deve poder analisar os seguintes dados do workspace:

Projetos  
Tarefas  
Clientes  
Financeiro  
Tempo investido  
Agenda  

Exemplos de análises:

- cliente mais lucrativo
- projeto em risco
- excesso de carga de trabalho
- tarefas atrasadas

---

# Smart Suggestions

A IA deve oferecer sugestões organizadas em três categorias:

## Analysis
- resumir projeto
- detectar riscos
- analisar cliente

## Execution
- gerar tarefas
- criar checklist
- organizar agenda

## Growth
- gerar proposta
- criar mensagem de prospecção
- detectar oportunidades de venda

---

# Business Diagnostics Mode

Criar comando:

/diagnostico-negocio

A IA deve gerar um relatório como:

Diagnóstico Nimbus:

- cliente dominante
- serviço mais lucrativo
- risco de atraso
- capacidade de novos projetos

---

# Action Execution

O Partner deve ser capaz de executar ações no sistema.

Exemplo:

Usuário digita:

"Crie um projeto de social media para Yla Energia"

A IA executa:

- criar projeto
- gerar tarefas padrão
- sugerir prazo
- vincular cliente

---

# Radar System

Criar área chamada:

**Nimbus Radar**

Mostrar alertas:

- projeto atrasado
- cliente inativo
- proposta sem resposta
- carga de trabalho alta
- pagamento pendente

---

# Growth Intelligence

A IA deve sugerir oportunidades comerciais:

- clientes sem novos projetos
- oportunidades de upsell
- follow-ups necessários

---

# Suggested Tech Implementation

## Backend

Context Engine

- analisar rota atual
- consultar banco de dados
- gerar prompt contextual

## AI Provider

- OpenAI GPT
- streaming responses

## Data Sources

- projects
- tasks
- clients
- finance
- events

---

# UX Guidelines

O Partner deve parecer:

• rápido  
• contextual  
• útil  
• não intrusivo  

Ele deve agir como:

"consultor silencioso da operação".

---

# Future Extensions

- automações baseadas em IA
- geração automática de propostas
- previsão financeira
- análise de produtividade
- score de saúde da operação

---

# Final Goal

Transformar o Nimbus Partner em:

**AI Copilot for Freelancers**

Um assistente que não apenas responde perguntas, mas **entende, analisa e melhora a operação do freelancer dentro do Nimbus.**
```
