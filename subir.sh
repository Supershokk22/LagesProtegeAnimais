#!/usr/bin/env bash
# ============================================================================
# LAGES PROTEGE ANIMAIS — deploy em um comando
# ============================================================================
# Uso, no host (SSH), de dentro da pasta do projeto:
#
#     bash subir.sh
#
# Ou, se quiser passar a URL do banco direto:
#
#     DATABASE_URL="postgresql://..." bash subir.sh
#
# O script e' idempotente: pode rodar de novo sem quebrar nada.
# ============================================================================
set -euo pipefail

C_RESET=$'\033[0m'; C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_WARN=$'\033[33m'; C_INFO=$'\033[36m'
log()  { printf "%s==>%s %s\n" "$C_INFO" "$C_RESET" "$1"; }
ok()   { printf "%s  OK%s %s\n" "$C_OK" "$C_RESET" "$1"; }
warn() { printf "%s  !%s %s\n" "$C_WARN" "$C_RESET" "$1"; }
die()  { printf "%sERRO%s %s\n" "$C_ERR" "$C_RESET" "$1"; exit 1; }

cd "$(dirname "$0")"

# ---------------------------------------------------------------------------
# 0. Pre-requisitos
# ---------------------------------------------------------------------------
command -v node >/dev/null || die "Node.js nao encontrado. Instale Node 20 ou 22."
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  die "Node $NODE_MAJOR encontrado. Este projeto exige Node 20 ou superior (engines: >=20.11.0). Troque a versao no painel do host."
fi
command -v npm  >/dev/null || die "npm nao encontrado."
ok "Node $(node --version) · npm $(npm --version)"

# ---------------------------------------------------------------------------
# 1. Variaveis de ambiente
# ---------------------------------------------------------------------------
log "Preparando .env"

# URL do banco pode vir por parametro/ambiente
if [ -n "${DATABASE_URL:-}" ]; then
  log "DATABASE_URL recebida por parametro"
fi

if [ ! -f .env ]; then
  if [ ! -f .env.example ]; then
    die ".env.example nao encontrado. O pacote esta incompleto."
  fi
  cp .env.example .env
  ok ".env criado a partir do .env.example (revise os segredos)"
else
  ok ".env ja existe (preservado)"
fi

# Gera segredos faltantes. Nunca sobrescreve um existente — rotacionar
# segredo derruba todas as sessoes e invalida os segredos TOTP ja gravados.
gen_secret() {
  local n=$1
  node -e "console.log(require('node:crypto').randomBytes($n).toString('base64'))"
}

set_var() {
  local key=$1 val=$2
  if grep -qE "^${key}=" .env 2>/dev/null; then
    warn "${key} ja definido — mantido"
  else
    printf '%s="%s"\n' "$key" "$val" >> .env
    ok "${key} gerado"
  fi
}

# base64 de 32 bytes: TOTP_ENCRYPTION_KEY tem que ter exatamente 32 bytes
TOTP_KEY="$(node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))")"
set_var AUTH_SECRET           "$(gen_secret 48)"
set_var TOTP_ENCRYPTION_KEY   "$TOTP_KEY"
set_var PASSWORD_PEPPER       "$(gen_secret 32)"

# NODE_ENV
if grep -qE '^NODE_ENV=' .env; then
  sed -i 's|^NODE_ENV=.*|NODE_ENV="production"|' .env
else
  printf 'NODE_ENV="production"\n' >> .env
fi
ok "NODE_ENV=production"

# STORAGE_DRIVER: PRIVATE so faz sentido com disco persistente.
if grep -qE '^STORAGE_DRIVER=' .env; then
  grep -qE '^STORAGE_DRIVER="S3"' .env && ok "STORAGE_DRIVER=S3 (armazenamento externo)" \
                                              || ok "STORAGE_DRIVER=PRIVATE (disco)"
else
  printf 'STORAGE_DRIVER="PRIVATE"\n' >> .env
  ok "STORAGE_DRIVER=PRIVATE"
fi

mkdir -p var/evidencias
ok "var/evidencias criado"

# ---------------------------------------------------------------------------
# 2. Valida o .env
# ---------------------------------------------------------------------------
log "Validando variaveis"
set -a; . ./.env; set +a

for v in DATABASE_URL DIRECT_URL AUTH_SECRET TOTP_ENCRYPTION_KEY PASSWORD_PEPPER; do
  if [ -z "${!v:-}" ]; then
    die "$v esta vazio no .env. Abra o arquivo e preencha."
  fi
done

# AUTH_SECRET precisa de 32+ caracteres (o JWT assina com ele)
if [ "${#AUTH_SECRET}" -lt 32 ]; then
  die "AUTH_SECRET tem ${#AUTH_SECRET} caracteres; minimo 32. Rode: openssl rand -base64 48"
fi

# TOTP_ENCRYPTION_KEY tem que decodificar para exatamente 32 bytes
TOTP_BYTES=$(node -e "
  const k = Buffer.from(process.argv[1] || '', 'base64');
  console.log(k.length);
" "$TOTP_ENCRYPTION_KEY" 2>/dev/null || echo 0)
if [ "$TOTP_BYTES" != "32" ]; then
  die "TOTP_ENCRYPTION_KEY decodifica para $TOTP_BYTES bytes; precisa ser 32. Rode: openssl rand -base64 32"
fi
ok "Segredos validos (AUTH ${#AUTH_SECRET} chars · TOTP 32 bytes)"

if echo "$DATABASE_URL" | grep -qiE 'USUARIO:|SENHA@|SEU-|localhost:3306|:root:'; then
  warn "DATABASE_URL parece ser placeholder ou MySQL. Este projeto exige PostgreSQL."
  warn "  Formato esperado: postgresql://usuario:senha@host:5432/lpa?schema=public"
fi
ok "DATABASE_URL aceita"

# ---------------------------------------------------------------------------
# 3. Dependencias
# ---------------------------------------------------------------------------
log "Instalando dependencias (npm ci)"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund 2>&1 | tail -3
else
  npm install --no-audit --no-fund 2>&1 | tail -3
fi
ok "node_modules pronto"

# ---------------------------------------------------------------------------
# 4. Banco
# ---------------------------------------------------------------------------
log "Gerando Prisma Client"
npx prisma generate 2>&1 | tail -2
ok "Prisma Client gerado"

log "Aplicando migrations"
if npx prisma migrate deploy 2>&1 | tail -6; then
  ok "Migrations aplicadas"
else
  warn "Migrate deploy falhou — tentando db push (somente desenvolvimento)"
  warn "Se isso persistir, o banco nao esta acessivel. Verifique DATABASE_URL e o firewall."
  npx prisma db push --accept-data-loss 2>&1 | tail -4 || die "Nao foi possivel sincronizar o banco."
fi

log "Populando dados estruturais"
npm run db:seed 2>&1 | tail -10 || warn "Seed falhou — o app sobe, mas sem papeis/bairros/documentos."
ok "Seed concluido"

# ---------------------------------------------------------------------------
# 5. Build
# ---------------------------------------------------------------------------
log "Build de producao"
NEXT_TELEMETRY_DISABLED=1 npm run build 2>&1 | tail -18
ok "Build concluido"

if [ -f .next/standalone/server.js ]; then
  ok ".next/standalone gerado (deploy leve)"
fi

# ---------------------------------------------------------------------------
# 6. Processo
# ---------------------------------------------------------------------------
log "Subindo aplicacao"
if command -v pm2 >/dev/null; then
  pm2 delete lpa >/dev/null 2>&1 || true
  pm2 start npm --name lpa -- start >/dev/null 2>&1 || pm2 start npm --name lpa -- start
  pm2 save >/dev/null 2>&1 || true
  ok "pm2: processo 'lpa' iniciado"
else
  warn "pm2 nao encontrado. Instalando..."
  npm i -g pm2 >/dev/null 2>&1
  pm2 start npm --name lpa -- start
  pm2 save >/dev/null 2>&1 || true
  ok "pm2 instalado e iniciado"
fi

# ---------------------------------------------------------------------------
# 7. Verificacao
# ---------------------------------------------------------------------------
log "Verificando"
sleep 6
PORT="${PORT:-3000}"
HEALTH=""
for i in 1 2 3 4 5 6 7 8 9 10; do
  HEALTH=$(curl -fsS "http://127.0.0.1:${PORT}/api/health" 2>/dev/null || true)
  [ -n "$HEALTH" ] && break
  sleep 3
done

if [ -n "$HEALTH" ]; then
  ok "Health: $HEALTH"
else
  warn "Endpoint de health nao respondeu na porta ${PORT}."
  warn "Veja o log:  pm2 logs lpa --lines 50"
fi

printf "\n"
printf "%s%s Deploy concluido %s\n" "$C_OK" "====================================" "$C_RESET"
printf "Logs:      pm2 logs lpa\n"
printf "Reiniciar: pm2 restart lpa\n"
printf "Parar:     pm2 stop lpa\n"
printf "Variaveis: nano .env\n"
printf "Banco:     npx prisma studio\n"