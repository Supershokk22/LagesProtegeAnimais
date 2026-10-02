# DEPLOY — Lages Protege Animais

## 1. Requisitos mínimos

| Componente | Mínimo | Recomendado |
|---|---|---|
| Node.js | 20 LTS | 22 LTS |
| PostgreSQL | 14 (precisa de `citext`) | 16 |
| RAM | 2 GB | 4 GB |
| Disco | 20 GB | 40 GB (evidências + backups) |
| TLS | obrigatório | CDN na frente |

O build do Next consome ~1.5 GB. Se o host tiver 2 GB, configure swap ou use build em CI e suba apenas `.next`.

---

## 2. Opção A — VPS com Docker (recomendada para servidor público)

### 2.1 Preparar

```bash
cp .env.example .env
# gere os segredos:
openssl rand -base64 48   # AUTH_SECRET
openssl rand -base64 32   # TOTP_ENCRYPTION_KEY
openssl rand -base64 32   # PASSWORD_PEPPER
```

Preencha `.env` com os valores gerados. **`TOTP_ENCRYPTION_KEY` tem exatamente 32 bytes em base64** — outro tamanho faz o 2FA falhar no boot.

### 2.2 Subir

```bash
docker compose up -d db
npm run db:deploy        # aplica migrations
npm run db:seed          # RBAC, SLA estrutural, bairros, juridico
docker compose up -d app proxy
docker compose logs -f app
```

### 2.3 DNS

Aponte o domínio para o IP do servidor. O Caddy obtém certificado TLS automático via Let's Encrypt quando o DNS propagar.

### 2.4 Health check

```bash
curl -fsS https://SEU_DOMINIO/api/health
```

---

## 3. Opção B — Vercel + banco gerenciado

| Item | Serviço |
|---|---|
| App | Vercel (plano Hobby/Pro) |
| Banco | Neon, Supabase ou Railway (PostgreSQL) |
| Storage de evidências | Cloudflare R2 / S3 / Supabase Storage (bucket **privado**) |
| CDN + WAF | Cloudflare (free já resolve TLS e HSTS) |

```bash
# Na Vercel:
#   Build Command:  npx prisma generate && next build
#   Output:         .next (Next.js detector automatico)
#   Installed:      npm ci
```

Variáveis: todas as de `.env.example`. Ajuste `STORAGE_DRIVER=S3` e preencha o bucket.

**Atenção:** em ambiente serverless o filesystem é efêmero. `STORAGE_DRIVER=PRIVATE` **não funciona** na Vercel — use S3 ou a evidência será perdida a cada invocação.

---

## 4. Migração do banco entre ambientes

```bash
# dump
pg_dump --no-owner --no-acl "$DATABASE_URL" -Fc -f lpa.dump

# restore
pg_restore --no-owner --no-acl --clean -d "$DATABASE_URL" lpa.dump
```

**Regra §73:** nunca restaure dump de produção em staging. Gere um dump **anonimizado** (`npm run db:seed` recria os dados estruturais; dados pessoais não são necessários para homologação).

---

## 5. Backup (§69, §70)

| Tipo | Frequência | Retenção |
|---|---|---|
| Dump completo do banco | diário 03:00 | 30 dias |
| Incremental (WAL archiving) | contínuo | 15 dias |
| Storage de evidências | diário | 5 anos (mesma prazo da denúncia) |
| Criptografia | AES-256 em repouso | — |

**RPO:** 24 h sem WAL archiving; ~15 min com.
**RTO:** 4 h (dump completo) / 1 h (PITR).

```bash
# exemplo de backup
docker compose exec -T db pg_dump -U lpa -Fc lpa > /backup/lpa-$(date +%F).dump
# teste de restauração OBRIGATÓRIO mensal (§69):
docker compose exec -T db pg_restore -U lpa -d lpa_restauracao --clean < /backup/lpa-YYYY-MM-DD.dump
```

Um backup nunca testado não é backup. A restauração precisa ser **verificada mensalmente** e o resultado registrado.

---

## 6. Checklist de hardening antes de ir ao ar (§43)

- [ ] `AUTH_SECRET`, `TOTP_ENCRYPTION_KEY` e `PASSWORD_PEPPER` únicos por ambiente (nunca reutilizados)
- [ ] TLS ativo + HSTS com `includeSubDomains`
- [ ] Banco **não** exposto na internet (compose usa `expose`, não `ports`)
- [ ] `/admin` e `/minha-conta` bloqueados no `robots.txt`
- [ ] Uploads fora de `/public` (`STORAGE_DRIVER=PRIVATE`)
- [ ] 2FA obrigatório para MODERATOR, SUPERVISOR, ADMIN, AUDITOR, SUPER_ADMIN
- [ ] `SEED_ENFORCE_RBAC=true` desativado em produção
- [ ] Alertas de `security_incidents` monitorados
- [ ] Backup diário testado

---

## 7. Variáveis obrigatórias em produção

```bash
NODE_ENV=production
DATABASE_URL=...
AUTH_SECRET=...                    # 32+ caracteres
TOTP_ENCRYPTION_KEY=...            # base64 de 32 bytes
PASSWORD_PEPPER=...                # 32+ caracteres
NEXT_PUBLIC_APP_URL=https://...
STORAGE_DRIVER=PRIVATE|S3
STORAGE_LOCAL_PATH=/data/evidencias
```

Sem `AUTH_SECRET` a aplicação **não sobe** (falha explícita, não silenciosa) — isso é intencional: uma sessão sem segredo assinado seria trivialmente forjável.

---

## 8. Observabilidade (§71, §72)

- **Uptime:** monitorar `/api/health` externamente (UptimeRobot, Better Stack).
- **Logs:** `system_logs` (categorias AUTH/ADMIN/SECURITY/AUDIT/MODERATION/REPORT/SYSTEM).
- **Alertas:** `security_incidents` com severidade ≥ 4 e `audit_logs` com `is_sensitive_access` em volume atípico.
- **Sinais de comprometimento:** pico em `login_attempts` falhas, `rate_limit_counters` saturado, `EVIDENCE_INTEGRITY_FAILURE`, hash divergente em `verifyIntegrity()`.