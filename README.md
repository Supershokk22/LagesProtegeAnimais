# ============================================================================
# LAGES PROTEGE ANIMAIS
# Plataforma municipal de proteção e bem-estar animal — Lages/SC
# ============================================================================

Plataforma de utilidade pública que concentra, em um único ambiente: canal estruturado de
denúncia de maus-tratos e abandono, triagem com SLA, cadeia de custódia de evidências, mapa com
proteção geoespacial, adoção responsável, reencontro de perdidos e encontrados, rede comunitária
moderada e observatório municipal com transparência.

---

## Contexto que motivou o projeto

Em agosto de 2026, Lages registrou o achado de mais de 20 corpos de cães em sacos de lixo na
antiga BR-2, bairro Santa Clara. O caminho do caso foi: morador registrou **boletim de ocorrência** →
Cobea (Centro de Bem-Estar Animal) foi ao local → finds carcaças → caso foi oficiado ao
**Ministério Público** → o caso foi oficiado → a associação protetora passou a demandar ação
judicial. Em paralelo, a Polícia Civil reforçou fiscalização na região com apoio da Polícia
Militar Ambiental, e a Câmara de Vereadores apresentou moções para videomonitoramento e placas
de conscientização.

O diagnóstico: **não faltava lei** (Lei 9.605/1998 art. 32 + Lei 14.064/2020 já punem com 2–5 anos
de reclusão para cão/gato). Faltava o **trilho estruturado** entre o relato, a triagem, o
encaminhamento e o resultado — e faltava um canal que não exponha o denunciante nem o citado.

Esta plataforma é esse trilho.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 |
| Backend | Next.js Server Actions / Route Handlers (Node runtime) |
| Banco | PostgreSQL 14+ (16 recomendado) · Prisma 6 |
| Mapa | Leaflet + OpenStreetMap (heatmap em canvas, sem plugin) |
| Validação | Zod 4 (frontend **e** backend) |
| Autenticação | JWT curto + refresh opaco rotativo · TOTP (RFC 6238) · scrypt |
| Armazenamento | Disco privado por padrão · S3-compatible opcional |
| PWA | manifest + service worker + fallback offline |
| Testes | Vitest (37 testes de núcleo) |

---

## Início rápido

```bash
# 1. Dependências
npm ci

# 2. Variáveis
cp .env.example .env
openssl rand -base64 48   # AUTH_SECRET
openssl rand -base64 32   # TOTP_ENCRYPTION_KEY
openssl rand -base64 32   # PASSWORD_PEPPER

# 3. Banco
npx prisma generate
npx prisma migrate deploy     # aplica prisma/migrations/0_init/migration.sql
npm run db:seed               # RBAC, SLA, bairros, contatos, documentos jurídicos

# 4. Rodar
npm run dev                   # http://localhost:3000
```

Sem Docker: aponte `DATABASE_URL` para um PostgreSQL local. A extensão `citext` é criada pela
migration automaticamente.

---

## Estrutura

```
lagea/
├─ prisma/
│  ├─ schema.prisma                  73 tabelas · 38 enums · 131 índices · 137 FKs
│  ├─ migrations/0_init/             SQL inicial (2 414 linhas)
│  └─ seed.ts                        RBAC, SLA estrutural, bairros, juridico
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                    homepage institucional
│  │  ├─ denunciar/                  fluxo de 7 etapas + modo emergência (§98-§99)
│  │  ├─ emergencia/                central de contatos oficiais (§14)
│  │  ├─ mapa/                      mapa agregado (§11)
│  │  ├─ adocao/ perdidos/ encontrados/
│  │  ├─ observatorio/               KPIs + série temporal + SLA (§34-§36)
│  │  ├─ transparencia/              painel de dados agregados (§100)
│  │  ├─ legal/[slug]/               termos, privacidade, cookies, retenção (§114)
│  │  ├─ admin/                      painel institucional (§40)
│  │  ├─ offline/                    fallback de baixa conectividade (§65)
│  │  └─ api/v1/                     auth · reports · map · openapi · health
│  ├─ components/
│  │  ├─ layout/chrome.tsx           identidade visual + header + footer (§3)
│  │  ├─ map/MapView.tsx             Leaflet, círculo + heatmap canvas
│  │  ├─ map/MapLoader.tsx           wrapper client (ssr:false)
│  │  └─ lists/ListView.tsx          perdidos/encontrados com contato mediado
│  ├─ lib/
│  │  ├─ auth/permissions.ts         matriz RBAC de 13 papéis (§17)
│  │  ├─ auth/guards.ts              requirePermission / requireRestrictedAccess
│  │  ├─ auth/session.ts             JWT + refresh rotativo + detecção de reuso
│  │  ├─ auth/crypto.ts              scrypt + AES-256-GCM para TOTP
│  │  ├─ reports/triage.ts           motor de triagem (§8)
│  │  ├─ reports/workflow.ts         máquina de estados + SLA em dias úteis (§9, §84)
│  │  ├─ reports/service.ts          protocolo, publicação, visibilidade
│  │  ├─ geo/protection.ts           jitter determinístico + grade (§12)
│  │  ├─ evidence/storage.ts         magic bytes, SHA-256, cadeia de custódia (§10, §44)
│  │  ├─ matching/engine.ts          score perdido ↔ encontrado (§26)
│  │  ├─ analytics/observatorio.ts   k-anonimato + heatmap público
│  │  ├─ validation/schemas.ts       Zod + filtro anti-assédio
│  │  ├─ ratelimit.ts                janela deslizante + lockout progressivo
│  │  ├─ audit.ts                    trilha imutável com redator de PII
│  │  └─ api/openapi.ts              OpenAPI 3.1 (fonte única)
│  └─ generated/prisma/              Prisma Client (git-ignored)
├─ tests/nucleo.test.ts              37 testes
├─ public/                           manifest, sw.js, openapi.json, offline.html
├─ docs/                             institucional, checklists, roadmap
├─ Dockerfile · docker-compose.yml · Caddyfile
└─ DEPLOY.md
```

---

## Decisões técnicas que sustentam o sistema

### 1. Ninguém tem acesso só por ser "admin"

Toda checagem é por **permissão**, nunca por papel:

```ts
await requirePermission("report:read_exact_location", ctx);
```

13 papéis com herança declarada (`SUPERVISOR` herda `INSTITUTIONAL_OPERATOR`), 47 permissões
granulares. `AUDITOR` tem leitura ampla e **escrita zero** — separação de poderes verificável por
teste. Invariantes em `PERMISSION_INVARIANTS` são testadas.

### 2. A urgência nunca é definida pelo usuário

`computeTriage()` é **função pura** — sem banco, sem relógio, sem aleatoriedade. Mesma entrada,
mesma saída. Ela produz `suggestedUrgency` e a **pergunta** que o humano precisa responder
(`questionsToHuman`).

A coluna `urgency` nasce como `BAIXA`. Só muda via `decideTriage()`, que exige
`triage:decide` + justificativa de 10+ caracteres.

Se o fato relatado for **mais grave** que o que o cidadão declarou, a divergência é sinalizada
(`userClaimWasDowngraded: true`) e a equipe é avisada. Errar para menos é o erro caro.

Fator específico: presença de **carcaça** cria piso mínimo `ALTA`, porque descarte clandestino em
via pública responde à Lei 9.605/1998 e exige preservação do local para perícia — destroying do
local destrói a prova.

### 3. A coordenada exata nunca é publicada

Duas colunas, dois níveis:

| Coluna | Visível para |
|---|---|
| `exactLat/exactLng` | `report:read_exact_location` (exige AAL2) |
| `publicLat/publicLng` | público, já agregada ou deslocada |

O deslocamento é **determinístico** (seed = hash do protocolo via FNV-1a): o mesmo caso produz o
mesmo ponto borrado, então mapa, relatório e exportação não se contradizem — sem guardar segredo
adicional.

`isValidLatLng()` recusa qualquer ponto fora da Serra Catarinense. *(Um bug real foi encontrado
pelos testes aqui: os limites tinham o sinal de lat/lng invertido, rejeitando Lages.)*

### 4. Evidência tem integridade verificável

1. Nome final **gerado pelo servidor** a partir do SHA-256 (`sha256/ab/abcd….jpg`). O nome do
   cliente nunca vira caminho.
2. Validação em 4 camadas: extensão → MIME declarado → **magic bytes** → tamanho.
   `Content-Type` do cliente não é confiável.
3. Storage fora de `/public` por padrão.
4. SHA-256 congelado no momento do vínculo. Divergência no acesso → **incidente de segurança
   aberto automaticamente** + recusa de entrega.
5. Toda visualização/download grava auditoria; evidência restrita marca `isSensitiveAccess`.
6. Link externo = HMAC com expiração (15 min), sem criar sessão.

### 5. A publicação exige fonte

`publishReport()` recusa com `SOURCE_NOT_VERIFICADO` se não houver `report_sources` com status
`VERIFICADO`. Sem confirmação, a UI exibe *"INFORMACAO PENDENTE DE VERIFICAÇÃO"*.

Nenhum telefone nasce sem `sourceUrl`. Sem fonte, o card mostra **PENDENTE DE VERIFICAÇÃO OFICIAL**
em vez do número — campo em branco é melhor que telefone errado.

### 6. Transparência por construção, não por promessa

`src/app/transparencia/page.tsx` **não importa nenhuma coluna de dado pessoal**. Só funções
agregadoras. Distribuição por bairro aplica k-anonimato: células com n<5 são fundidas em "Outros
bairros (amostra insuficiente)".

### 7. Denúncia anônima com rascunho local

Fluxo de 7 etapas com `localStorage`. Urgência `CRITICA`/`URGENTE` **reduz para 5 etapas** e dispensa
aceite de termo. Recarregar a página não perde nada (§65).

O formulário rejeita CPF e telefone de terceiros em campo livre — validação no cliente **e** no
schema do backend.

### 8. Denúncia nunca vira culpa

Filtro de moderação bloqueia doxxing, ameaça e rótulo acusatório. A interface usa
*"pessoa mencionada na denúncia"*. `neutralizeLabel()` centraliza essa política.

---

## Endpoints

| Método | Rota | Acesso |
|---|---|---|
| `POST` | `/api/v1/reports` | público |
| `GET` | `/api/v1/reports` | público (só casos publicados) |
| `GET` | `/api/v1/map` | público (agregado) |
| `POST` | `/api/v1/auth/register` | público |
| `POST` | `/api/v1/auth/login` | público |
| `POST` | `/api/v1/auth/logout` | sessão |
| `GET` | `/api/v1/openapi` | público |
| `GET` | `/api/health` | público |

Envelope uniforme: `{ ok:true, data, meta }` / `{ ok:false, error:{ code, message, details } }`.
Consulte `public/openapi.json` (23 `$ref` validadas) ou `/api/v1/openapi`.

---

## Scripts

```bash
npm run dev            # desenvolvimento
npm run build          # prisma generate && next build
npm start              # produção
npm run typecheck      # tsc --noEmit
npm test               # vitest (37 testes)
npm run lint           # eslint
npm run db:migrate     # prisma migrate dev
npm run db:deploy      # prisma migrate deploy
npm run db:seed        # tsx prisma/seed.ts
npm run openapi        # regenera e valida public/openapi.json
```

---

## Segurança — estado atual

**Implementado:** hash scrypt com pepper · TOTP AES-256-GCM · refresh token rotativo com detecção
de reuso · lockout progressivo · rate limit por sessão com janela adaptativa para anônimos ·
RBAC por permissão com 2FA obrigatório em escrita sensível · upload com magic bytes e storage
privado · SHA-256 em cadeia de custódia · CSP/HSTS/X-Frame-Options via Caddy · redator de PII na
auditoria · bloqueio de sessão anônima ao registro restrito · bloqueio de indexação de
`/admin`.

**Dependências auditadas:** `npm audit` reporta avisos em `deepmerge-ts` (CLI do Prisma) e
`postcss` (embutido no Next). Ambos são **build-time** e não alcançáveis em runtime. Mascarados
por decisão consciente, não por descuido — ver `docs/SEGURANCA.md`.

**Antes de ir ao ar:** preencher `SEED_SUPERADMIN_EMAIL/PASSWORD`, configurar
`TURNSTILE_SECRET_KEY`, definir os **tempos oficiais de SLA** com o órgão competente e registrar
em `sla_policies.defined_by_org`, confirmar os contatos oficiais, nomear o encarregado (DPO) e
publicar o e-mail institucional real.

---

## LGPD

Matriz dado → finalidade → base legal → retenção → acesso → eliminação documentada em
`src/lib/../legal` (seed). Direitos do titular com prazo de 15 dias e modelo de
`privacy_requests`. Aceite versionado em `consent_records`. Módulo de impedimentos restrito:
acesso exige permissão **e** motivo escrito, com auditoria `isSensitiveAccess` em toda consulta.

---

## Documentação

- [`DEPLOY.md`](DEPLOY.md) — VPS/Docker, Vercel, backup, runbook
- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — componentes, modelo de dados, fluxos
- [`docs/SEGURANCA.md`](docs/SEGURANCA.md) — checklist e decisões de risco
- [`docs/LGPD.md`](docs/LGPD.md) — matriz, direitos, incidente
- [`docs/ACESSIBILIDADE.md`](docs/ACESSIBILIDADE.md) — WCAG 2.2 AA
- [`docs/GOVERNANCA.md`](docs/GOVERNANCA.md) — RACI, papéis, SLA
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — 4 fases
- [`docs/INSTITUCIONAL.md`](docs/INSTITUCIONAL.md) — material para a Câmara
- [`docs/MANUAL_OPERADORES.md`](docs/MANUAL_OPERADORES.md) — como analisar, triar, publicar

---

## Licença e uso

Projeto de utilidade pública. Os dados pessoais tratados seguem a Lei 13.709/2018. Nenhuma
informação real é inventada: campos sem fonte exibem **PENDENTE DE VERIFICAÇÃO OFICIAL**.