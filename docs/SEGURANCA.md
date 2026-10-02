# SEGURANÇA

## 1. Controles implementados

### Autenticação
- [x] scrypt (N=16384, r=8, p=1) + pepper SHA-512 por ambiente
- [x] Política de senha: 12+ caracteres, maiúscula, minúscula, número, símbolo, bloqueio de senhas comuns
- [x] JWT HS256 com `algorithms: ["HS256"]` fixado (impede confusão de algoritmo)
- [x] Access token 15 min · refresh token 30 dias, **apenas hash SHA-256 persistido**
- [x] Rotação de refresh a cada uso + **detecção de reuso** (revoga todas as sessões)
- [x] 2FA TOTP RFC 6238, janela ±1 passo, segredo cifrado AES-256-GCM
- [x] Bloqueio progressivo: 4 falhas → 5 min · 8 → 30 min · 13+ → 2 h
- [x] Mensagem de erro única (não enumera contas)
- [x] Detecção de login suspeito (IP/UA inéditos)
- [x] Logout global revoga todas as sessões

### Autorização
- [x] 13 papéis · 47 permissões · herança declarada (testada)
- [x] Toda checagem por **permissão**, nunca por papel
- [x] 2FA obrigatório (AAL2) para escrita sensível
- [x] `AUDITOR`: leitura ampla, **escrita zero**
- [x] Registro de impedimentos: permissão **e** motivo escrito obrigatório
- [x] Invariantes de separação de poderes em teste automatizado

### Dados e evidência
- [x] Nome de arquivo gerado pelo servidor (chave = SHA-256)
- [x] Validação em 4 camadas: extensão → MIME → **magic bytes** → tamanho
- [x] Storage fora de `/public` por padrão
- [x] SHA-256 congelado no vínculo; divergência → incidente automático
- [x] Link externo assinado HMAC com expiração, sem sessão
- [x] Soft delete; remoção física conforme política de retenção

### Geoespacial
- [x] Dois níveis de coordenada (exata / pública)
- [x] Jitter determinístico + grade de agregação
- [x] Bounding box da Serra Catarinense (bug de sinal corrigido por teste)
- [x] Heatmap público com n≥5 (k-anonimato)
- [x] Propriedade `publicPrecision` explícita em toda resposta

### Auditoria e integridade
- [x] `audit_logs` imutável com before/after redigidos
- [x] `withAudit` garante que falha de auditoria derruba a transação
- [x] `system_logs` por categoria (AUTH/ADMIN/SECURITY/AUDIT/MODERATION/REPORT/SYSTEM)
- [x] Exportações registradas com hash do arquivo e justificativa LGPD
- [x] Acesso a evidência restrita marcado `isSensitiveAccess`

### Transporte e headers
- [x] TLS 1.3 (Caddy) · HSTS com `includeSubDomains`
- [x] CSP · `X-Content-Type-Options` · `X-Frame-Options: DENY`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `Permissions-Policy` (geolocation self; câmera/microfone off)
- [x] `robots.txt` bloqueia `/admin`, `/minha-conta`, `/api/`, `/entrar`

### Anti-abuso
- [x] Rate limit por sessão; janela **3× mais larga** para anônimos (IP compartilhado)
- [x] §67 cumprido: IP não é chave única de bloqueio curto
- [x] Filtro anti-assédio em posts (doxxing, ameaça, acusação sem lastro)
- [x] Rejeição de CPF/telefone de terceiro em campo livre
- [x] Validação estrita no cadastro (rejeita chaves desconhecidas → impede coletar CPF)

## 2. Riscos aceitos (decisão documentada)

| ID | Risco | Decisão |
|---|---|---|
| R1 | `deepmerge-ts` (CLI Prisma) e `postcss` (Next) com advisory | Ambos **build-time**, inalcançáveis em runtime. Aceito para não travar o build com `audit fix --force` que quebraria Prisma 6. Revisar trimestralmente. |
| R2 | scrypt em vez de Argon2id | Argon2id exige binding nativo. scrypt é nativo do Node e aceitável como baseline. Migração é 1 função. |
| R3 | Rate limit em tabela PostgreSQL | Volume municipal não justifica Redis. Se um bucket passar de ~50 req/s, trocar `checkRateLimit`. |
| R4 | Sem antivírus integrado no upload | `malwareScanStatus` fica `PENDENTE`. **Ação obrigatória:** integrar ClamAV antes de produção. |
| R5 | Sem CSP estrito em produção | O Next injeta scripts com hash; `unsafe-inline` foi mantido apenas em **Content-Security-Policy-Report-Only**. Colapsar após validar sem violações. |
| R6 | Sem WAF dedicado | Cloudflare Free resolve. Em VPS, Caddy + rate limit. |
| R7 | Feriados não tratados no SLA | `addSlaMinutes` trata fim de semana; feriados exige calendário oficial (`src/lib/calendar/feriados.ts`). **A implementar.** |

## 3. Checklist antes de produção

- [ ] `AUTH_SECRET`, `TOTP_ENCRYPTION_KEY`, `PASSWORD_PEPPER` únicos por ambiente
- [ ] `TOTP_ENCRYPTION_KEY` com **exatamente 32 bytes** base64
- [ ] `SEED_SUPERADMIN_EMAIL` / `PASSWORD` definidos; conta trocada
- [ ] `SEED_ENFORCE_RBAC=false` em produção
- [ ] `TURNSTILE_SECRET_KEY` configurado (captcha ativo)
- [ ] Banco **não** exposto na internet
- [ ] ClamAV (ou equivalente) integrado ao pipeline de upload
- [ ] 2FA confirmado em todos os perfis MODERATOR+
- [ ] Backup diário + **teste de restauração mensal** executado e registrado
- [ ] `security_incidents` com alerta ativo
- [ ] Contatos oficiais verificados na fonte
- [ ] Encarregado (DPO) nomeado e e-mail institucional publicado
- [ ] Tempos oficiais de SLA definidos e registrados em `sla_policies.defined_by_org`

## 4. Procedimento de incidente

1. **Conter** — revogar sessões (`revokeAllSessions`), suspender contas, isolar evidência.
2. **Preservar** — `audit_logs` e `system_logs` são somente-append. Não apagar.
3. **Verificar integridade** — `verifyIntegrity()` gera incidente se houver hash divergente.
4. **Classificar** — `security_incidents.severity` 1–5.
5. **Comunicar** — titulares afetados + ANPD quando a LGPD exigir.
6. **Corrigir** — `root_cause`, `actions`, `resolvedAt` registrados.

## 5. OWASP Top 10 — cobertura

| Risco | Controle |
|---|---|
| Broken Access Control | RBAC por permissão + AAL2 + teste de invariantes |
| Cryptographic Failures | scrypt, AES-256-GCM, SHA-256, TLS 1.3 |
| Injection | Prisma com queries parametrizadas; sem SQL concatenado |
| Insecure Design | Triagem ≠ decisão; coordenada em 2 níveis; publicação exige fonte |
| Security Misconfiguration | Env obrigatório falha explícito; segredos fora do Git; CSP/HSTS |
| Vulnerable Components | Dependências auditadas; R1 documentado |
| Identification Failures | 2FA, lockout, detecção de login suspeito |
| Data Integrity Failures | SHA-256 + verificação no acesso + HMAC de link |
| Logging Failures | `system_logs` + `audit_logs` com redator de PII |
| SSRF | Sem fetch de URL fornecida pelo usuário |

## 6. IDOR

Toda leitura de denúncia passa por `getReport(id, view, actor)`. O `view` é decidido pelo servidor
nunca pelo cliente. Sem permissão e sem ser o autor → 403 **e** auditoria de negação.
Evidência: `readAttachment()` revalida `accessLevel` a cada acesso, sem cache de autorização.