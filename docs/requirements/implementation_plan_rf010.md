# Plano de Implementação: Visibilidade por Time (RF010)

## 🎯 Objetivo
Restringir o acesso a `WorkItems` (Contatos, Negócios, etc.) com base no time do usuário logado. Administradores continuam tendo acesso global ao Workspace.

## 🛠️ Alterações Sugeridas

### 1. Camada de Domínio (Repository Interface)
- Atualizar `IWorkItemRepository` para aceitar um `team_id` opcional nos métodos de listagem e busca.
- Métodos afetados: `list_by_pipeline`, `list_by_stage`, `list_by_type`, `get_by_id`, `search`.

### 2. Camada de Infraestrutura (SQLAlchemy)
- Implementar a lógica de filtro no `WorkItemRepository`.
- **Regra**: Se `team_id` for fornecido, a query deve incluir `.filter(WorkItemModel.team_id == team_id)`.
- Considerar se itens sem time (`team_id IS NULL`) devem ser visíveis para todos ou apenas administradores.

### 3. Camada de Aplicação (Use Cases)
- Modificar os Casos de Uso para identificar o papel (`role`) e o time (`team_id`) do usuário requisitante.
- **Lógica de Decisão**:
    - Se `user.role == 'admin'` ou `user.role == 'super_admin'`: não aplica filtro de time.
    - Caso contrário: aplica filtro pelo `user.team_id`.

### 4. API (Routes/Dependencies)
- Garantir que a dependência `get_current_user` forneça o objeto de usuário completo para os Casos de Uso.

## 📐 Regras de Negócio (Detalhamento)
| Cenário | Acesso Esperado |
|---------|-----------------|
| Usuário Admin | Vê todos os itens do Workspace. |
| Usuário Comum (Time A) | Vê apenas itens onde `team_id == Time A`. |
| Item sem Time Atribuído | Visível apenas para Admins (ou definir se é "Global"). |
| Busca Global | Resultados filtrados pelo time do usuário. |

## 🚀 Próximos Passos
1. [ ] Atualizar status da **RF010** no PRD para "Em Andamento".
2. [ ] Modificar a interface `IWorkItemRepository`.
3. [ ] Implementar filtro no `WorkItemRepository`.
4. [ ] Atualizar Casos de Uso de listagem.
5. [ ] Testar com usuários de times diferentes.
