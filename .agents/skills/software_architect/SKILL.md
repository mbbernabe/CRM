---
name: Arquiteto de Software (Clean Architecture & Python)
description: Orquestrar a construção de aplicações robustas utilizando Python, seguindo rigorosamente os princípios de Clean Architecture, Injeção de Dependências e Persistência Relacional com Migrations.
---

# Skill: Arquiteto de Software (Clean Architecture & Python)

## 🎯 Objetivo
Orquestrar a construção de aplicações robustas utilizando **Python**, seguindo rigorosamente os princípios de **Clean Architecture**, **Injeção de Dependências** e **Persistência Relacional com Migrations**.

## 🏗️ Estrutura de Diretórios Obrigatória (Foco em Workspace/SaaS)
Todo código gerado deve respeitar a hierarquia e o isolamento por `workspace_id`:
- `src/domain/`: Entidades (ex: `Workspace`, `User`, `Team`) e Interfaces (Repositories).
- `src/application/`: Use Cases (sempre exigindo `workspace_id` para operações de dados) e DTOs.
- `src/infrastructure/`: Implementações SQL (SQLAlchemy), API (FastAPI) e Security.
- `migrations/`: Scripts de migração de banco de dados e sementes (ex: `migrations/migrate_db_schema.py`).
- `resources/csv/`: Templates e dados estáticos em formato CSV para importações em massa.
- `scripts/`: Ferramentas determinísticas organizadas por contexto (ex: `scripts/database/reset_db.py`, `scripts/auth/test_auth.py`).

## 🛠️ Regras de Arquitetura Multi-Tenant
1. **Isolamento de Dados**: Toda consulta que envolva entidades de negócio (Contatos, Empresas, etc.) DEVE filtrar por `workspace_id`.
2. **Injeção de Dependência**: Use Cases devem receber os repositórios necessários e o `workspace_id` no método `execute`.
3. **Scripts Determinísticos**: Para tarefas repetitivas (reset de banco, carga de dados), SEMPRE criar ou atualizar scripts em `backend/scripts/`.

## 🛠️ Regras Técnicas de Implementação

### 1. Camada de Domínio (Domain)
- **Entidades:** Devem ser `dataclasses` ou classes puras. Ex: `Contact`, `CustomProperty`.
- **Interfaces:** Definir `IContactRepository` e `IAuditService` como abstrações.
- **Regra:** Esta camada NÃO pode importar nada de `application` ou `infrastructure`.

### 2. Camada de Aplicação (Application)
- **Injeção de Dependência:** Use Cases devem receber interfaces no `__init__`.
- **Lógica de Auditoria:** O Use Case de atualização deve garantir a criação de um registro em `AuditLog` sempre que uma propriedade for alterada.
- **DTOs:** Utilizar Pydantic para validação de entrada/saída de dados.

### 3. Camada de Infraestrutura (Infrastructure)
- **ORM:** Utilizar SQLAlchemy (Mapping Declarativo).
- **Migrations:** Toda alteração de schema deve ser acompanhada de um script de migração do **Alembic** (ou script manual equivalente) localizado em `backend/migrations/`.
- **Repositórios:** Implementar os métodos definidos nas interfaces do domínio.
- **Eager Loading Obrigatório:** Toda query que acessa relacionamentos DEVE usar `selectinload` ou `joinedload` (ver seção de Performance).
- **Índices:** Toda coluna usada em filtros frequentes (especialmente `workspace_id`) DEVE ter `index=True` (ver seção de Performance).

## ⚡ Regras de Performance (OBRIGATÓRIO)

> **Contexto:** A migração para Supabase (PostgreSQL remoto) adicionou ~50-200ms de latência por query. Padrões que eram imperceptíveis com SQLite local se acumulam e se tornam gargalos reais. As regras abaixo são **obrigatórias** para todo código novo.

### 1. Connection Pooling (Backend)
- **Regra:** O engine PostgreSQL DEVE ser configurado com pool de conexões. NUNCA usar `create_engine(url)` sem parâmetros de pool.
- **Configuração obrigatória:**
  ```python
  engine = create_engine(
      DATABASE_URL,
      pool_size=5,           # Conexões permanentes
      max_overflow=10,       # Extras em pico
      pool_timeout=30,       # Timeout para obter conexão
      pool_recycle=1800,     # Reciclar a cada 30 min
      pool_pre_ping=True,    # Testa conexão antes de usar
  )
  ```
- **Referência:** `backend/src/infrastructure/database/db.py`

### 2. Eager Loading — Prevenção de N+1 Queries (Backend)
- **Regra:** Todo método de repositório que acessa relacionamentos (ex: `field_definitions`, `field_groups`, `workspace`, `team`, `owner`) **DEVE** usar `selectinload()` ou `joinedload()`.
- **PROIBIDO:** Acessar relacionamentos via lazy loading em loops (ex: `for m in models: m.field_definitions`). Isso dispara 1 query extra por iteração.
- **Quando usar qual:**
  - `selectinload()` — Para coleções (one-to-many). Faz 1 query SELECT IN extra.
  - `joinedload()` — Para relacionamentos simples (many-to-one). Faz JOIN na mesma query.
- **Exemplo correto:**
  ```python
  def list_types(self, workspace_id):
      models = self.db.query(WorkItemTypeModel).options(
          selectinload(WorkItemTypeModel.field_definitions),
          selectinload(WorkItemTypeModel.field_groups)
      ).filter(...).all()
  ```
- **Referência:** `backend/src/infrastructure/repositories/work_item_repository.py`

### 3. Índices de Banco de Dados (Backend/Models)
- **Regra:** Toda coluna `workspace_id` (ForeignKey) DEVE ter `index=True`.
- **Índices Compostos:** Criar para combinações frequentes de filtro:
  ```python
  __table_args__ = (
      Index('ix_tabela_workspace_coluna', 'workspace_id', 'outra_coluna'),
  )
  ```
- **Tabelas que DEVEM ter índice em `workspace_id`:** `work_items`, `work_item_types`, `pipelines`, `teams`, `users`, `workspace_invitations`, `work_item_history`, `work_item_field_groups`.
- **Referência:** `backend/src/infrastructure/database/models.py`

### 4. Centralização de URL da API (Frontend)
- **Regra:** NUNCA usar URLs hardcoded (`http://localhost:8000`). Usar a constante `API_BASE_URL` de `frontend/src/config.js`.
- **fetchWithAuth:** Já faz proxy automático de URLs antigas. Novos componentes DEVEM usar caminhos relativos (ex: `/workitems/types`).
- **Chamadas `fetch()` diretas** (sem `fetchWithAuth`): Usar template string com `API_BASE_URL`:
  ```javascript
  import { API_BASE_URL } from '../../config';
  const res = await fetch(`${API_BASE_URL}/auth/login`, { ... });
  ```

## 📜 Protocolo de Log de Histórico (Audit)
Para cada alteração em `Contact`, o agente deve capturar:
- `property_name`: Nome da propriedade alterada.
- `old_value`: Valor antes da alteração (string/json).
- `new_value`: Valor após a alteração (string/json).
- `changed_at`: Timestamp UTC.

## 🚀 Comandos de Saída (Output)
Sempre que solicitado a criar uma funcionalidade, a skill deve fornecer:
1. O código da **Entidade** e **Interface**.
2. O código do **Caso de Uso** com DI.
3. O script de **Migration** correspondente.
4. O **Repository** atualizado (com eager loading e índices).
5. A **validação de performance**: confirmar que não há N+1 queries e que os índices necessários existem.

---
**Restrição:** Proibido o uso de lógica de banco de dados (SQL/Session) dentro de Use Cases ou Entidades.

