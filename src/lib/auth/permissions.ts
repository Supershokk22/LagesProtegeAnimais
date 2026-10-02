import type { RoleKey } from "@/generated/prisma/client";

/**
 * MATRIZ DE PERMISSOES (§17)
 *
 * REGRA ABSOLUTA: nenhuma verificacao de acesso pode depender apenas do papel.
 * Toda checagem acontece sobre `PERMISSION_KEY`, resolvida a partir de todos os
 * papeis do usuario (RBAC por capacidade, nao por `if (admin)`).
 *
 * Papeis sao CONJUNTOS de permissoes. Um usuario com papel SUPERVISOR herda
 * as permissoes de OPERATOR, porque `roleGrants` declara a heranca explicitamente.
 */

export const PERMISSIONS = {
  // --- denuncia
  REPORT_CREATE: "report:create",
  REPORT_READ_OWN: "report:read_own",
  REPORT_READ_PUBLIC: "report:read_public",
  REPORT_READ_INTERNAL: "report:read_internal",
  REPORT_READ_EXACT_LOCATION: "report:read_exact_location",
  REPORT_UPDATE_STATUS: "report:update_status",
  REPORT_ASSIGN: "report:assign",
  TRIAGE_DECIDE: "triage:decide",
  REPORT_FORWARD: "report:forward",
  REPORT_PUBLISH: "report:publish",
  REPORT_CLOSE: "report:close",
  REPORT_MERGE_DUPLICATE: "report:merge_duplicate",
  REPORT_VIEW_PII: "report:view_pii",

  // --- evidencia
  EVIDENCE_UPLOAD: "evidence:upload",
  EVIDENCE_VIEW_RESTRICTED: "evidence:view_restricted",
  EVIDENCE_SHARE_EXTERNAL: "evidence:share_external",
  EVIDENCE_DELETE: "evidence:delete",
  EVIDENCE_INTEGRITY_CHECK: "evidence:integrity_check",

  // --- animais
  ANIMAL_CREATE: "animal:create",
  ANIMAL_UPDATE: "animal:update",
  ANIMAL_VIEW_INTERNAL: "animal:view_internal",

  // --- adocao
  ADOPTION_REQUEST: "adoption:request",
  ADOPTION_DECIDE: "adoption:decide",
  ADOPTION_REGISTER: "adoption:register",
  ADOPTION_FOLLOWUP: "adoption:followup",

  // --- perdido/encontrado
  LOST_CREATE: "lost:create",
  LOST_UPDATE: "lost:update",
  FOUND_CREATE: "found:create",
  FOUND_UPDATE: "found:update",
  MATCH_REVIEW: "match:review",

  // --- directorio institucional
  ORG_CREATE: "org:create",
  ORG_UPDATE: "org:update",
  ORG_VERIFY: "org:verify",
  CONTACT_VERIFY: "contact:verify",

  // --- comunidade
  POST_CREATE: "post:create",
  POST_MODERATE: "post:moderate",
  COMMUNITY_MANAGE: "community:manage",
  MODERATION_QUEUE: "moderation:queue",
  MODERATION_DECIDE: "moderation:decide",

  // --- dados / transparencia
  ANALYTICS_PUBLIC: "analytics:public",
  ANALYTICS_INTERNAL: "analytics:internal",
  ANALYTICS_INSTITUTIONAL: "analytics:institutional",
  EXPORT_RUN: "export:run",
  EXPORT_SENSITIVE: "export:sensitive",
  IMPORT_RUN: "import:run",
  IMPORT_APPROVE: "import:approve",

  // --- governanca
  USER_MANAGE: "user:manage",
  ROLE_MANAGE: "role:manage",
  CONTENT_MANAGE: "content:manage",
  SLA_MANAGE: "sla:manage",
  TICKET_MANAGE: "ticket:manage",
  INCIDENT_MANAGE: "incident:manage",

  // --- SENSIVEL: registro de impedimentos (§38-§39)
  RESTRICTED_RECORD_READ: "restricted:read",
  RESTRICTED_RECORD_WRITE: "restricted:write",

  // --- auditoria / LGPD
  AUDIT_READ: "audit:read",
  PRIVACY_REQUEST_HANDLE: "privacy:handle",
  SYSTEM_LOG_READ: "systemlog:read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: PermissionKey[] = Object.values(PERMISSIONS);

/** Papeis sensitiveis: exigem 2FA ativo para qualquer acao (src/lib/auth/guards.ts). */
export const ROLES_REQUIRING_2FA = ["MODERATOR", "SUPERVISOR", "ADMIN", "AUDITOR", "SUPER_ADMIN"] as const;

/**
 * Heranca de papeis. Um papel "concreto" nao repete as permissoes do papel
 * que o precede: evita divergencia entre a matriz documentada e o banco.
 */
const roleGrants: Record<RoleKey, { level: number; grants: RoleKey[]; permissions: PermissionKey[] }> = {
  VISITOR: {
    level: 0,
    grants: [],
    permissions: ["report:create", "report:read_public", "analytics:public"],
  },
  USER: {
    level: 10,
    grants: ["VISITOR"],
    permissions: [
      "report:read_own",
      "animal:create",
      "animal:update",
      "adoption:request",
      "lost:create",
      "lost:update",
      "found:create",
      "found:update",
      "post:create",
      "evidence:upload",
    ],
  },
  VOLUNTEER: {
    level: 15,
    grants: ["USER"],
    permissions: ["report:update_status", "animal:view_internal", "adoption:followup", "match:review"],
  },
  PROTECTOR: {
    level: 16,
    grants: ["VOLUNTEER"],
    permissions: ["adoption:register"],
  },
  VERIFIED_PROTECTOR: {
    level: 18,
    grants: ["PROTECTOR"],
    permissions: [],
  },
  NGO: {
    level: 20,
    grants: ["VERIFIED_PROTECTOR"],
    permissions: ["org:update", "adoption:decide", "analytics:internal"],
  },
  VETERINARIAN: {
    level: 22,
    grants: ["USER"],
    permissions: ["animal:view_internal", "analytics:internal"],
  },
  MODERATOR: {
    level: 30,
    grants: ["USER"],
    permissions: [
      "post:moderate",
      "moderation:queue",
      "moderation:decide",
      "community:manage",
      "report:read_internal",
      "systemlog:read",
    ],
  },
  INSTITUTIONAL_OPERATOR: {
    level: 40,
    grants: ["VOLUNTEER", "MODERATOR"],
    permissions: [
      "report:read_internal",
      "report:read_exact_location",
      "report:update_status",
      "report:assign",
      "triage:decide",
      "report:forward",
      "report:close",
      "report:merge_duplicate",
      "report:view_pii",
      "evidence:view_restricted",
      "evidence:share_external",
      "evidence:integrity_check",
      "ticket:manage",
      "analytics:internal",
      "analytics:institutional",
      "content:manage",
    ],
  },
  SUPERVISOR: {
    level: 50,
    grants: ["INSTITUTIONAL_OPERATOR"],
    permissions: [
      "report:publish",
      "evidence:delete",
      "org:verify",
      "contact:verify",
      "sla:manage",
      "export:run",
      "import:run",
      "restricted:read",
      "incident:manage",
    ],
  },
  ADMIN: {
    level: 70,
    grants: ["SUPERVISOR"],
    permissions: [
      "user:manage",
      "content:manage",
      "org:create",
      "org:update",
      "import:run",
      "import:approve",
      "incident:manage",
      "export:run",
      "analytics:institutional",
      "systemlog:read",
      "privacy:handle",
    ],
  },
  AUDITOR: {
    level: 60,
    grants: [],
    // Leitura ampla, escrita ZERO. Este papel existe para provar a separacao de poderes.
    permissions: [
      "report:read_internal",
      "audit:read",
      "analytics:internal",
      "analytics:institutional",
      "systemlog:read",
      "export:run",
      "evidence:integrity_check",
    ],
  },
  SUPER_ADMIN: {
    level: 100,
    grants: ["ADMIN", "AUDITOR"],
    permissions: ["role:manage", "restricted:write", "restricted:read", "user:manage"],
  },
};

export { roleGrants };

/**
 * Resolve o conjunto efetivo de permissoes de um conjunto de papeis,
 * aplicando heranca. Funcao PURA e testavel — nao toca banco.
 */
export function resolvePermissions(roleKeys: readonly RoleKey[]): Set<PermissionKey> {
  const out = new Set<PermissionKey>();
  const visit = (k: RoleKey, depth = 0) => {
    if (depth > 8) return; // guarda contra ciclo acidental de configuracao
    const def = roleGrants[k];
    if (!def) return;
    for (const p of def.permissions) out.add(p);
    for (const parent of def.grants) visit(parent, depth + 1);
  };
  for (const k of roleKeys) visit(k);
  return out;
}

export function roleLevel(roleKeys: readonly RoleKey[]): number {
  return Math.max(0, ...roleKeys.map((k) => roleGrants[k]?.level ?? 0));
}

/**
 * §76 — testes de permissao exigem estes invariantes:
 *  - visitante nao acessa area privada
 *  - usuario nao acessa admin
 *  - moderador nao acessa configuracoes criticas
 *  - auditor nao edita registros
 */
export const PERMISSION_INVARIANTS = {
  visitorCannotReadInternal: !resolvePermissions(["VISITOR"]).has("report:read_internal"),
  userCannotReadInternal: !resolvePermissions(["USER"]).has("report:read_internal"),
  userCannotManageUsers: !resolvePermissions(["USER"]).has("user:manage"),
  moderatorCannotManageUsers: !resolvePermissions(["MODERATOR"]).has("user:manage"),
  moderatorCannotManageRoles: !resolvePermissions(["MODERATOR"]).has("role:manage"),
  moderatorCannotWriteRestricted: !resolvePermissions(["MODERATOR"]).has("restricted:write"),
  auditorCannotWrite: !resolvePermissions(["AUDITOR"]).has("report:update_status"),
  auditorCannotSeePii: !resolvePermissions(["AUDITOR"]).has("report:view_pii"),
  auditorCannotExportSensitive: !resolvePermissions(["AUDITOR"]).has("export:sensitive"),
} as const;