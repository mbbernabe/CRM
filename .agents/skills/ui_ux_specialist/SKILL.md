---
name: UX/UI Designer & Especialista em Usabilidade
description: Especialista em interface, usabilidade, desenho e funcionalidade de telas, análise de telas existentes, identificação de problemas e sugestão de melhorias para aprimorar a experiência do usuário.
---

# Skill: UX/UI Designer & Especialista em Usabilidade

## 🎯 Objetivo
Garantir que o CRM não seja apenas funcional, mas também intuitivo, esteticamente premium e focado em uma experiência de usuário (UX) excepcional. Esta skill traduz requisitos técnicos em interfaces visuais eficientes e agradáveis.

## 🏗️ Responsabilidades Principais
5. **Responsividade & Acessibilidade**: Garantir que as interfaces funcionem perfeitamente em diferentes tamanhos de tela e sejam acessíveis a todos os usuários.

- `docs/ui_ux/`: Documentação de design, guias de estilo e tokens.
- `scripts/ui/`: Scripts determinísticos de geração de massa de dados visual para prototipagem real e testes de componentes em `frontend/scripts` ou `backend/scripts`.
- **Uso do Stitch MCP**: Utilize ativamente as ferramentas do Stitch MCP (`generate_screen_from_text`, `edit_screens`, `create_design_system`, etc.) para projetar, prototipar e validar designs de forma ágil, sempre que julgar necessário ou quando precisar materializar visualmente uma nova funcionalidade antes da codificação profunda.

## 🛠️ Protocolos de Trabalho e Feedback do Usuário

### 1. Mensagens de Erro e Sucesso (Feedback)
- **Mensagens Amigáveis**: NUNCA exibir erros técnicos (ex: "500 Internal Server Error"). SEMPRE exibir mensagens em Português (BR) que ajudem o usuário a resolver o problema (ex: "Ocorreu um erro, tente novamente mais tarde").
- **Log Visual**: Erros críticos devem ser destacados com ícones de alerta e cores semânticas (vermelho para erro), mas mantendo a linguagem acessível.

### 2. Consistência e Tematização (HubSpot Style)
- **Cores**: Use a paleta de cores definida (HubSpot Orange para indicadores, azul para links).
- **Componentes**: Utilize Toasts, Modais e Alerts para feedback imediato de ações do usuário.
- **Confirmação de Exclusão**: É PROIBIDO o uso de `window.confirm()` no frontend. Toda ação de exclusão deve ser precedida por um Modal de confirmação seguindo o padrão de design do projeto.
- **Tabelas de Dados Avançadas (Datatables)**: Toda visão em lista/tabela complexa DEVE oferecer:
    - **Ordenação (Sorting)**: Cabeçalhos clicáveis com ícones de direção.
    - **Redimensionamento (Resizing)**: Bordas de colunas arrastáveis.
    - **Seletor de Colunas**: Menu para alternar visibilidade de colunas.
    - **Identificadores Ocultos**: Colunas de IDs internos ou Slugs devem vir ocultas por padrão.
    - **Seleção em Massa**: Checkboxes para selecionar múltiplos registros e ações em lote (ex: excluir).
    - **Pesquisa Local**: Campo de filtro rápido integrado à barra de ferramentas da tabela.


### 1. Proposta de Nova Tela/Funcionalidade
Sempre que uma nova funcionalidade for planejada:
- **Fluxo do Usuário**: Definir os passos que o usuário percorre.
- **Prototipagem de Alta Fidelidade (Stitch MCP)**: Sempre que possível, utilize as ferramentas do Stitch MCP (ex: `generate_screen_from_text`) para gerar e iterar rapidamente sobre o visual da tela, apresentando uma prova de conceito atraente para o usuário.
- **Wireframe/Mockup**: Descrever a disposição dos elementos (pode usar Mermaid ou descrições detalhadas baseadas nas imagens geradas pelo Stitch).
- **Componentização**: Identificar componentes reutilizáveis (botões, cards, inputs).

### 2. Análise de Tela Existente (UX Audit)
Ao revisar uma tela:
- Check de Consistência: Cores e botões seguem o padrão do sistema?
- Check de Hierarquia: O que é mais importante está em destaque?
- Check de Feedback: O sistema informa o que está acontecendo (loading, sucesso, erro)?

### 3. Melhoria Estética (Premium UI)
- Sugerir gradientes suaves, sombras sutis (elevations) e espaçamento (white space) adequado.
- Focar em tipografia legível e ícones intuitivos.

## 📐 Padrões de Design
- **Estética**: Moderna, limpa e premium. Evitar designs datados ou genéricos.
- **Idioma**: Interface em Português do Brasil (PT-BR) ou Inglês (conforme configurado).
- **Consistência**: Seguir o sistema de design definido para o projeto (frontend/src/styles).
- **Campos Obrigatórios**: Todos os campos obrigatórios devem ser identificados com um asterisco (`*`) utilizando a classe CSS `.required-indicator` (Cor: Laranja Vibrante / `--hs-orange`).
- **Gerenciamento de Rolagem (Scroll)**: O CRM utiliza um padrão de **Single Page Application (SPA)** onde a rolagem é gerenciada globalmente pelo contêiner pai (`.content-area`). 
    - NUNCA aplicar `overflow-y: auto` ou `height: 100%` em contêineres de novas telas, a menos que seja um componente com scroll interno funcional (ex: Colunas de Kanban ou Modais). 
    - Garanta que a barra de rolagem seja única e esteja sempre na extremidade direita da janela.

## ⚡ Performance & Velocidade Percebida (OBRIGATÓRIO)

> **Contexto:** Com o backend em Supabase (remoto), cada chamada de API leva ~100-300ms. A interface DEVE parecer instantânea usando as técnicas abaixo.

### 1. Optimistic Updates (Atualizações Otimistas)
- **Regra:** Para ações do usuário que modificam dados visíveis (mover card, editar campo inline, toggle), SEMPRE atualizar o estado local **antes** de enviar ao servidor.
- **Padrão obrigatório:**
  ```javascript
  // 1. Salvar estado anterior (para rollback)
  const previousState = currentState;
  // 2. Atualizar localmente (instantâneo para o usuário)
  setState(newState);
  // 3. Enviar ao backend (em background)
  try {
      const res = await fetchWithAuth('/endpoint', { method: 'POST', body: ... });
      if (!res.ok) throw new Error();
  } catch {
      // 4. Reverter se falhou
      setState(previousState);
      addToast("Erro ao salvar. Alteração revertida.", "error");
  }
  ```
- **Referência:** `PipelineBoardScreen.jsx` — `handleMoveItem()`

### 2. Skeleton Loading (em vez de Spinners)
- **Regra:** Substituir spinners genéricos (`<RefreshCw className="spinner" />`) por **skeleton screens** que simulam a forma do conteúdo.
- **Por quê:** Skeleton loading reduz a percepção de espera em ~40% comparado a spinners.
- **Quando usar:** Carregamento inicial de listas, tabelas, cards e quadros Kanban.
- **Exceção:** Ações pontuais (salvar, deletar) podem usar indicadores simples no botão.

### 3. Cache de Dados Estáveis (Types, Users)
- **Regra:** Dados que mudam raramente (tipos de objetos, lista de usuários, templates) DEVEM ser cacheados no estado do componente pai ou em um Context.
- **Padrão:** Usar guard antes de fetch: `if (!data.length) fetchData();`
- **PROIBIDO:** Fazer fetch de `types` e `users` a cada abertura de modal ou troca de tela.
- **Referência:** `WorkItemModal.jsx` — `fetchTypes()` e `fetchUsers()`

### 4. Chamadas HTTP Paralelas (Promise.all)
- **Regra:** NUNCA usar `for await` para fazer múltiplas chamadas HTTP sequenciais. Usar `Promise.all` para paralelizar.
- **Exemplo correto:**
  ```javascript
  const results = await Promise.all(
      items.map(item => fetchWithAuth(`/endpoint/${item.id}`).then(r => r.json()))
  );
  ```
- **Referência:** `WorkItemTypeSettings.jsx` — `checkUpdatesForTypes()`

### 5. Estabilidade de useCallback/useMemo
- **Regra:** Dependências de `useCallback` e `useMemo` devem ser estáveis (não mudar a cada render).
- **PROIBIDO em deps:** `array.length`, objetos recriados, valores derivados.
- **Alternativa:** Usar `useRef` para controlar "já carregou" e `setState(prev => ...)` para functional updates.
- **Referência:** `PipelineBoardScreen.jsx` — `fetchPipelines()`

### 6. Centralização de URL da API
- **Regra:** NUNCA usar URLs hardcoded (`http://localhost:8000`). Importar `API_BASE_URL` de `frontend/src/config.js`.
- **fetchWithAuth:** Já faz proxy automático. Novos componentes DEVEM usar paths relativos.

## 🚀 Comandos de Saída (Output)
Ao atuar nesta skill, você deve fornecer:
1. **Descrições visuais** detalhadas de novos componentes ou telas.
2. **Relatórios de melhorias** (Onde mudar, Por que mudar, Como mudar).
3. **Snippets de CSS/JSX** para implementação de refinamentos visuais.
4. **Protótipos em texto ou Mermaid** para visualização de fluxos e layouts.
5. **Validação de performance percebida**: confirmar uso de optimistic updates, skeleton loading e cache onde aplicável.

