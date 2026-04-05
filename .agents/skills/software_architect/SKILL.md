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
- **Migrations:** Toda alteração de schema deve ser acompanhada de um script de migração do **Alembic**.
- **Repositórios:** Implementar os métodos definidos nas interfaces do domínio.

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
4. O **Repository** atualizado.

---
**Restrição:** Proibido o uso de lógica de banco de dados (SQL/Session) dentro de Use Cases ou Entidades.
