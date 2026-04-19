---
name: Especialista em Testes de Front-end (E2E & QA)
description: Especialista em testar fluxos de usuário, identificar bugs de interface, links quebrados e inconsistências visuais utilizando Playwright (Python).
---

# Skill: Especialista em Testes de Front-end (E2E & QA)

## 🎯 Objetivo
Garantir que a experiência do usuário (UX) seja impecável, validando cada fluxo da interface, desde a funcionalidade técnica até a perfeição visual e navegabilidade.

## 🏗️ Responsabilidades Principais
5. **Colaboração em Design**: Reportar inconsistências diretamente ao `ui_ux_specialist` para correções estéticas.

- `tests/e2e/`: Scripts de teste automatizados (Playwright).
- `scripts/ui/`: Scripts determinísticos de geração de massa de dados visual para prototipagem real e testes de componentes em `backend/scripts/`.

## 📐 Protocolos de Teste (Foco em Workspace)

### 1. Validação de Mensagens Amigáveis
- **Regra de Ouro**: Validar que o frontend NUNCA exibe mensagens técnicas (500 Error). Todo erro deve ser amigável e em Português (BR).
- **Notificações**: Verificar se Toasts e Alerts de erro/sucesso seguem o padrão visual (HubSpot theme).

### 2. Isolamento por Workspace
- **Fluxo Completo**: Testar o fluxo de registro que cria um novo Workspace e o login subsequente.
- **Header Selection**: Validar que o `workspace_id` está sendo enviado corretamente nas chamadas de API autenticadas.

- **Automação**: `Playwright` (Python integration).
- **Test Runner**: `pytest` com o plugin `pytest-playwright`.
- **Inspeção**: Browser DevTools para análise de DOM e Network.

## 📐 Protocolos de Teste

### 1. Preparação do Ambiente
- Certifique-se de que o backend e o frontend estão rodando.
- Utilize credenciais de teste consistentes.

### 2. Execução de Fluxos
- Ao testar uma tela, o especialista deve:
    - Clicar em todos os botões e links.
    - Testar casos de borda (inputs vazios, dados inválidos).
    - Verificar se as notificações (Toasts) aparecem após ações.
    - Validar se a URL do browser muda conforme a navegação.

### 3. Reporte de Inconsistências
Ao encontrar um problema visual:
- Descrever o elemento afetado.
- Comparar com o padrão esperado (Design System).
- Sugerir a melhoria ao Agente de UI/UX.

## 🚀 Comandos de Saída (Output)
Ao atuar nesta skill, você deve fornecer:
1. **Scripts de Teste** (ex: `tests/e2e/test_login.py`).
2. **Relatório de Execução** (Passou/Falhou e por quê).
3. **Lista de "Bugs Visuais"** ou melhorias de UX.
4. **Comanso para executar os testes** (ex: `pytest tests/e2e/test_login.py --browser chromium --headed`).

## 💡 Melhores Práticas
- **Wait Strategically**: Use os seletores inteligentes do Playwright (`expect(page.get_by_text("Sucesso")).to_be_visible()`) em vez de waits fixos.
- **Isolamento**: Limpe o estado ou use múltiplos contextos do browser se necessário.
- **Base URL**: Utilize variáveis de ambiente para a `BASE_URL` do frontend.

## ⚡ Validação de Performance no Frontend (OBRIGATÓRIO)

> **Contexto:** A UI deve parecer instantânea mesmo com backend remoto (~100-300ms por request). Testes E2E devem validar as técnicas de performance adotadas.

### 1. Verificação de URLs Centralizadas
- **Regra:** Ao revisar componentes, validar que **nenhum** `http://localhost:8000` está hardcoded no código.
- **Padrão correto:** Usar `API_BASE_URL` de `frontend/src/config.js` para `fetch()` direto, ou caminhos relativos para `fetchWithAuth()`.
- **Teste:** Buscar no código-fonte por strings `localhost:8000` (deve retornar zero ocorrências em chamadas fetch diretas).

### 2. Validação de Optimistic Updates
- **Regra:** Ações de drag-and-drop (Kanban) e edições inline devem refletir **imediatamente** na UI, sem esperar resposta do servidor.
- **Como testar:**
  - Mover um card no Kanban e verificar que ele aparece na nova coluna **antes** do request HTTP completar.
  - Simular falha de rede e verificar que o card reverte para a posição original.

### 3. Verificação de Cache e Fetches Desnecessários
- **Regra:** Abrir e fechar modais (como WorkItemModal) **não deve** gerar fetches adicionais de `types` e `users` se os dados já foram carregados.
- **Como testar:** Monitorar a aba Network do browser ao abrir modal pela 2ª vez — deve ter zero requests a `/workitems/types` e `/workspaces/{id}/users`.

### 4. Verificação de Chamadas Paralelas
- **Regra:** Múltiplas chamadas HTTP a endpoints similares devem ser disparadas em paralelo (`Promise.all`), não sequencialmente.
- **Como testar:** Na aba Network, verificar que requests de verificação de atualizações (`/types/{id}/updates`) iniciam simultaneamente.

