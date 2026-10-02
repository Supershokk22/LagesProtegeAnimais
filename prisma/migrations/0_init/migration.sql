-- ============================================================================
-- LAGES PROTEGE ANIMAIS — MIGRATION INICIAL (gerada de prisma/schema.prisma)
-- Aplicar: npx prisma migrate deploy
-- ============================================================================

-- LAGES PROTEGE ANIMAIS — MIGRATION INICIAL
-- Gerado por: prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
--
-- Aplicar:  npx prisma migrate deploy
-- ============================================================================

-- Extensoes exigidas pelo schema (§50): citext para e-mail case-insensitive,
-- pgcrypto para geracao de UUID no nivel do banco.
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleKey" AS ENUM ('VISITOR', 'USER', 'VOLUNTEER', 'PROTECTOR', 'VERIFIED_PROTECTOR', 'NGO', 'VETERINARIAN', 'MODERATOR', 'INSTITUTIONAL_OPERATOR', 'SUPERVISOR', 'ADMIN', 'AUDITOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('ABANDONO', 'AGRESSAO', 'NEGLIGENCIA', 'FALTA_DE_AGUA', 'FALTA_DE_ALIMENTO', 'CONFINAMENTO_INADEQUADO', 'ANIMAL_FERIDO', 'ATROPELAMENTO', 'SITUACAO_DE_RISCO', 'CRIACAO_IRREGULAR', 'ACUMULACAO', 'ANIMAL_PRESO', 'AUSENCIA_DE_ATENDIMENTO_VETERINARIO', 'DESCARTE_IRREGULAR_DE_CARCACAS', 'OUTROS');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('BAIXA', 'MODERADA', 'ALTA', 'URGENTE', 'CRITICA');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('RECEBIDA', 'AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'SOLICITANDO_INFORMACOES', 'VALIDADA', 'ENCAMINHADA', 'EM_ATENDIMENTO', 'EM_FISCALIZACAO', 'EM_INVESTIGACAO', 'AGUARDANDO_ORGAO_RESPONSAVEL', 'ATENDIDA', 'PROCEDENTE', 'IMPROCEDENTE', 'ARQUIVADA', 'REABERTA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "PrecisionLevel" AS ENUM ('EXATA', 'APROXIMADA', 'AGREGADA');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('CACAO', 'GATO', 'EQUINO', 'BOVINO', 'CAPRINO', 'OVINO', 'AVE', 'ROEDOR', 'PEIXE', 'REPTIL', 'OUTRO');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MACHO', 'FEMEA', 'NAO_INFORMADO');

-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE', 'GIGANTE');

-- CreateEnum
CREATE TYPE "AnimalCondition" AS ENUM ('SAUDAVEL', 'FERIDO', 'DOENTE', 'CRITICO', 'DESNUTRIIDO', 'EM_TRATAMENTO');

-- CreateEnum
CREATE TYPE "AnimalAdoptionStatus" AS ENUM ('DISPONIVEL', 'RESERVADO', 'EM_AVALIACAO', 'EM_PROCESSO', 'ADOTADO', 'RETIRADO', 'INDISPONIVEL');

-- CreateEnum
CREATE TYPE "AdoptionRequestStatus" AS ENUM ('INTERESSE', 'AVALIACAO', 'CONTATO', 'ENTREVISTA', 'APROVADO', 'ADOCAO_CONCLUIDA', 'RECUSADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NAO_VERIFICADO', 'EM_ANALISE', 'VERIFICADO', 'SUSPENSO', 'INVALIDADO');

-- CreateEnum
CREATE TYPE "ProtectorStatus" AS ENUM ('NAO_VERIFICADO', 'EM_ANALISE', 'VERIFICADO', 'SUSPENSO');

-- CreateEnum
CREATE TYPE "SourceStatus" AS ENUM ('NAO_VERIFICADO', 'EM_ANALISE', 'VERIFICADO', 'DESATUALIZADO', 'INVALIDO');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'ATTACHMENT_CAPTION');

-- CreateEnum
CREATE TYPE "ModerationDecision" AS ENUM ('PENDENTE', 'APROVADO', 'REMOVIDO', 'EDITADO', 'USUARIO_SUSPENSO', 'ENCAMINHADO_AUTORIDADE');

-- CreateEnum
CREATE TYPE "LogCategory" AS ENUM ('AUTH', 'ADMIN', 'SECURITY', 'AUDIT', 'MODERATION', 'REPORT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceAccessLevel" AS ENUM ('RESTRITO', 'INTERNO', 'COMPARTILHADO', 'PUBLICO');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('SISTEMA', 'EMAIL', 'PUSH', 'SMS');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_TERCEIROS', 'RESOLVIDO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "GuardianRestrictionStatus" AS ENUM ('ATIVA', 'SUSPENSA', 'ENCERRADA');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('DETECTADO', 'EM_INVESTIGACAO', 'CONTIDO', 'RESOLVIDO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANEJADA', 'ATIVA', 'ENCERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANEJADO', 'INSCRICOES_ABERTAS', 'EM_ANDAMENTO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('ACESSO', 'CORRECAO', 'ANONIMIZACAO', 'ELIMINACAO', 'REVOGACAO_CONSENTIMENTO', 'PORTABILIDADE', 'REVOGACAO_TITULAR');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'AGUARDANDO_TITULAR', 'CONCLUIDA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('TERMOS_DE_USO', 'POLITICA_DE_PRIVACIDADE', 'POLITICA_DE_COOKIES', 'POLITICA_DE_RETENCAO', 'POLITICA_DE_INCIDENTES', 'GUIA_DE_ORIENTACOES', 'FAQ', 'PAGINA', 'NOTICIA', 'BANNER', 'SECAO_EDUCATIVA', 'REGRA_COMUNIDADE', 'TERMO_ACEITE');

-- CreateEnum
CREATE TYPE "VolunteerSkill" AS ENUM ('LAR_TEMPORARIO', 'TRANSPORTE', 'ALIMENTACAO', 'FOTOGRAFIA', 'REDES_SOCIAIS', 'EVENTOS', 'ARRECADACAO', 'ATENDIMENTO_ADMINISTRATIVO', 'APOIO_PROFISSIONAL', 'EDUCACAO', 'RESGATE_TECNICO');

-- CreateEnum
CREATE TYPE "CommunityKind" AS ENUM ('ADOCAO', 'ANIMAIS_PERDIDOS', 'ANIMAIS_ENCONTRADOS', 'PROTETORES', 'ONGS', 'LARES_TEMPORARIOS', 'VOLUNTARIADO', 'CAES', 'GATOS', 'GRANDES_PORTES', 'CASTRACAO', 'VACINACAO', 'EDUCACAO', 'GUARDA_RESPONSAVEL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SUGERIDO', 'EM_ANALISE', 'CONFIRMADO', 'REJEITADO');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('PDF', 'CSV', 'XLSX', 'JSON');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDENTE', 'VALIDANDO', 'VALIDADO', 'REJEITADO', 'APLICADO', 'PARCIAL');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('DENUNCIA', 'RESGATE', 'LAR_TEMPORARIO', 'ONG', 'CLINICA', 'HOSPITAL_VETERINARIO', 'POSTO_VETERINARIO_MOVEL', 'EVENTO', 'CAMPANHA', 'CASTRACAO', 'VACINACAO', 'APOIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "LostFoundStatus" AS ENUM ('ATIVO', 'EM_CONTATO', 'RESOLVIDO', 'ENCERRADO', 'SEM_SINAL');

-- CreateEnum
CREATE TYPE "OrgKind" AS ENUM ('ONG', 'PROTETOR_INDEPENDENTE', 'CASTOR', 'CLINICA', 'HOSPITAL_VETERINARIO', 'UNIVERSIDADE', 'EMPRESA_APOIADORA', 'ORGAO_PUBLICO', 'ESCOLA', 'OUTRO');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLICO', 'COMUNIDADE', 'APENAS_EQUIPE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "email_alt" CITEXT,
    "password_hash" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "public_name" VARCHAR(80) NOT NULL,
    "display_name" VARCHAR(120),
    "city" VARCHAR(120),
    "neighborhood_id" UUID,
    "phone" VARCHAR(20),
    "birth_date" DATE,
    "avatar_url" VARCHAR(500),
    "cover_url" VARCHAR(500),
    "bio" TEXT,
    "is_anonymous_public" BOOLEAN NOT NULL DEFAULT true,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret_enc" TEXT,
    "two_factor_pending_secret_enc" TEXT,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "last_login_at" TIMESTAMPTZ(6),
    "last_login_ip" INET,
    "password_changed_at" TIMESTAMPTZ(6),
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "suspicious_login_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "headline" VARCHAR(160),
    "bio" TEXT,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "helped_animals" INTEGER NOT NULL DEFAULT 0,
    "adopted_count" INTEGER NOT NULL DEFAULT 0,
    "campaigns_supported" INTEGER NOT NULL DEFAULT 0,
    "skills" "VolunteerSkill"[] DEFAULT ARRAY[]::"VolunteerSkill"[],
    "whatsapp_opt_in" BOOLEAN NOT NULL DEFAULT false,
    "lgpd_consent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "key" "RoleKey" NOT NULL,
    "description" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(40) NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted_by" UUID,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(128) NOT NULL,
    "user_agent" VARCHAR(400),
    "ip" INET,
    "device_label" VARCHAR(120),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(200),

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "neighborhoods" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "region" VARCHAR(80),
    "center_lat" DOUBLE PRECISION,
    "center_lng" DOUBLE PRECISION,
    "population" INTEGER,
    "ibge_code" VARCHAR(12),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "neighborhoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160),
    "type" "LocationType" NOT NULL,
    "address_line" VARCHAR(240),
    "reference" VARCHAR(240),
    "neighborhood_id" UUID,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "public_precision" "PrecisionLevel" NOT NULL DEFAULT 'AGREGADA',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "source_url" VARCHAR(600),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "protocol" VARCHAR(20) NOT NULL,
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'RECEBIDA',
    "urgency" "Urgency" NOT NULL DEFAULT 'MODERADA',
    "suggested_urgency" "Urgency",
    "urgency_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urgency_factors" JSONB,
    "urgency_decided_by" UUID,
    "urgency_decided_at" TIMESTAMPTZ(6),
    "urgency_justification" TEXT,
    "description" TEXT NOT NULL,
    "species" "Species",
    "animal_count" INTEGER NOT NULL DEFAULT 1,
    "occurred_at" TIMESTAMPTZ(6),
    "occurred_time" VARCHAR(5),
    "neighborhood_id" UUID,
    "location_id" UUID,
    "exact_lat" DOUBLE PRECISION,
    "exact_lng" DOUBLE PRECISION,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "public_precision" "PrecisionLevel" NOT NULL DEFAULT 'AGREGADA',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "author_id" UUID,
    "author_name" VARCHAR(160),
    "author_email" CITEXT,
    "author_phone" VARCHAR(20),
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "witness_count" INTEGER NOT NULL DEFAULT 0,
    "observations" TEXT,
    "forwarded_to" VARCHAR(200),
    "forwarded_at" TIMESTAMPTZ(6),
    "external_protocol" VARCHAR(60),
    "external_org" VARCHAR(160),
    "sla_policy_id" UUID,
    "due_at" TIMESTAMPTZ(6),
    "first_response_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "outcome" TEXT,
    "outcome_code" VARCHAR(40),
    "recurrence_key" VARCHAR(120),
    "duplicate_of_id" UUID,
    "duplicate_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "occurrences_count" INTEGER NOT NULL DEFAULT 1,
    "public_summary" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "published_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_status_history" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "from_status" "ReportStatus",
    "to_status" "ReportStatus" NOT NULL,
    "changed_by" UUID,
    "changed_by_name" VARCHAR(160),
    "justification" TEXT,
    "internal_only" BOOLEAN NOT NULL DEFAULT false,
    "ip" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_assignments" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "operator_id" UUID,
    "team" VARCHAR(120),
    "assigned_by" UUID,
    "role_in_case" VARCHAR(60),
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "report_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_notes" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "internal_only" BOOLEAN NOT NULL DEFAULT true,
    "mentions_data" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_sources" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "source_org" VARCHAR(200) NOT NULL,
    "source_url" VARCHAR(800),
    "source_doc" VARCHAR(200),
    "document_date" DATE,
    "consulted_at" TIMESTAMPTZ(6) NOT NULL,
    "verified_by" UUID,
    "status" "SourceStatus" NOT NULL DEFAULT 'EM_ANALISE',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_animals" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sla_policies" (
    "id" UUID NOT NULL,
    "urgency" "Urgency" NOT NULL,
    "description" TEXT NOT NULL,
    "first_response_minutes" INTEGER NOT NULL,
    "resolution_minutes" INTEGER NOT NULL,
    "business_days_only" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defined_by_org" VARCHAR(200),
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80),
    "species" "Species" NOT NULL,
    "breed" VARCHAR(120),
    "sex" "Sex" NOT NULL DEFAULT 'NAO_INFORMADO',
    "age_months" INTEGER,
    "age_estimate" VARCHAR(40),
    "size" "AnimalSize",
    "color" VARCHAR(120),
    "temperament" TEXT,
    "weight_kg" DOUBLE PRECISION,
    "is_neutered" BOOLEAN NOT NULL DEFAULT false,
    "is_vaccinated" BOOLEAN NOT NULL DEFAULT false,
    "vaccine_detail" VARCHAR(240),
    "dewormed" BOOLEAN NOT NULL DEFAULT false,
    "special_needs" TEXT,
    "health_notes" TEXT,
    "condition" "AnimalCondition" NOT NULL DEFAULT 'SAUDAVEL',
    "is_microchipped" BOOLEAN NOT NULL DEFAULT false,
    "status" "AnimalAdoptionStatus" NOT NULL DEFAULT 'DISPONIVEL',
    "intake_type" VARCHAR(60),
    "intake_date" DATE,
    "intake_notes" TEXT,
    "organization_id" UUID,
    "protector_id" UUID,
    "location_id" UUID,
    "neighborhood_id" UUID,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "public_precision" "PrecisionLevel" NOT NULL DEFAULT 'AGREGADA',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_images" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "attachment_id" UUID NOT NULL,
    "caption" VARCHAR(240),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "animal_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foster_links" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "keeper_user_id" UUID NOT NULL,
    "kind" VARCHAR(40) NOT NULL,
    "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foster_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoptions" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "adopter_id" UUID NOT NULL,
    "registered_by" UUID,
    "organization_id" UUID,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'INTERESSE',
    "adopted_at" TIMESTAMPTZ(6),
    "follow_up_due_at" TIMESTAMPTZ(6),
    "terms_accepted_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "adoptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_requests" (
    "id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "status" "AdoptionRequestStatus" NOT NULL DEFAULT 'INTERESSE',
    "experience" TEXT,
    "residence" VARCHAR(120),
    "housing_space" VARCHAR(120),
    "household_size" INTEGER,
    "has_other_animals" BOOLEAN NOT NULL DEFAULT false,
    "other_animals_detail" TEXT,
    "has_yard" BOOLEAN,
    "work_schedule" VARCHAR(160),
    "daily_presence" VARCHAR(120),
    "vet_access" BOOLEAN,
    "motivation" TEXT,
    "guardian_agreement" BOOLEAN NOT NULL DEFAULT false,
    "vet_reference" VARCHAR(200),
    "decision_reason" TEXT,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "adoption_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_followups" (
    "id" UUID NOT NULL,
    "adoption_id" UUID NOT NULL,
    "animal_id" UUID NOT NULL,
    "milestone_day" INTEGER NOT NULL,
    "due_at" TIMESTAMPTZ(6) NOT NULL,
    "done_at" TIMESTAMPTZ(6),
    "contact_method" VARCHAR(60),
    "outcome" TEXT,
    "problems_reported" TEXT,
    "support_provided" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoption_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lost_animals" (
    "id" UUID NOT NULL,
    "animal_name" VARCHAR(80) NOT NULL,
    "species" "Species" NOT NULL,
    "breed" VARCHAR(120),
    "sex" "Sex" NOT NULL DEFAULT 'NAO_INFORMADO',
    "color" VARCHAR(160),
    "size" "AnimalSize",
    "distinguishing" TEXT,
    "microchip" VARCHAR(40),
    "collar" BOOLEAN NOT NULL DEFAULT false,
    "vaccination_card" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMPTZ(6),
    "last_seen_place" VARCHAR(240),
    "neighborhood_id" UUID,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "public_precision" "PrecisionLevel" NOT NULL DEFAULT 'APROXIMADA',
    "reward_info" VARCHAR(120),
    "status" "LostFoundStatus" NOT NULL DEFAULT 'ATIVO',
    "owner_id" UUID NOT NULL,
    "contact_visible" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_animal_id" UUID,
    "attachment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "lost_animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "found_animals" (
    "id" UUID NOT NULL,
    "species" "Species" NOT NULL,
    "breed" VARCHAR(120),
    "sex" "Sex" NOT NULL DEFAULT 'NAO_INFORMADO',
    "color" VARCHAR(160),
    "size" "AnimalSize",
    "distinguishing" TEXT,
    "found_at" TIMESTAMPTZ(6),
    "found_place" VARCHAR(240) NOT NULL,
    "neighborhood_id" UUID,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "public_precision" "PrecisionLevel" NOT NULL DEFAULT 'APROXIMADA',
    "health_state" VARCHAR(120),
    "is_injured" BOOLEAN NOT NULL DEFAULT false,
    "has_chip" BOOLEAN NOT NULL DEFAULT false,
    "chip_number" VARCHAR(40),
    "held_at_location_id" UUID,
    "status" "LostFoundStatus" NOT NULL DEFAULT 'ATIVO',
    "finder_id" UUID,
    "contact_visible" BOOLEAN NOT NULL DEFAULT true,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_animal_id" UUID,
    "attachment_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "found_animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal_matches" (
    "id" UUID NOT NULL,
    "lost_animal_id" UUID NOT NULL,
    "found_animal_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "factors" JSONB NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'SUGERIDO',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "animal_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "kind" "OrgKind" NOT NULL,
    "legal_name" VARCHAR(200) NOT NULL,
    "public_name" VARCHAR(160) NOT NULL,
    "cnpj" VARCHAR(18),
    "responsible_name" VARCHAR(160),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "verification_doc_url" VARCHAR(600),
    "rejection_reason" TEXT,
    "description" TEXT,
    "service_areas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address_line" VARCHAR(240),
    "neighborhood_id" UUID,
    "location_id" UUID,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "email" CITEXT,
    "website" VARCHAR(300),
    "social_links" JSONB,
    "opening_hours" VARCHAR(240),
    "accepts_donations" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "org_role" VARCHAR(60) NOT NULL,
    "is_manager" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protectors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "ProtectorStatus" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "doc_type" VARCHAR(80),
    "doc_number" VARCHAR(60),
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "rescued_count" INTEGER NOT NULL DEFAULT 0,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "protectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veterinarians" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "name" VARCHAR(160) NOT NULL,
    "cro_crv" VARCHAR(40),
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clinic_id" UUID,
    "email" CITEXT,
    "phone" VARCHAR(20),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "verified_at" TIMESTAMPTZ(6),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "veterinarians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinics" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "cnpj" VARCHAR(18),
    "crv" VARCHAR(40),
    "specialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emergency_24h" BOOLEAN NOT NULL DEFAULT false,
    "accepts_rescue" BOOLEAN NOT NULL DEFAULT false,
    "location_id" UUID,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "email" CITEXT,
    "website" VARCHAR(300),
    "opening_hours" VARCHAR(240),
    "verification_status" "VerificationStatus" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "verified_at" TIMESTAMPTZ(6),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vet_appointments" (
    "id" UUID NOT NULL,
    "clinic_id" UUID NOT NULL,
    "animal_id" UUID,
    "report_id" UUID,
    "scheduled_at" TIMESTAMPTZ(6) NOT NULL,
    "service" VARCHAR(120) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'AGENDADO',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vet_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "kind" "CommunityKind" NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cover_url" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "require_approval" BOOLEAN NOT NULL DEFAULT false,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_members" (
    "id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    "approved_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "muted_until" TIMESTAMPTZ(6),

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "community_id" UUID,
    "body" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLICO',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "hidden_reason" TEXT,
    "animal_id" UUID,
    "report_id" UUID,
    "campaign_id" UUID,
    "organization_id" UUID,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "report_id" UUID,
    "author_id" UUID NOT NULL,
    "parent_id" UUID,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_hidden" BOOLEAN NOT NULL DEFAULT false,
    "hidden_reason" TEXT,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" UUID NOT NULL,
    "kind" VARCHAR(30) NOT NULL,
    "post_id" UUID,
    "comment_id" UUID,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "followee_id" UUID,
    "post_id" UUID,
    "community_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "context_type" VARCHAR(40),
    "context_id" UUID,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "reported" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_reports" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "target_type" "ContentType" NOT NULL,
    "target_id" UUID NOT NULL,
    "post_id" UUID,
    "comment_id" UUID,
    "reason" VARCHAR(80) NOT NULL,
    "details" TEXT,
    "status" "ModerationDecision" NOT NULL DEFAULT 'PENDENTE',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "assigned_to" UUID,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "decision_reason" TEXT,
    "appeal_of" UUID,
    "appealed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_actions" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "target_type" "ContentType" NOT NULL,
    "target_id" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "rule_ref" VARCHAR(80),
    "content_snapshot" TEXT,
    "before_hash" VARCHAR(64),
    "after_hash" VARCHAR(64),
    "auto" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "uploader_id" UUID,
    "storage_key" VARCHAR(300) NOT NULL,
    "original_name" VARCHAR(300),
    "mime_type" VARCHAR(120) NOT NULL,
    "kind" "AttachmentKind" NOT NULL,
    "extension" VARCHAR(12) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "sha512" VARCHAR(128),
    "magic_verified" BOOLEAN NOT NULL DEFAULT false,
    "malware_scan_status" VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    "width" INTEGER,
    "height" INTEGER,
    "duration_sec" INTEGER,
    "caption" VARCHAR(400),
    "storage_driver" VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    "public_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_evidence" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "attachment_id" UUID NOT NULL,
    "accessLevel" "EvidenceAccessLevel" NOT NULL DEFAULT 'RESTRITO',
    "description" TEXT,
    "chain_of_custody_note" TEXT,
    "hash_at_link" VARCHAR(64) NOT NULL,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "report_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "description" TEXT NOT NULL,
    "kind" VARCHAR(60) NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANEJADA',
    "organization_id" UUID,
    "responsible_name" VARCHAR(160),
    "starts_at" DATE,
    "ends_at" DATE,
    "goal_count" INTEGER,
    "achieved_count" INTEGER NOT NULL DEFAULT 0,
    "goal_amount_cents" BIGINT,
    "raised_amount_cents" BIGINT NOT NULL DEFAULT 0,
    "spent_amount_cents" BIGINT NOT NULL DEFAULT 0,
    "location_id" UUID,
    "results_summary" TEXT,
    "cover_url" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_updates" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "metrics" JSONB,
    "published_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "campaign_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "kind" VARCHAR(60) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANEJADO',
    "organizer_name" VARCHAR(160) NOT NULL,
    "organization_id" UUID,
    "community_id" UUID,
    "campaign_id" UUID,
    "location_id" UUID,
    "public_lat" DOUBLE PRECISION,
    "public_lng" DOUBLE PRECISION,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6),
    "capacity" INTEGER,
    "registered_count" INTEGER NOT NULL DEFAULT 0,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "cover_url" VARCHAR(500),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'CONFIRMADO',
    "attendees" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_opportunities" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "skill" "VolunteerSkill" NOT NULL,
    "risk_level" INTEGER NOT NULL DEFAULT 1,
    "requires_training" BOOLEAN NOT NULL DEFAULT false,
    "organization_id" UUID,
    "neighborhood_id" UUID,
    "slots" INTEGER NOT NULL DEFAULT 1,
    "filled_slots" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMPTZ(6),
    "is_remote" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "volunteer_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "skills" "VolunteerSkill"[] DEFAULT ARRAY[]::"VolunteerSkill"[],
    "training_done" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certified_until" DATE,
    "available_hours" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "transport" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "volunteer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteer_applications" (
    "id" UUID NOT NULL,
    "opportunity_id" UUID NOT NULL,
    "volunteer_id" UUID NOT NULL,
    "volunteer_profile_id" UUID,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
    "motivation" TEXT,
    "decided_by" UUID,
    "decided_at" TIMESTAMPTZ(6),
    "decision_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "volunteer_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "official_contacts" (
    "id" UUID NOT NULL,
    "organization_name" VARCHAR(200) NOT NULL,
    "department" VARCHAR(200),
    "service_type" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "email" CITEXT,
    "website" VARCHAR(400),
    "address" VARCHAR(300),
    "opening_hours" VARCHAR(240),
    "municipality" VARCHAR(80) NOT NULL DEFAULT 'Lages',
    "state" VARCHAR(2) NOT NULL DEFAULT 'SC',
    "source_url" VARCHAR(800),
    "source_doc_ref" VARCHAR(200),
    "verified_at" TIMESTAMPTZ(6),
    "verified_by" UUID,
    "status" "SourceStatus" NOT NULL DEFAULT 'NAO_VERIFICADO',
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "official_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_registry" (
    "id" UUID NOT NULL,
    "item_type" VARCHAR(60) NOT NULL,
    "item_id" UUID NOT NULL,
    "source_name" VARCHAR(200) NOT NULL,
    "source_url" VARCHAR(800) NOT NULL,
    "sourceTier" INTEGER NOT NULL DEFAULT 5,
    "doc_date" DATE,
    "consulted_at" TIMESTAMPTZ(6) NOT NULL,
    "verifier" UUID,
    "status" "SourceStatus" NOT NULL DEFAULT 'EM_ANALISE',
    "expires_at" DATE,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "source_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restricted_guardianship_records" (
    "id" UUID NOT NULL,
    "person_reference" VARCHAR(160) NOT NULL,
    "legal_basis" VARCHAR(300) NOT NULL,
    "authority" VARCHAR(200) NOT NULL,
    "case_number" VARCHAR(80),
    "document_number" VARCHAR(80),
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "status" "GuardianRestrictionStatus" NOT NULL DEFAULT 'ATIVA',
    "reason" TEXT NOT NULL,
    "neighborhood_id" UUID,
    "created_by" UUID NOT NULL,
    "updated_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "restricted_guardianship_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(160),
    "action" VARCHAR(80) NOT NULL,
    "resource" VARCHAR(80) NOT NULL,
    "resource_id" UUID,
    "reason" VARCHAR(400),
    "before" JSONB,
    "after" JSONB,
    "ip" INET,
    "user_agent" VARCHAR(400),
    "is_sensitive_access" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" UUID NOT NULL,
    "category" "LogCategory" NOT NULL,
    "level" VARCHAR(10) NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "request_id" VARCHAR(64),
    "user_id" UUID,
    "ip" INET,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "protocol" VARCHAR(24) NOT NULL,
    "subject" VARCHAR(200) NOT NULL,
    "category" VARCHAR(60) NOT NULL,
    "priority" "Urgency" NOT NULL DEFAULT 'MODERADA',
    "status" "TicketStatus" NOT NULL DEFAULT 'ABERTO',
    "report_id" UUID,
    "assignee_id" UUID,
    "reporter_id" UUID,
    "sla_policy_id" UUID,
    "due_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "resolution" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'SISTEMA',
    "event" VARCHAR(80) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "link_url" VARCHAR(500),
    "payload" JSONB,
    "read_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "failed_at" TIMESTAMPTZ(6),
    "error_msg" VARCHAR(400),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "doc_kind" "DocumentKind" NOT NULL,
    "doc_version" VARCHAR(20) NOT NULL,
    "given" BOOLEAN NOT NULL DEFAULT false,
    "ip" INET,
    "user_agent" VARCHAR(400),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "version" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" TEXT,
    "body" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "effective_at" TIMESTAMPTZ(6) NOT NULL,
    "superseded_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_requests" (
    "id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "type" "PrivacyRequestType" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'ABERTA',
    "subject" VARCHAR(160) NOT NULL,
    "details" TEXT,
    "identity_proof_attachment_id" UUID,
    "handler_id" UUID,
    "response" TEXT,
    "due_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_incidents" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "severity" INTEGER NOT NULL DEFAULT 3,
    "status" "IncidentStatus" NOT NULL DEFAULT 'DETECTADO',
    "detected_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contained_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),
    "root_cause" TEXT,
    "impact" TEXT,
    "actions" JSONB,
    "notified_anpd" BOOLEAN NOT NULL DEFAULT false,
    "notified_titulares" INTEGER NOT NULL DEFAULT 0,
    "owner_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_counters" (
    "id" UUID NOT NULL,
    "bucket" VARCHAR(120) NOT NULL,
    "window_start" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_time_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "ip" INET,

    CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "email" CITEXT,
    "ip" INET NOT NULL,
    "user_agent" VARCHAR(400),
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" VARCHAR(60),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "export_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "scope" VARCHAR(160) NOT NULL,
    "filters" JSONB,
    "row_count" INTEGER NOT NULL,
    "file_hash" VARCHAR(64),
    "anonymized" BOOLEAN NOT NULL DEFAULT false,
    "purpose" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "export_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "file_hash" VARCHAR(64) NOT NULL,
    "row_count" INTEGER NOT NULL,
    "valid_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDENTE',
    "errors" JSONB,
    "dry_run" BOOLEAN NOT NULL DEFAULT true,
    "applied_at" TIMESTAMPTZ(6),
    "requested_by" UUID NOT NULL,
    "approved_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" UUID NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "payload" JSONB NOT NULL,
    "indicators" JSONB,
    "generated_by" UUID,
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_pages" (
    "id" UUID NOT NULL,
    "kind" "DocumentKind" NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(240),
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "cover_url" VARCHAR(500),
    "author_name" VARCHAR(160),
    "source_url" VARCHAR(800),
    "source_name" VARCHAR(200),
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(6),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "seo_title" VARCHAR(200),
    "seo_description" VARCHAR(320),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "content_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AttachmentToReport" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AttachmentToReport_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttachmentToPost" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AttachmentToPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttachmentToComment" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AttachmentToComment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttachmentToOrganization" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AttachmentToOrganization_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttachmentToRestrictedGuardianshipRecord" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AttachmentToRestrictedGuardianshipRecord_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_neighborhood_id_idx" ON "users"("neighborhood_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_key_key" ON "roles"("key");

-- CreateIndex
CREATE INDEX "roles_level_idx" ON "roles"("level");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refresh_token_hash_key" ON "sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "neighborhoods_slug_key" ON "neighborhoods"("slug");

-- CreateIndex
CREATE INDEX "neighborhoods_region_idx" ON "neighborhoods"("region");

-- CreateIndex
CREATE INDEX "locations_neighborhood_id_idx" ON "locations"("neighborhood_id");

-- CreateIndex
CREATE INDEX "locations_lat_lng_idx" ON "locations"("lat", "lng");

-- CreateIndex
CREATE INDEX "locations_isPublic_idx" ON "locations"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "reports_protocol_key" ON "reports"("protocol");

-- CreateIndex
CREATE INDEX "reports_status_urgency_idx" ON "reports"("status", "urgency");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- CreateIndex
CREATE INDEX "reports_neighborhood_id_idx" ON "reports"("neighborhood_id");

-- CreateIndex
CREATE INDEX "reports_author_id_idx" ON "reports"("author_id");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at" DESC);

-- CreateIndex
CREATE INDEX "reports_due_at_idx" ON "reports"("due_at");

-- CreateIndex
CREATE INDEX "reports_recurrence_key_idx" ON "reports"("recurrence_key");

-- CreateIndex
CREATE INDEX "reports_is_public_published_at_idx" ON "reports"("is_public", "published_at");

-- CreateIndex
CREATE INDEX "reports_public_lat_public_lng_idx" ON "reports"("public_lat", "public_lng");

-- CreateIndex
CREATE UNIQUE INDEX "reports_year_sequence_key" ON "reports"("year", "sequence");

-- CreateIndex
CREATE INDEX "report_status_history_report_id_created_at_idx" ON "report_status_history"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "report_assignments_report_id_active_idx" ON "report_assignments"("report_id", "active");

-- CreateIndex
CREATE INDEX "report_assignments_operator_id_active_idx" ON "report_assignments"("operator_id", "active");

-- CreateIndex
CREATE INDEX "report_notes_report_id_created_at_idx" ON "report_notes"("report_id", "created_at");

-- CreateIndex
CREATE INDEX "report_sources_report_id_idx" ON "report_sources"("report_id");

-- CreateIndex
CREATE UNIQUE INDEX "report_animals_report_id_animal_id_role_key" ON "report_animals"("report_id", "animal_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "sla_policies_urgency_key" ON "sla_policies"("urgency");

-- CreateIndex
CREATE INDEX "animals_species_status_idx" ON "animals"("species", "status");

-- CreateIndex
CREATE INDEX "animals_organization_id_idx" ON "animals"("organization_id");

-- CreateIndex
CREATE INDEX "animals_protector_id_idx" ON "animals"("protector_id");

-- CreateIndex
CREATE INDEX "animals_status_created_at_idx" ON "animals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "animals_public_lat_public_lng_idx" ON "animals"("public_lat", "public_lng");

-- CreateIndex
CREATE INDEX "animals_neighborhood_id_idx" ON "animals"("neighborhood_id");

-- CreateIndex
CREATE UNIQUE INDEX "animal_images_animal_id_position_key" ON "animal_images"("animal_id", "position");

-- CreateIndex
CREATE INDEX "foster_links_keeper_user_id_active_idx" ON "foster_links"("keeper_user_id", "active");

-- CreateIndex
CREATE INDEX "foster_links_animal_id_idx" ON "foster_links"("animal_id");

-- CreateIndex
CREATE INDEX "adoptions_animal_id_idx" ON "adoptions"("animal_id");

-- CreateIndex
CREATE INDEX "adoptions_adopter_id_idx" ON "adoptions"("adopter_id");

-- CreateIndex
CREATE INDEX "adoptions_status_idx" ON "adoptions"("status");

-- CreateIndex
CREATE INDEX "adoptions_adopted_at_idx" ON "adoptions"("adopted_at");

-- CreateIndex
CREATE INDEX "adoption_requests_animal_id_status_idx" ON "adoption_requests"("animal_id", "status");

-- CreateIndex
CREATE INDEX "adoption_requests_requester_id_idx" ON "adoption_requests"("requester_id");

-- CreateIndex
CREATE INDEX "adoption_followups_due_at_done_at_idx" ON "adoption_followups"("due_at", "done_at");

-- CreateIndex
CREATE UNIQUE INDEX "adoption_followups_adoption_id_milestone_day_key" ON "adoption_followups"("adoption_id", "milestone_day");

-- CreateIndex
CREATE INDEX "lost_animals_status_created_at_idx" ON "lost_animals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "lost_animals_species_status_idx" ON "lost_animals"("species", "status");

-- CreateIndex
CREATE INDEX "lost_animals_neighborhood_id_idx" ON "lost_animals"("neighborhood_id");

-- CreateIndex
CREATE INDEX "found_animals_status_created_at_idx" ON "found_animals"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "found_animals_species_status_idx" ON "found_animals"("species", "status");

-- CreateIndex
CREATE INDEX "found_animals_neighborhood_id_idx" ON "found_animals"("neighborhood_id");

-- CreateIndex
CREATE INDEX "animal_matches_status_score_idx" ON "animal_matches"("status", "score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "animal_matches_lost_animal_id_found_animal_id_key" ON "animal_matches"("lost_animal_id", "found_animal_id");

-- CreateIndex
CREATE INDEX "organizations_kind_verification_status_idx" ON "organizations"("kind", "verification_status");

-- CreateIndex
CREATE INDEX "organizations_is_public_active_idx" ON "organizations"("is_public", "active");

-- CreateIndex
CREATE INDEX "organizations_neighborhood_id_idx" ON "organizations"("neighborhood_id");

-- CreateIndex
CREATE INDEX "organization_members_user_id_idx" ON "organization_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organization_id_user_id_org_role_key" ON "organization_members"("organization_id", "user_id", "org_role");

-- CreateIndex
CREATE UNIQUE INDEX "protectors_user_id_key" ON "protectors"("user_id");

-- CreateIndex
CREATE INDEX "protectors_status_idx" ON "protectors"("status");

-- CreateIndex
CREATE UNIQUE INDEX "veterinarians_user_id_key" ON "veterinarians"("user_id");

-- CreateIndex
CREATE INDEX "veterinarians_verification_status_idx" ON "veterinarians"("verification_status");

-- CreateIndex
CREATE INDEX "clinics_is_public_idx" ON "clinics"("is_public");

-- CreateIndex
CREATE INDEX "clinics_emergency_24h_idx" ON "clinics"("emergency_24h");

-- CreateIndex
CREATE INDEX "vet_appointments_clinic_id_scheduled_at_idx" ON "vet_appointments"("clinic_id", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- CreateIndex
CREATE INDEX "communities_kind_idx" ON "communities"("kind");

-- CreateIndex
CREATE INDEX "community_members_user_id_idx" ON "community_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_members_community_id_user_id_key" ON "community_members"("community_id", "user_id");

-- CreateIndex
CREATE INDEX "posts_community_id_published_at_idx" ON "posts"("community_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");

-- CreateIndex
CREATE INDEX "posts_visibility_is_hidden_published_at_idx" ON "posts"("visibility", "is_hidden", "published_at" DESC);

-- CreateIndex
CREATE INDEX "comments_post_id_created_at_idx" ON "comments"("post_id", "created_at");

-- CreateIndex
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");

-- CreateIndex
CREATE INDEX "reactions_user_id_idx" ON "reactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_kind_post_id_user_id_key" ON "reactions"("kind", "post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_kind_comment_id_user_id_key" ON "reactions"("kind", "comment_id", "user_id");

-- CreateIndex
CREATE INDEX "follows_followee_id_idx" ON "follows"("followee_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_followee_id_key" ON "follows"("follower_id", "followee_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_post_id_key" ON "follows"("follower_id", "post_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_community_id_key" ON "follows"("follower_id", "community_id");

-- CreateIndex
CREATE INDEX "direct_messages_receiver_id_read_at_idx" ON "direct_messages"("receiver_id", "read_at");

-- CreateIndex
CREATE INDEX "direct_messages_sender_id_receiver_id_idx" ON "direct_messages"("sender_id", "receiver_id");

-- CreateIndex
CREATE INDEX "content_reports_status_priority_idx" ON "content_reports"("status", "priority" DESC);

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_reports_reporter_id_idx" ON "content_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "moderation_actions_target_type_target_id_idx" ON "moderation_actions"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "moderation_actions_actor_id_created_at_idx" ON "moderation_actions"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storage_key_key" ON "attachments"("storage_key");

-- CreateIndex
CREATE INDEX "attachments_uploader_id_idx" ON "attachments"("uploader_id");

-- CreateIndex
CREATE INDEX "attachments_sha256_idx" ON "attachments"("sha256");

-- CreateIndex
CREATE INDEX "attachments_kind_idx" ON "attachments"("kind");

-- CreateIndex
CREATE INDEX "report_evidence_report_id_accessLevel_idx" ON "report_evidence"("report_id", "accessLevel");

-- CreateIndex
CREATE UNIQUE INDEX "report_evidence_report_id_attachment_id_key" ON "report_evidence"("report_id", "attachment_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "campaigns_status_starts_at_idx" ON "campaigns"("status", "starts_at");

-- CreateIndex
CREATE INDEX "campaigns_organization_id_idx" ON "campaigns"("organization_id");

-- CreateIndex
CREATE INDEX "campaign_updates_campaign_id_published_at_idx" ON "campaign_updates"("campaign_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "events_starts_at_idx" ON "events"("starts_at");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_organization_id_idx" ON "events"("organization_id");

-- CreateIndex
CREATE INDEX "event_registrations_user_id_idx" ON "event_registrations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registrations_event_id_user_id_key" ON "event_registrations"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "volunteer_opportunities_skill_idx" ON "volunteer_opportunities"("skill");

-- CreateIndex
CREATE INDEX "volunteer_opportunities_is_public_idx" ON "volunteer_opportunities"("is_public");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_profiles_user_id_key" ON "volunteer_profiles"("user_id");

-- CreateIndex
CREATE INDEX "volunteer_applications_volunteer_id_idx" ON "volunteer_applications"("volunteer_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteer_applications_opportunity_id_volunteer_id_key" ON "volunteer_applications"("opportunity_id", "volunteer_id");

-- CreateIndex
CREATE INDEX "official_contacts_status_is_emergency_idx" ON "official_contacts"("status", "is_emergency");

-- CreateIndex
CREATE INDEX "official_contacts_service_type_idx" ON "official_contacts"("service_type");

-- CreateIndex
CREATE INDEX "source_registry_item_type_item_id_idx" ON "source_registry"("item_type", "item_id");

-- CreateIndex
CREATE INDEX "source_registry_status_idx" ON "source_registry"("status");

-- CreateIndex
CREATE INDEX "source_registry_expires_at_idx" ON "source_registry"("expires_at");

-- CreateIndex
CREATE INDEX "restricted_guardianship_records_status_idx" ON "restricted_guardianship_records"("status");

-- CreateIndex
CREATE INDEX "restricted_guardianship_records_person_reference_idx" ON "restricted_guardianship_records"("person_reference");

-- CreateIndex
CREATE INDEX "restricted_guardianship_records_start_date_end_date_idx" ON "restricted_guardianship_records"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_is_sensitive_access_idx" ON "audit_logs"("is_sensitive_access");

-- CreateIndex
CREATE INDEX "system_logs_category_created_at_idx" ON "system_logs"("category", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_logs_level_created_at_idx" ON "system_logs"("level", "created_at" DESC);

-- CreateIndex
CREATE INDEX "system_logs_request_id_idx" ON "system_logs"("request_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_protocol_key" ON "tickets"("protocol");

-- CreateIndex
CREATE INDEX "tickets_status_priority_idx" ON "tickets"("status", "priority");

-- CreateIndex
CREATE INDEX "tickets_assignee_id_status_idx" ON "tickets"("assignee_id", "status");

-- CreateIndex
CREATE INDEX "tickets_due_at_idx" ON "tickets"("due_at");

-- CreateIndex
CREATE INDEX "ticket_messages_ticket_id_created_at_idx" ON "ticket_messages"("ticket_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at" DESC);

-- CreateIndex
CREATE INDEX "consent_records_user_id_idx" ON "consent_records"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "consent_records_user_id_doc_kind_doc_version_key" ON "consent_records"("user_id", "doc_kind", "doc_version");

-- CreateIndex
CREATE INDEX "legal_documents_kind_is_current_idx" ON "legal_documents"("kind", "is_current");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_kind_version_key" ON "legal_documents"("kind", "version");

-- CreateIndex
CREATE INDEX "privacy_requests_status_due_at_idx" ON "privacy_requests"("status", "due_at");

-- CreateIndex
CREATE INDEX "privacy_requests_requester_id_idx" ON "privacy_requests"("requester_id");

-- CreateIndex
CREATE INDEX "security_incidents_status_severity_idx" ON "security_incidents"("status", "severity");

-- CreateIndex
CREATE INDEX "security_incidents_detected_at_idx" ON "security_incidents"("detected_at" DESC);

-- CreateIndex
CREATE INDEX "rate_limit_counters_expires_at_idx" ON "rate_limit_counters"("expires_at");

-- CreateIndex
CREATE INDEX "rate_limit_counters_bucket_window_start_idx" ON "rate_limit_counters"("bucket", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "one_time_tokens_token_hash_key" ON "one_time_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "one_time_tokens_user_id_purpose_idx" ON "one_time_tokens"("user_id", "purpose");

-- CreateIndex
CREATE INDEX "one_time_tokens_expires_at_idx" ON "one_time_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "login_attempts_email_created_at_idx" ON "login_attempts"("email", "created_at" DESC);

-- CreateIndex
CREATE INDEX "login_attempts_ip_created_at_idx" ON "login_attempts"("ip", "created_at" DESC);

-- CreateIndex
CREATE INDEX "export_logs_actor_id_created_at_idx" ON "export_logs"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "export_logs_created_at_idx" ON "export_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "report_snapshots_generated_at_idx" ON "report_snapshots"("generated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "report_snapshots_period_key" ON "report_snapshots"("period");

-- CreateIndex
CREATE UNIQUE INDEX "content_pages_slug_key" ON "content_pages"("slug");

-- CreateIndex
CREATE INDEX "content_pages_kind_published_published_at_idx" ON "content_pages"("kind", "published", "published_at" DESC);

-- CreateIndex
CREATE INDEX "content_pages_pinned_idx" ON "content_pages"("pinned");

-- CreateIndex
CREATE INDEX "_AttachmentToReport_B_index" ON "_AttachmentToReport"("B");

-- CreateIndex
CREATE INDEX "_AttachmentToPost_B_index" ON "_AttachmentToPost"("B");

-- CreateIndex
CREATE INDEX "_AttachmentToComment_B_index" ON "_AttachmentToComment"("B");

-- CreateIndex
CREATE INDEX "_AttachmentToOrganization_B_index" ON "_AttachmentToOrganization"("B");

-- CreateIndex
CREATE INDEX "_AttachmentToRestrictedGuardianshipRecord_B_index" ON "_AttachmentToRestrictedGuardianshipRecord"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_duplicate_of_id_fkey" FOREIGN KEY ("duplicate_of_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_assignments" ADD CONSTRAINT "report_assignments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_assignments" ADD CONSTRAINT "report_assignments_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_notes" ADD CONSTRAINT "report_notes_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_notes" ADD CONSTRAINT "report_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sources" ADD CONSTRAINT "report_sources_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_sources" ADD CONSTRAINT "report_sources_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_animals" ADD CONSTRAINT "report_animals_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_animals" ADD CONSTRAINT "report_animals_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_protector_id_fkey" FOREIGN KEY ("protector_id") REFERENCES "protectors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_images" ADD CONSTRAINT "animal_images_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_images" ADD CONSTRAINT "animal_images_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foster_links" ADD CONSTRAINT "foster_links_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foster_links" ADD CONSTRAINT "foster_links_keeper_user_id_fkey" FOREIGN KEY ("keeper_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_adopter_id_fkey" FOREIGN KEY ("adopter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_registered_by_fkey" FOREIGN KEY ("registered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoptions" ADD CONSTRAINT "adoptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_followups" ADD CONSTRAINT "adoption_followups_adoption_id_fkey" FOREIGN KEY ("adoption_id") REFERENCES "adoptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_followups" ADD CONSTRAINT "adoption_followups_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_animals" ADD CONSTRAINT "lost_animals_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_animals" ADD CONSTRAINT "lost_animals_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lost_animals" ADD CONSTRAINT "lost_animals_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_animals" ADD CONSTRAINT "found_animals_finder_id_fkey" FOREIGN KEY ("finder_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_animals" ADD CONSTRAINT "found_animals_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_animals" ADD CONSTRAINT "found_animals_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "found_animals" ADD CONSTRAINT "found_animals_held_at_location_id_fkey" FOREIGN KEY ("held_at_location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_matches" ADD CONSTRAINT "animal_matches_lost_animal_id_fkey" FOREIGN KEY ("lost_animal_id") REFERENCES "lost_animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal_matches" ADD CONSTRAINT "animal_matches_found_animal_id_fkey" FOREIGN KEY ("found_animal_id") REFERENCES "found_animals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protectors" ADD CONSTRAINT "protectors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protectors" ADD CONSTRAINT "protectors_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarians" ADD CONSTRAINT "veterinarians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veterinarians" ADD CONSTRAINT "veterinarians_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vet_appointments" ADD CONSTRAINT "vet_appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_animal_id_fkey" FOREIGN KEY ("animal_id") REFERENCES "animals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_appeal_of_fkey" FOREIGN KEY ("appeal_of") REFERENCES "content_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_evidence" ADD CONSTRAINT "report_evidence_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_evidence" ADD CONSTRAINT "report_evidence_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "attachments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_updates" ADD CONSTRAINT "campaign_updates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "volunteer_opportunities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_opportunities" ADD CONSTRAINT "volunteer_opportunities_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_profiles" ADD CONSTRAINT "volunteer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "volunteer_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_volunteer_profile_id_fkey" FOREIGN KEY ("volunteer_profile_id") REFERENCES "volunteer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteer_applications" ADD CONSTRAINT "volunteer_applications_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "official_contacts" ADD CONSTRAINT "official_contacts_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_registry" ADD CONSTRAINT "source_registry_verifier_fkey" FOREIGN KEY ("verifier") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restricted_guardianship_records" ADD CONSTRAINT "restricted_guardianship_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restricted_guardianship_records" ADD CONSTRAINT "restricted_guardianship_records_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "privacy_requests" ADD CONSTRAINT "privacy_requests_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_incidents" ADD CONSTRAINT "security_incidents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "one_time_tokens" ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "export_logs" ADD CONSTRAINT "export_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToReport" ADD CONSTRAINT "_AttachmentToReport_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToReport" ADD CONSTRAINT "_AttachmentToReport_B_fkey" FOREIGN KEY ("B") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToPost" ADD CONSTRAINT "_AttachmentToPost_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToPost" ADD CONSTRAINT "_AttachmentToPost_B_fkey" FOREIGN KEY ("B") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToComment" ADD CONSTRAINT "_AttachmentToComment_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToComment" ADD CONSTRAINT "_AttachmentToComment_B_fkey" FOREIGN KEY ("B") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToOrganization" ADD CONSTRAINT "_AttachmentToOrganization_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToOrganization" ADD CONSTRAINT "_AttachmentToOrganization_B_fkey" FOREIGN KEY ("B") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToRestrictedGuardianshipRecord" ADD CONSTRAINT "_AttachmentToRestrictedGuardianshipRecord_A_fkey" FOREIGN KEY ("A") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttachmentToRestrictedGuardianshipRecord" ADD CONSTRAINT "_AttachmentToRestrictedGuardianshipRecord_B_fkey" FOREIGN KEY ("B") REFERENCES "restricted_guardianship_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
