# Plano de Implementação: Finalização do RF026 (Provisionamento de Tarefas)

## Objetivo
Corrigir o erro de provisionamento duplicado de pipelines durante o registro de novos usuários, o que pode estar causando o travamento do sistema (devido a violações de restrição de unicidade ou deadlocks no SQLite), e garantir que o RF026 esteja totalmente funcional.

## Problema Identificado
1.  **Redundância**: O método `WorkItemRepository.clone_type` já realiza a clonagem de todas as pipelines associadas ao template global.
2.  **Conflito**: O caso de uso `RegisterUserUseCase` tenta clonar a pipeline "Fluxo de Tarefas" manualmente logo após chamar `clone_type`, resultando em uma tentativa de criar uma duplicata com o mesmo nome para o mesmo tipo/workspace, violando a `UniqueConstraint` em `pipelines`.
3.  **Estabilidade**: Falta de tratamento de rollback em alguns métodos do repositório de pipelines pode deixar a sessão em estado inconsistente.

## Mudanças Propostas

### Backend

#### [MODIFY] [auth_use_cases.py](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/backend/src/application/use_cases/auth_use_cases.py)
- Remover a lógica redundante de clonagem de pipeline no método `_provision_default_tasks`.
- Deixar apenas a chamada para `clone_type`, que agora é a "fonte da verdade" para clonagem completa de modelos.

#### [MODIFY] [sqlalchemy_pipeline_repository.py](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/backend/src/infrastructure/repositories/sqlalchemy_pipeline_repository.py)
- Adicionar tratamento de `try...except` com `db.rollback()` no método `clone_from_template` para garantir segurança em caso de erros inesperados.

#### [MODIFY] [test_register.py](file:///c:/Users/mbarroso/OneDrive%20-%20Tribunal%20de%20Justica%20do%20Estado%20do%20Rio%20de%20Janeiro/wokspace/CRM/backend/scripts/test_register.py)
- Atualizar o script para usar um e-mail novo a cada execução (ou permitir parametrização) para facilitar testes repetidos.

## Plano de Verificação

### Testes Automatizados
1. Executar o script de inicialização do banco para garantir templates globais: `py scripts/initialize_supabase.py`.
2. Iniciar o servidor backend.
3. Executar o script de teste de registro: `py scripts/test_register.py`.
4. Verificar no banco de dados se o novo workspace possui exatamente:
   - 1 Tipo de WorkItem "Tarefa".
   - 1 Pipeline "Fluxo de Tarefas" vinculada ao tipo "Tarefa".
   - Os estágios "A fazer", "Fazendo", "Feito" criados corretamente.

### Verificação Manual
1. Criar um novo usuário via interface web (se disponível) e verificar se a aba de "Tarefas" ou a listagem de tipos já mostra a Tarefa provisionada.
