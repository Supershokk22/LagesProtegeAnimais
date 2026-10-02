import { z } from "zod";

/**
 * ============================================================================
 * SCHEMAS DE VALIDACAO (§57)
 * ============================================================================
 * Zod no frontend E no backend. O schema do backend e a unica autoridade:
 * o frontend valida para dar feedback, nunca para autorizar.
 */

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

/* --------------------------------------------------------------- denuncia */

export const speciesEnum = z.enum([
  "CACAO", "GATO", "EQUINO", "BOVINO", "CAPRINO", "OVINO", "AVE", "ROEDOR", "PEIXE", "REPTIL", "OUTRO",
]);

export const categoryEnum = z.enum([
  "ABANDONO", "AGRESSAO", "NEGLIGENCIA", "FALTA_DE_AGUA", "FALTA_DE_ALIMENTO",
  "CONFINAMENTO_INADEQUADO", "ANIMAL_FERIDO", "ATROPELAMENTO", "SITUACAO_DE_RISCO",
  "CRIACAO_IRREGULAR", "ACUMULACAO", "ANIMAL_PRESO", "AUSENCIA_DE_ATENDIMENTO_VETERINARIO",
  "DESCARTE_IRREGULAR_DE_CARCACAS", "OUTROS",
]);

export const urgencyEnum = z.enum(["BAIXA", "MODERADA", "ALTA", "URGENTE", "CRITICA"]);

export const brazilianPhone = z
  .string()
  .trim()
  .regex(/^\+?55?\s?\(?\d{2}\)?[\s-]?9?\d{4}[-\s]?\d{4}$/, "Telefone invalido. Use (49) 9XXXX-XXXX");

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * §99 UX DE EMERGENCIA:
 * "Situacoes criticas terao menos etapas. Nao exigir cadastro demorado para
 * informacoes emergenciais quando houver possibilidade legal de registro
 * apropriado."
 *
 * -> Para urgencia CRITICA/URGENTE, o formulario reduz drasticamente e o
 *   contato passa a ser opcional. O sistema gera protocolo mesmo sem cadastro.
 */
export const reportCreateSchema = z.object({
  category: categoryEnum,
  description: trimmed(20, 8000),
  species: speciesEnum.nullish(),
  animalCount: z.coerce.number().int().min(1).max(1000).default(1),
  occurredAt: z.coerce.date().optional(),
  occurredTime: z.string().regex(/^\d{2}:\d{2}$/).nullish(),
  neighborhoodId: z.string().uuid().nullish(),
  location: latLngSchema.nullish(),
  locationPrecision: z.enum(["EXATA", "APROXIMADA", "AGREGADA"]).default("APROXIMADA"),
  locationReference: trimmed(0, 240).nullish().or(z.literal("").transform(() => null)),
  urgency: urgencyEnum.default("MODERADA"),
  isAnonymous: z.boolean().default(false),
  contactName: trimmed(2, 120).nullish(),
  contactEmail: z.string().email().max(200).nullish(),
  contactPhone: brazilianPhone.nullish(),
  witnessCount: z.coerce.number().int().min(0).max(500).default(0),
  observations: trimmed(0, 4000).nullish(),
  animalIds: z.array(z.string().uuid()).max(20).default([]),
  evidenceIds: z.array(z.string().uuid()).max(10).default([]),
  /** desafio anti-bot (§43). Vazio quando o captcha esta desativado em dev. */
  captchaToken: z.string().max(2000).nullish(),
  /** Recusa de termo obrigatoria fora de emergencia. */
  termsAccepted: z.boolean().default(false),
})
.superRefine((data, ctx) => {
  const isEmergency = data.urgency === "CRITICA" || data.urgency === "URGENTE";

  if (!isEmergency && !data.termsAccepted) {
    ctx.addIssue({
      code: "custom",
      path: ["termsAccepted"],
      message: "Aceite os Termos de Uso e a Politica de Privacidade para registrar a denuncia.",
    });
  }
  if (isEmergency) {
    // caminho minimo: ao menos UMMeio de contato OU anonimo assumido
    const hasContact = !!(data.contactEmail || data.contactPhone || data.contactName);
    if (!hasContact && !data.isAnonymous) {
      ctx.addIssue({
        code: "custom",
        path: ["contactEmail"],
        message: "Informe um meio de contato para emergencies, ou marque a denuncia como anonima.",
      });
    }
  } else if (!data.contactEmail && !data.isAnonymous) {
    ctx.addIssue({
      code: "custom",
      path: ["contactEmail"],
      message: "Informe um e-mail para acompanhamento, ou marque como anonima.",
    });
  }
  if (!isEmergency && !data.neighborhoodId && !data.location) {
    ctx.addIssue({
      code: "custom",
      path: ["neighborhoodId"],
      message: "Informe o bairro ou marque o ponto no mapa.",
    });
  }
  // PII em campo livre érejectado para reduzir vazamento (§2 minimizacao)
  const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/;
  const PHONE_RE = /\(?\d{2}\)?[\s-]?9\d{4}[\s-]?\d{4}\b/;
  if (CPF_RE.test(data.description)) {
    ctx.addIssue({
      code: "custom",
      path: ["description"],
      message: "Nao inclua CPF em campo livre. Se necessario, a equipe ira solicitar por canal seguro.",
    });
  }
  if (PHONE_RE.test(data.description)) {
    ctx.addIssue({
      code: "custom",
      path: ["description"],
      message: "Nao inclua telefone de terceiros no relato; isso expoe a pessoa citada.",
    });
  }
});

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

export const reportUpdateStatusSchema = z.object({
  toStatus: z.enum([
    "RECEBIDA", "AGUARDANDO_TRIAGEM", "EM_TRIAGEM", "SOLICITANDO_INFORMACOES", "VALIDADA",
    "ENCAMINHADA", "EM_ATENDIMENTO", "EM_FISCALIZACAO", "EM_INVESTIGACAO",
    "AGUARDANDO_ORGAO_RESPONSAVEL", "ATENDIDA", "PROCEDENTE", "IMPROCEDENTE", "ARQUIVADA",
    "REABERTA", "FINALIZADA",
  ]),
  justification: trimmed(0, 4000).nullish(),
  internalNote: trimmed(0, 4000).nullish(),
  forwardTo: trimmed(2, 200).nullish(),
  externalProtocol: z.string().max(60).nullish(),
  externalOrg: z.string().max(160).nullish(),
});

export const triageDecisionSchema = z.object({
  urgency: urgencyEnum,
  justification: trimmed(10, 2000),
  slaPolicyId: z.string().uuid().nullish(),
});

export const reportSourceSchema = z.object({
  sourceOrg: trimmed(2, 200),
  sourceUrl: z.string().url().max(800).nullish(),
  sourceDoc: z.string().max(200).nullish(),
  documentDate: z.coerce.date().optional(),
  status: z.enum(["NAO_VERIFICADO", "EM_ANALISE", "VERIFICADO", "DESATUALIZADO", "INVALIDO"]).default("EM_ANALISE"),
  note: z.string().max(4000).nullish(),
});

/* ------------------------------------------------------------------- lost */

export const lostAnimalCreateSchema = z.object({
  animalName: trimmed(1, 80),
  species: speciesEnum,
  breed: z.string().trim().max(120).nullish(),
  sex: z.enum(["MACHO", "FEMEA", "NAO_INFORMADO"]).default("NAO_INFORMADO"),
  color: z.string().trim().max(160).nullish(),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE", "GIGANTE"]).nullish(),
  distinguishing: z.string().trim().max(2000).nullish(),
  microchip: z.string().trim().max(40).nullish(),
  collar: z.boolean().default(false),
  vaccinationCard: z.boolean().default(false),
  lastSeenAt: z.coerce.date().optional(),
  lastSeenPlace: z.string().trim().max(240).nullish(),
  neighborhoodId: z.string().uuid().nullish(),
  location: latLngSchema.nullish(),
  rewardInfo: z.string().trim().max(120).nullish(),
  attachmentId: z.string().uuid().nullish(),
});

/* ----------------------------------------------------------------- found */

export const foundAnimalCreateSchema = z.object({
  species: speciesEnum,
  breed: z.string().trim().max(120).nullish(),
  sex: z.enum(["MACHO", "FEMEA", "NAO_INFORMADO"]).default("NAO_INFORMADO"),
  color: z.string().trim().max(160).nullish(),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE", "GIGANTE"]).nullish(),
  distinguishing: z.string().trim().max(2000).nullish(),
  foundAt: z.coerce.date().optional(),
  foundPlace: trimmed(3, 240),
  neighborhoodId: z.string().uuid().nullish(),
  location: latLngSchema.nullish(),
  healthState: z.string().trim().max(120).nullish(),
  isInjured: z.boolean().default(false),
  hasChip: z.boolean().default(false),
  chipNumber: z.string().trim().max(40).nullish(),
  attachmentId: z.string().uuid().nullish(),
});

/* -------------------------------------------------------------- adoption */

export const animalCreateSchema = z.object({
  name: z.string().trim().max(80).nullish(),
  species: speciesEnum,
  breed: z.string().trim().max(120).nullish(),
  sex: z.enum(["MACHO", "FEMEA", "NAO_INFORMADO"]).default("NAO_INFORMADO"),
  ageMonths: z.coerce.number().int().min(0).max(360).nullish(),
  size: z.enum(["PEQUENO", "MEDIO", "GRANDE", "GIGANTE"]).nullish(),
  color: z.string().trim().max(120).nullish(),
  temperament: z.string().trim().max(2000).nullish(),
  isNeutered: z.boolean().default(false),
  isVaccinated: z.boolean().default(false),
  vaccineDetail: z.string().trim().max(240).nullish(),
  specialNeeds: z.string().trim().max(2000).nullish(),
  condition: z.enum(["SAUDAVEL", "FERIDO", "DOENTE", "CRITICO", "DESNUTRIIDO", "EM_TRATAMENTO"]).default("SAUDAVEL"),
  organizationId: z.string().uuid().nullish(),
  neighborhoodId: z.string().uuid().nullish(),
  location: latLngSchema.nullish(),
  publicSummary: z.string().trim().max(4000).nullish(),
  intakeType: z.enum(["RESGATE", "NASCIDO", "DOACAO", "TRANSFERENCIA"]).nullish(),
});

/**
 * §22 — processo de adocao.
 * REGRA: "Nunca criar criterios discriminatorios injustificados."
 * -> Nenhum campo de renda, bairro, ou 'pretende ter filhos' e' exigido.
 */
export const adoptionRequestSchema = z.object({
  animalId: z.string().uuid(),
  experience: z.string().trim().max(2000).nullish(),
  residence: z.string().trim().max(120).nullish(),
  housingSpace: z.string().trim().max(120).nullish(),
  householdSize: z.coerce.number().int().min(1).max(30).nullish(),
  hasOtherAnimals: z.boolean().default(false),
  otherAnimalsDetail: z.string().trim().max(2000).nullish(),
  hasYard: z.boolean().nullish(),
  workSchedule: z.string().trim().max(160).nullish(),
  dailyPresence: z.string().trim().max(120).nullish(),
  vetAccess: z.boolean().nullish(),
  motivation: z.string().trim().max(3000).nullish(),
  guardianAgreement: z.literal(true, "E necessario concordar com o Termo de Guarda Responsavel."),
  vetReference: z.string().trim().max(200).nullish(),
});

/* ----------------------------------------------------------------- auth */

export const registerSchema = z
  .object({
    email: z.string().email().max(200),
    publicName: trimmed(2, 80),
    displayName: z.string().trim().max(120).nullish(),
    password: z.string().min(12).max(200),
    city: z.string().trim().max(120).nullish(),
    termsAccepted: z.literal(true, "Aceite os Termos de Uso."),
    privacyAccepted: z.literal(true, "Aceite a Politica de Privacidade."),
    ageConfirmed: z.literal(true, "Confirme a idade minima aplicavel."),
    captchaToken: z.string().max(2000).nullish(),
  })
  // §15: "Nao coletar CPF de usuarios comuns sem necessidade definida."
  .strict();

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
  totpCode: z.string().regex(/^\d{6}$/).nullish(),
  captchaToken: z.string().max(2000).nullish(),
});

/* ------------------------------------------------------------ comunidade */

export const postCreateSchema = z.object({
  body: trimmed(1, 5000),
  communityId: z.string().uuid().nullish(),
  visibility: z.enum(["PUBLICO", "COMUNIDADE"]).default("PUBLICO"),
  animalId: z.string().uuid().nullish(),
  reportId: z.string().uuid().nullish(),
  organizationId: z.string().uuid().nullish(),
  campaignId: z.string().uuid().nullish(),
  attachmentIds: z.array(z.string().uuid()).max(9).default([]),
});

/**
 * §2 / §20 — filtro de ASSEDIO, EXPOSICAO DE DADOS e ACUSACAO SEM COMPROVACAO.
 * Bloqueia padroes que historicamente viralizam linchamento em grupos de
 * protecao animal. Nao e censura de opiniao; e bloqueio de doxxing e
 * acusacao sem lastro.
 */
const ABUSE_PATTERNS: Array<{ re: RegExp; code: string; hint: string }> = [
  { re: /\b(vou (matar|malar|bater|caçar)|vai se foder|merda de (bicha|negro|poor))\b/i, code: "ameaca", hint: "Ameaca velada ou explicita." },
  { re: /\b(cpfs?\s*[:=]?\s*\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\brg\b\s*[:=]?\s*\d{8})\b/i, code: "dado_pessoal", hint: "CPF ou RG em post publico." },
  { re: /(\+?55[\s(]*\d{2})[\s-]?9\d{4}[\s-]?\d{4}/, code: "dado_pessoal", hint: "Telefone de terceiro em post publico." },
  { re: /\b(morre|abate|acaba com|resolve esse|sequestra)\b.{0,30}\b(ele|ela|eles|aquele)\b/i, code: "incitacao", hint: "Apelo a violencia contra pessoa." },
  { re: /\b(viado|caralho|porra|cagueiro|filha da puta)\b/i, code: "ofensa", hint: "Linguagem ofensiva contra pessoa." },
  { re: /\b(pilantra|ladrão|criminal|assassino|monstro)\b\s*(é|e|:)?/i, code: "acusacao", hint: "Rotulo acusatorio antes de decisao competente." },
];

export function screenPublicText(text: string): { blocked: string | null } {
  for (const p of ABUSE_PATTERNS) {
    if (p.re.test(text)) return { blocked: `${p.code}: ${p.hint}` };
  }
  return { blocked: null };
}

/* ------------------------------------------------------------ paginacao */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

export function offsetOf(p: Pagination): { skip: number; take: number } {
  return { skip: (p.page - 1) * p.pageSize, take: p.pageSize };
}
