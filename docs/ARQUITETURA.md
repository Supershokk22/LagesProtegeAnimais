# ARQUITETURA

## 1. Visão geral

```
┌────────────────────────────────────────────────────────────────────┐
│  NAVEGADOR                                                             │
│  PWA (manifest + service worker) · Rascunho em localStorage            │
└───────────────┬────────────────────────────────────────────────────┘
                │ HTTPS (TLS 1.3 · HSTS)
┌───────────────▼────────────────────────────────────────────────────┐
│  EDGE — Caddy / CDN                                                   │
│  TLS automático · HSTS · CSP · rate limit por IP · cache estático     │
└───────────────┬────────────────────────────────────────────────────┘
                │
┌───────────────▼────────────────────────────────────────────────────┐
│  NEXT.JS 15 — App Router                                               │
│                                                                         │
│  Server Components (leitura, KPIs, páginas públicas)                   │
│  Client Components (formulário multi-etapa, Leaflet)                    │
│  Route Handlers (/api/v1/*)                                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ CAMADA DE REGRAS                                              │  │
│  │ guards.ts ──► requirePermission / requireRestrictedAccess      │  │
│  │ permissions.ts ──► RBAC 13 papéis · 47 permissões · herança    │  │
│  │ ratelimit.ts ──► janela deslizante + lockout progressivo        │  │
│  │ validation/schemas.ts ──► Zod (autoridade única)                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ DOMÍNIO                                                      │  │
│  │ reports/triage.ts    ──► motor de triagem (função pura)         │  │
│  │ reports/workflow.ts  ──► máquina de estados + SLA dias úteis    │  │
│  │ reports/service.ts   ──► protocolo, publicação, visibilidade   │  │
│  │ geo/protection.ts    ──► jitter determinístico + grade          │  │
│  │ evidence/storage.ts  ──► magic bytes, SHA-256, custódia        │  │
│  │ matching/engine.ts   ──► score perdido ↔ encontrado            │  │
│  │ analytics/…          ──► k-anonimato, heatmap, SLA board       │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ AUDITORIA  ──► audit_logs (imutável) + system_logs             │  │
│  │ Redator automático de PII antes de gravar                      │  │
│  └───────────────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────┬─────────────────────────────┘
                │                       │
┌───────────────▼──────────────┐ ┌──────▼──────────────────────────────┐
│  PostgreSQL 16                │ │  STORAGE                           │
│  73 tabelas · 38 enums        │ │  PRIVATE (disco, fora de /public)  │
│  131 índices · 137 FKs        │ │  ou S3 bucket privado + URL assinada│
│  uuid(7) ordenável            │ │  chave = sha256/xx/<hash>.<ext>    │
│  citext (e-mail CI)           │ │                                     │
│  soft delete onde há valor    │ │  SHA-256 congelado no vínculo      │
│  histórico/legal              │ │  Divergência → incidente aberto    │
└───────────────────────────────┘ └─────────────────────────────────────┘
```

## 2. Diagrama de componentes

| Componente | Responsabilidade | Arquivo |
|---|---|---|
| **ReportTriage** | Sugere urgência a partir de fatores objetivos; gera perguntas para o humano | `lib/reports/triage.ts` |
| **ReportWorkflow** | Grafo de 15 estados; SLA em dias úteis | `lib/reports/workflow.ts` |
| **ReportService** | Protocolo, transições, publicação, leitura com controle de precisão | `lib/reports/service.ts` |
| **GeoProtection** | Jitter determinístico, grade de agregação, recorrência, validação de bbox | `lib/geo/protection.ts` |
| **EvidenceStorage** | Validação 4 camadas, SHA-256, custódia, link externo assinado | `lib/evidence/storage.ts` |
| **MatchEngine** | Score + fatores + checklist humano | `lib/matching/engine.ts` |
| **AccessGuard** | requirePermission, requireRole, requireRestrictedAccess, enforceRateLimit | `lib/auth/guards.ts` |
| **RbacMatrix** | 13 papéis com herança, 47 permissões, invariantes testáveis | `lib/auth/permissions.ts` |
| **AuditTrail** | Redator de PII, log imutável, `withAudit` transacional | `lib/audit.ts` |
| **Observatorio** | KPIs, série temporal, heatmap público, SLA board, relatório | `lib/analytics/observatorio.ts` |

## 3. Modelo de dados (grupos)

**Identidade (9):** users · profiles · roles · permissions · user_roles · role_permissions ·
sessions · one_time_tokens · login_attempts

**Geografia (2):** neighborhoods · locations

**Denúncias (8):** reports · report_status_history · report_evidence · report_assignments ·
report_notes · report_sources · report_animals · sla_policies

**Animais (7):** animals · animal_images · foster_links · adoptions · adoption_requests ·
adoption_followups · lost_animals / found_animals

**Matching (1):** animal_matches

**Rede institucional (6):** organizations · organization_members · protectors · veterinarians ·
clinics · vet_appointments

**Comunidade (8):** communities · community_members · posts · comments · reactions · follows ·
direct_messages · content_reports · moderation_actions

**Anexos (2):** attachments · report_evidence

**Civicidade (5):** campaigns · campaign_updates · events · event_registrations ·
volunteer_opportunities / volunteer_profiles / volunteer_applications

**Fonte oficial (2):** official_contacts · source_registry

**Governança (11):** restricted_guardianship_records · audit_logs · system_logs · tickets ·
ticket_messages · notifications · consent_records · legal_documents · privacy_requests ·
security_incidents · rate_limit_counters

**Conteúdo (1):** content_pages

**Dados (3):** export_logs · import_jobs · report_snapshots

## 4. Decisões e-trade-offs

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| scrypt (N=16384) | Argon2id | Sem dependência nativa; argon2id é o ideal — trocar é 1 função em `crypto.ts` |
| Rate limit em tabela | Redis | Zero infraestrutura extra para volume municipal; migrar é trocar `checkRateLimit` |
| Jitter determinístico | Ruído aleatório | Coerência entre mapa/relatório/exportação sem guardar segredo |
| Grade de agregação em SQL | PostGIS | Sem extensão required; performance suficiente no volume municipal |
| Heatmap em canvas | plugin `leaflet.heatmap` | 0 KB de dependência, controle total de opacidade |
| Markdown próprio | `react-markdown` | Sanitização trivial: escapa tudo antes de formatar |
| RBAC materializado | Checagem só por papel | Permite testar separação de poderes como invariante |
| `uuid(7)` | `uuid(4)` / serial | Ordenável por tempo → índice B-tree sem fragmentação |

## 5. Fluxos críticos

### 5.1 Denúncia

```
Cidadão → validação Zod → computeTriage() (puro)
   → nextProtocol() → LPA-2026-000001
   → derivePublicCoordinates() → exactLat/Lng + publicLat/Lng (2 níveis)
   → recurrenceKeyFor() → contagem de recorrência
   → SLA base ALTA → dueAt
   → TRANSÇÃO: reports + report_status_history + report_evidence (tudo ou nada)
   → audit + log
   → resposta: protocolo + suggestedUrgency + fatores + perguntas
```

### 5.2 Publicação

```
Supervisor → publishReport()
   → verifica report_sources com status VERIFICADO
   → SEM fonte → 409 SOURCE_NOT_VERIFICADO
   → com fonte → isPublic=true, publishedAt, publishedBy → audit
```

### 5.3 Acesso ao registro restrito

```
Operador → requireRestrictedAccess(motivo)
   → sem permissão OU motivo < 10 chars → 403
   → com ambos → consulta + audit(isSensitiveAccess: true, reason)
```

### 5.4 Leitura de evidência

```
GET anexo → checa ReportEvidence.accessLevel vs permissões
   → lê binário → recalcula SHA-256
   → divergência? → cria security_incident + audita + 409
   → ok → incrementa viewCount → audit(sensitive) → devolve
```