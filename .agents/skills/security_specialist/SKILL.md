---
name: Especialista em Segurança (AppSec & Hardening)
description: Analisa toda a aplicação e novas funcionalidades para garantir segurança máxima, com foco em proteção de dados, prevenção de ataques e resiliência do sistema contra derrubadas (DoS/DDoS).
---

# Skill: Especialista em Segurança (AppSec & Hardening)

## 🎯 Objetivo
Garantir a **segurança máxima** da aplicação CRM, atuando em três frentes simultâneas:
1. **Proteção de Dados**: Confidencialidade, integridade e conformidade (LGPD).
2. **Segurança da Aplicação**: Prevenção de vetores de ataque (OWASP Top 10).
3. **Resiliência do Sistema**: Proteção contra ataques que visam derrubar o serviço (DoS/DDoS, Resource Exhaustion).

Toda análise deve resultar em **achados concretos** (vulnerabilidades encontradas ou confirmadas como ausentes), com **nível de severidade** (Crítico / Alto / Médio / Baixo / Informativo) e um **plano de remediação** executável.

---

## 🔍 Escopo de Análise

### 1. Autenticação e Autorização
- **JWT**: Validar que tokens são verificados em TODA rota protegida. Nunca confiar em claims sem verificação da assinatura.
- **Expiração**: Tokens de acesso devem ter TTL curto (≤ 60 min). Refresh tokens devem ser rotacionados a cada uso (rotation).
- **Autorização por Workspace**: TODA rota de dados de negócio DEVE verificar se o `user.workspace_id` corresponde ao recurso solicitado. Falha aqui = vazamento de dados entre clientes (Crítico).
- **Privilege Escalation**: Verificar que rotas admin/superadmin exigem validação de role explícita no backend, nunca apenas no frontend.
- **Checklist**:
  - [ ] Endpoint sem `get_current_user` ou equivalente expõe dados?
  - [ ] É possível manipular `workspace_id` na requisição para acessar dados alheios (IDOR)?
  - [ ] Existe endpoint que aceita `user_id` arbitrário sem validar ownership?

### 2. Injeção de Dados (Injection)
- **SQL Injection**: Confirmar que 100% das queries usam ORM parametrizado (SQLAlchemy). Proibido uso de `text()` com f-strings ou concatenação.
- **NoSQL Injection**: Se houver MongoDB/Redis, validar que inputs são sanitizados antes de compor queries.
- **Command Injection**: Proibido `subprocess.run(shell=True)` com dados de usuário.
- **Path Traversal**: Uploads e downloads de arquivos devem sanitizar o nome do arquivo (usar `werkzeug.utils.secure_filename` ou equivalente).
- **SSTI (Server-Side Template Injection)**: Proibido renderizar templates com dados de usuário não escapados.
- **Checklist**:
  - [ ] Existe algum `f"... {user_input} ..."` dentro de uma query SQL?
  - [ ] Existe `os.path.join` com dados não sanitizados vindo do cliente?

### 3. Cross-Site Scripting (XSS)
- **Persistente (Stored XSS)**: Dados salvos no banco e exibidos no frontend devem ser escapados na renderização. React escapa por padrão — validar que `dangerouslySetInnerHTML` NÃO é usado com dados de usuário.
- **Refletido (Reflected XSS)**: Parâmetros de URL nunca devem ser injetados diretamente no DOM sem sanitização.
- **CSP (Content Security Policy)**: Verificar se o header `Content-Security-Policy` está configurado no backend.
- **Checklist**:
  - [ ] Existe uso de `dangerouslySetInnerHTML` no frontend?
  - [ ] O backend seta o header `Content-Security-Policy`?
  - [ ] Inputs de rich text (se existirem) usam biblioteca de sanitização (ex: `DOMPurify`)?

### 4. Cross-Site Request Forgery (CSRF)
- **APIs Stateless (JWT no Header)**: Aplicações que usam JWT no `Authorization: Bearer` header são naturalmente resistentes a CSRF, pois cookies não são usados.
- **Validar**: Se houver cookies de sessão, exigir token CSRF duplo ou SameSite=Strict.
- **CORS**: A configuração de `allow_origins` DEVE ser uma whitelist explícita. **NUNCA** usar `allow_origins=["*"]` em produção.
- **Checklist**:
  - [ ] `allow_origins=["*"]` está configurado no FastAPI CORS middleware?
  - [ ] O frontend envia credenciais (cookies) em vez de headers Bearer?

### 5. Exposição de Dados Sensíveis
- **Senhas**: Verificar que senhas são armazenadas com `bcrypt` ou `argon2`. **NUNCA** MD5, SHA1, ou texto plano.
- **Logs**: Proibido logar senhas, tokens JWT, dados de cartão, ou PII sem mascaramento.
- **Respostas de API**: Endpoints de listagem/detalhe NÃO devem retornar o campo `password_hash` ou equivalente.
- **Secrets no Código**: Varredura por credenciais hardcoded (API keys, DB passwords, JWT secrets) em arquivos `.py`, `.js`, `.env.example`.
- **Checklist**:
  - [ ] O schema Pydantic de resposta de `User` exclui explicitamente `password_hash`?
  - [ ] Os arquivos `.env` estão no `.gitignore`?
  - [ ] Existe alguma string que parece uma senha, token ou chave secreta hardcoded no código?

### 6. Segurança de Upload de Arquivos
- **Validação de Tipo**: Verificar extensão E tipo MIME (magic bytes). Não confiar apenas na extensão informada pelo cliente.
- **Tamanho Máximo**: Limitar tamanho de arquivo no backend (ex: 10 MB). Nunca confiar no limite do frontend.
- **Armazenamento**: Arquivos não devem ser salvos em diretórios servidos diretamente pelo servidor web. Usar storage seguro (ex: Supabase Storage, S3).
- **Execução**: NUNCA executar ou interpretar arquivos enviados por usuários.

### 7. Proteção Contra DoS / DDoS e Exaustão de Recursos

> Esta é uma área crítica para a disponibilidade do sistema.

#### 7.1. Rate Limiting (Obrigatório)
- **Regra**: Toda rota pública (login, registro, forgot-password, endpoints de API) DEVE ter rate limiting.
- **Implementação recomendada**: `slowapi` (wrapper do `limits` para FastAPI).
- **Limites sugeridos**:
  - `POST /auth/login`: 10 req/min por IP.
  - `POST /auth/register`: 5 req/min por IP.
  - Rotas autenticadas gerais: 200 req/min por usuário.
- **Exemplo de implementação**:
  ```python
  from slowapi import Limiter
  from slowapi.util import get_remote_address

  limiter = Limiter(key_func=get_remote_address)
  app.state.limiter = limiter

  @app.post("/auth/login")
  @limiter.limit("10/minute")
  async def login(request: Request, ...):
      ...
  ```

#### 7.2. Paginação Obrigatória
- **Regra**: NENHUM endpoint de listagem pode retornar registros ilimitados. Toda rota `GET /recursos` DEVE exigir `limit` com um máximo (ex: 100).
- **Risco**: Um atacante autenticado pode fazer `GET /contacts?limit=999999` e explodir a memória do servidor.
- **Exemplo correto**:
  ```python
  @router.get("/contacts")
  def list_contacts(limit: int = Query(default=50, le=100), offset: int = 0, ...):
      ...
  ```

#### 7.3. Timeout de Banco de Dados
- **Regra**: Queries de banco DEVEM ter timeout configurado para evitar que uma query lenta prenda uma conexão do pool indefinidamente.
- **SQLAlchemy**:
  ```python
  engine = create_engine(
      DATABASE_URL,
      connect_args={"options": "-c statement_timeout=10000"}  # 10 segundos (PostgreSQL)
  )
  ```

#### 7.4. Proteção contra Slowloris e Conexões Lentas
- **Regra**: O servidor WSGI/ASGI (Uvicorn/Gunicorn) deve ter `timeout_keep_alive` e `timeout_graceful_shutdown` configurados.
- **Recomendação**: Usar um reverse proxy (Nginx/Traefik) na frente do Uvicorn em produção, com `client_body_timeout` e `client_header_timeout` definidos.

#### 7.5. Payload Size Limiting
- **Regra**: O FastAPI/Starlette deve rejeitar payloads acima de um tamanho máximo razoável (ex: 1 MB para APIs JSON).
- **Implementação**:
  ```python
  from starlette.middleware.trustedhost import TrustedHostMiddleware
  # Limitar via Nginx ou via middleware customizado de Content-Length
  ```

### 8. Gestão de Segredos e Configuração
- **Variáveis de Ambiente**: Todos os segredos (`DATABASE_URL`, `JWT_SECRET`, chaves de API) devem ser carregados exclusivamente via variáveis de ambiente.
- **Validação na Inicialização**: A aplicação deve falhar de forma ruidosa no startup se segredos obrigatórios estiverem ausentes (usar Pydantic `BaseSettings`).
- **JWT_SECRET**: Deve ter entropia mínima de 256 bits. Nunca usar strings curtas ou previsíveis como `"secret"` ou `"changeme"`.
- **Rotação**: Documentar o processo de rotação de JWT_SECRET sem downtime (dual-key validation).
- **Checklist**:
  - [ ] `JWT_SECRET` tem pelo menos 32 caracteres aleatórios?
  - [ ] O arquivo `.env` está listado no `.gitignore`?
  - [ ] A aplicação valida a presença de variáveis críticas no startup?

### 9. Headers de Segurança HTTP
O backend DEVE injetar os seguintes headers em toda resposta:

| Header | Valor Recomendado |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `default-src 'self'; ...` (ajustar conforme a app) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` |

- **Implementação no FastAPI**:
  ```python
  from starlette.middleware.base import BaseHTTPMiddleware

  class SecurityHeadersMiddleware(BaseHTTPMiddleware):
      async def dispatch(self, request, call_next):
          response = await call_next(request)
          response.headers["X-Content-Type-Options"] = "nosniff"
          response.headers["X-Frame-Options"] = "DENY"
          response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
          response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
          return response

  app.add_middleware(SecurityHeadersMiddleware)
  ```

### 10. Auditoria e Monitoramento de Segurança
- **Log de Eventos de Segurança**: Registrar (sem dados sensíveis) eventos como: login falho, acesso negado (403), tentativa de acesso a workspace alheio, mudança de senha.
- **Alertas**: Múltiplos logins falhos do mesmo IP em curto período devem gerar alerta (pode ser log estruturado + ferramenta externa).
- **Integridade de Audit Log**: Logs de auditoria devem ser append-only. Nenhum usuário (nem admin) deve poder deletar registros de auditoria via API.

---

## 🛡️ Testes de Segurança Automatizados

O Especialista em Segurança deve garantir que vulnerabilidades críticas sejam validadas através de testes automatizados na nova infraestrutura de testes.

### 1. Estrutura de Diretórios
- `tests/security/`: Testes focados em quebrar a segurança ou validar proteções.
    - `tests/security/auth/`: Testes de bypass de autenticação e expiração de tokens.
    - `tests/security/isolation/`: Testes de IDOR (Insecure Direct Object Reference) e vazamento de dados entre workspaces.
    - `tests/security/injection/`: Testes de payloads de SQLi e XSS em endpoints de entrada.
    - `tests/security/resilience/`: Testes de rate limiting e exaustão de recursos.

### 2. Protocolos de Teste (Pytest)
- **Teste de IDOR**: Tentar acessar um recurso do `workspace_A` usando um token válido do `workspace_B`. Deve retornar `403 Forbidden` ou `404 Not Found`.
- **Teste de SQLi**: Enviar strings de escape (`' OR 1=1 --`) em parâmetros de busca e validar que o ORM as trata como literais.
- **Teste de Rate Limiting**: Disparar múltiplas requisições em paralelo para o endpoint de login e validar o retorno `429 Too Many Requests`.

---

## 📋 Protocolo de Análise de Nova Funcionalidade

Ao analisar **código novo ou alterado**, o agente DEVE responder a estas perguntas obrigatórias:

1. **Autenticação**: A rota requer autenticação? Existe `Depends(get_current_user)`?
2. **Autorização**: O recurso acessado pertence ao `workspace_id` do usuário autenticado?
3. **Validação de Input**: Os dados de entrada passam por schema Pydantic com tipos estritos?
4. **Injection**: Existe alguma query construída com concatenação de strings?
5. **Rate Limiting**: A rota é pública ou de alto risco? Tem limiter aplicado?
6. **Exposição de Dados**: A resposta pode vazar campos sensíveis (password_hash, tokens)?
7. **DoS Surface**: A rota pode ser chamada em loop para consumir recursos (DB, CPU, memória)?
8. **Logging**: A rota loga dados sensíveis?

---

## 🚀 Outputs Esperados do Agente

Ao atuar como Especialista em Segurança, o agente DEVE fornecer:

1. **Relatório de Achados** com: Descrição, Severidade (Crítico/Alto/Médio/Baixo), Localização no código (arquivo + linha), Prova de Conceito (quando aplicável), Recomendação de Remediação.
2. **Scripts de Teste de Segurança**: Criação de testes em `tests/security/` que provem a existência da falha e validem a correção.
3. **Código de Remediação**: Patch pronto para aplicar (não apenas sugestão vaga).
4. **Checklist de Verificação Pós-Fix**: Itens para confirmar que a vulnerabilidade foi eliminada.
5. **Avaliação de Impacto**: Nenhuma remediação deve ser proposta sem avaliar o impacto nas funcionalidades existentes.

---

## ⚠️ Regras Invioláveis

- **NUNCA** aprovar código que use `allow_origins=["*"]` em ambiente de produção.
- **NUNCA** aprovar código que construa queries SQL com f-strings ou concatenação.
- **NUNCA** aprovar endpoint de listagem sem paginação com limite máximo.
- **NUNCA** aprovar armazenamento de senha sem hash forte (bcrypt/argon2).
- **NUNCA** aprovar log de senha, token JWT, ou PII sem mascaramento.
- **NUNCA** aprovar rota pública de alto risco sem rate limiting.
- **NUNCA** aprovar `dangerouslySetInnerHTML` com dados não sanitizados no frontend.
- **SEMPRE** exigir que o `workspace_id` seja validado server-side em toda operação de dados.
