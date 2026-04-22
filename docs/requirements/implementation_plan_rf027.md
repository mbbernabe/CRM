# Plano de Implementação: Central de Tarefas Avançada (RF027)

## Objetivo
Transformar a "Central de Tarefas" em um centro de produtividade completo, inspirado em ferramentas como Microsoft To-Do e Todoist, com listas inteligentes, filtros por prioridade e novos campos de controle temporal.

## Novos Requisitos (Baseados no Feedback do Usuário)
- **Novos Campos no Template "Tarefa"**:
    - `start_date` (Data): Data de início do trabalho.
    - `due_date` (Data): Prazo final (substituindo a data genérica).
    - `is_important` (Booleano): Marcador de estrela/destaque.
    - `priority` (Seleção): Baixa, Média, Alta, Crítica.
- **Listas Inteligentes (Sidebar Interna)**:
    - **Meu Dia**: Tarefas com `due_date` == hoje.
    - **Importante**: Tarefas marcadas com `is_important=True`.
    - **Planejado**: Tarefas com qualquer data definida (ordenadas por data).
    - **Atribuído a mim**: Tarefas onde o usuário logado é o `owner`.
    - **Todas**: Todas as tarefas acessíveis no workspace.

## Sugestões de Melhoria UI/UX (Premium)
1. **Quick Add Bar**: Entrada rápida de tarefas no topo da lista principal.
2. **Indicadores de Prioridade**: Barras laterais coloridas nos cards (Verde, Azul, Laranja, Vermelho).
3. **Empty States Motivacionais**: Ilustrações e mensagens quando a lista "Meu Dia" estiver limpa.
4. **Modo Detalhes (Side Drawer)**: Ao clicar em uma tarefa, abrir um painel lateral direito para edição rápida sem sair da lista.

## Mudanças Propostas

### Backend

#### [MODIFY] [initialize_supabase.py](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/backend/scripts/initialize_supabase.py)
- Atualizar a definição do `task_template` para incluir os novos campos (`start_date`, `is_important`, `priority`).

#### [NEW] [task_center_use_case.py](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/backend/src/application/use_cases/work_item/task_center_use_case.py)
- Implementar `GetMyTasksUseCase` que retorna as tarefas agrupadas pelas listas inteligentes.

#### [MODIFY] [work_item_routes.py](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/backend/src/infrastructure/api/routes/work_item_routes.py)
- Expor o endpoint `GET /work-items/my-tasks`.

### Frontend

#### [NEW] [MyTasksCenter.jsx](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/frontend/src/components/screens/MyTasksCenter.jsx)
- Componente principal com Sidebar interna e área de listagem.
- Implementação de **Optimistic Updates** para marcar tarefas como importantes ou concluídas.

#### [NEW] [TaskQuickAdd.jsx](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/frontend/src/components/tasks/TaskQuickAdd.jsx)
- Componente de entrada rápida de texto.

#### [MODIFY] [Sidebar.jsx](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/frontend/src/components/Sidebar.jsx)
- Adicionar link para a Central de Tarefas.

## Plano de Verificação
- Script de teste para validar a categorização das listas inteligentes no backend.
- Validação visual da responsividade e das micro-animações no frontend.
