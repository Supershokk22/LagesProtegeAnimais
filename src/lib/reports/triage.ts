/**
 * ============================================================================
 * TRIAGEM DE DENUNCIAS (§8)
 * ============================================================================
 *
 * REGRA DO DOCUMENTO MASTER:
 *   "A prioridade nao devera ser definida somente pelo usuario."
 *   "A decisao final devera ser humana."
 *
 * Portanto este modulo:
 *   1. Calcula uma SUGESTAO de urgencia a partir de fatores objetivos.
 *   2. NUNCA escreve a urgencia final sem um `triage:decide` humano que
 *      confirme, altere ou rejeite — com justificativa obrigatoria.
 *
 * Fator considered pelo documento:
 *   animal ferido | risco imediato | animal sem agua | animal preso |
 *   exposicao extrema | filhotes | grande quantidade | recorrencia |
 *   localização | relatos anteriores
 *
 * Fundamento legal de referencia (nao substitui parecer juridico):
 *   Lei 9.605/1998 art. 32 (crimes ambientais) + Lei 14.064/2020 (Sansão):
 *   para cão/gato, reclusão de 2 a 5 anos; com morte, +1/6 a +1/3.
 *   Isso eleva o MINIMO de atencao, mas nao torna o caso "critico" sozinho.
 */

import type { ReportCategory, Species, Urgency } from "@/generated/prisma/client";

export type TriageFactorKey =
  | "ANIMAL_FERIDO"
  | "RISCO_IMEDIATO"
  | "SEM_AGUA"
  | "SEM_ALIMENTO"
  | "ANIMAL_PRESO"
  | "EXPOSICAO_EXTREMA"
  | "FILHOTES"
  | "GRANDE_QUANTIDADE"
  | "RECORRENCIA"
  | "REGIAO_CRITICA"
  | "CARACTERE_ILICITO"
  | "DURACAO_PROLONGADA"
  | "CARCACA_DESCARTE";

export type TriageFactor = {
  key: TriageFactorKey;
  points: number;
  label: string;
  evidence: string; // texto lido por um humano para justificar a decisao
};

export type TriageInput = {
  category: ReportCategory;
  species?: Species | null;
  animalCount: number;
  description: string;
  urgencyClaimedByUser: Urgency;
  isNight?: boolean;
  hasPreviousReportsSameKey?: number;
  neighborhoodRiskScore?: number; // 0..1, calculado pela equipe
  animalIsPuppy?: boolean;
  animalIsConfined?: boolean;
  animalHasNoWater?: boolean;
  animalHasNoFood?: boolean;
  animalExposedToWeather?: boolean;
  injuryDescribed?: boolean;
  hoursWithoutCare?: number;
  hasCarcass?: boolean;
};

/** Peso por fator. Calibrado para que a soma mapeie nas 5 faixas. */
const WEIGHTS: Record<TriageFactorKey, number> = {
  RISCO_IMEDIATO: 30,
  ANIMAL_FERIDO: 28,
  ANIMAL_PRESO: 24,
  SEM_AGUA: 22,
  SEM_ALIMENTO: 20,
  CARCACA_DESCARTE: 20,
  EXPOSICAO_EXTREMA: 18,
  FILHOTES: 16,
  DURACAO_PROLONGADA: 14,
  GRANDE_QUANTIDADE: 12,
  CARACTERE_ILICITO: 12,
  RECORRENCIA: 10,
  REGIAO_CRITICA: 8,
};

/** Palavras que sugerem caraca/descarte clandestino — caso grave de saude publica. */
const CARCASS_RE = /\b(carcaca|carcacas|cadaver|cadaveres|osso|ossos|saco|sacos de lixo|restos|carca)\w*/i;
const INJURY_RE = /\b(ferid|sangrando|sangue|quebrad|fratur|atropelad|atropelamento|caiu|caiu de|degrau|facad|cortad|mordid|atacad|atacante)\w*/i;
const CONFINED_RE = /\b(preso|presa|cacado|amarrad|acorrentad|fechad[oa]|trancad|caixa| grades)\w*/i;
const NO_WATER_RE = /\b(sem agua|com sede|garrafa vazia|calor|desidrat\w+|morrendo de sede)\w*/i;
const NO_FOOD_RE = /\b(sem comida|jejum|passando fome|inani\w+|fome)\w*/i;
const EXPOSED_RE = /\b(chuva|granizo|geada|frio|calor extremo|sol forte|desabrigad[oa]|sem abrigo)\w*/i;
/** Sinais de crime — nunca viram rotulo publico, apenas prioridade interna. */
const ILLEGAL_RE = /\b(abandon\w+|maus tratos|agress\w+|tortura|necrop\w+|envenen\w+|criou[lc]o|briga)\w*/i;

function has(re: RegExp, text: string): boolean {
  return re.test(text);
}

/** Faixas de score -> urgencia sugerida. */
const BANDS: Array<{ min: number; urgency: Urgency }> = [
  { min: 70, urgency: "CRITICA" },
  { min: 52, urgency: "URGENTE" },
  { min: 34, urgency: "ALTA" },
  { min: 16, urgency: "MODERADA" },
  { min: 0, urgency: "BAIXA" },
];

const URGENCY_ORDER: Record<Urgency, number> = {
  BAIXA: 0,
  MODERADA: 1,
  ALTA: 2,
  URGENTE: 3,
  CRITICA: 4,
};

export function urgencyAtLeast(a: Urgency, b: Urgency): Urgency {
  return URGENCY_ORDER[a] >= URGENCY_ORDER[b] ? a : b;
}

export type TriageResult = {
  score: number; // 0..100+
  suggestedUrgency: Urgency;
  factors: TriageFactor[];
  /** Fatores que SUBIRIAM o caso se confirmados — a lista de perguntas da triagem. */
  questionsToHuman: string[];
  /** Nunca confiar cegamente: a urgencia do usuario entra com teto artificial. */
  userClaimWasDowngraded: boolean;
  notes: string[];
};

/**
 * Funcao PURA e deterministica: mesma entrada -> mesma saida.
 * Sem acesso a banco, sem relogio, sem aleatoriedade. Testavel.
 */
export function computeTriage(input: TriageInput): TriageResult {
  const text = normalize(input.description);
  const factors: TriageFactor[] = [];
  const questions: string[] = [];
  const notes: string[] = [];

  const push = (key: TriageFactorKey, label: string, evidence: string, override?: number) => {
    factors.push({ key, points: override ?? WEIGHTS[key], label, evidence });
  };

  // 1) Caracteres de risco no relato
  const hasInjury = input.injuryDescribed ?? has(INJURY_RE, text);
  if (hasInjury) {
    push("ANIMAL_FERIDO", "Animal ferido", "relato menciona ferimento, sangramento ou fratura");
    questions.push("Ha sangramento ativo, fratura exposta ou impossibilidade de locomocao?");
  }

  const hasCarcass = input.hasCarcass ?? has(CARCASS_RE, text);
  if (hasCarcass) {
    push(
      "CARCACA_DESCARTE",
      "Descarte irregular de carcaca",
      "relato descreve carcaca em via publica, terreno ou lixo",
    );
    questions.push(
      "Ha carcaca? Se sim, o caso exige acionamento da vigilancia ambiental e registro da Policia Cientifica ANTES da remocao.",
    );
    notes.push(
      "Descarte de carcaca em via publica responde a Lei 9.605/1998 (crimes ambientais) e exige preservacao do local para perícia.",
    );
  }

  const confined = input.animalIsConfined ?? has(CONFINED_RE, text);
  if (confined) {
    push("ANIMAL_PRESO", "Animal preso", "relato descreve animal preso, trancado ou acorrentado");
    questions.push("O animal esta em espaco fechado sem saida ou em situacao de aprisao imediata?");
  }

  const noWater = input.animalHasNoWater ?? has(NO_WATER_RE, text);
  if (noWater) {
    push("SEM_AGUA", "Sem agua", "relato descreve ausencia de agua disponivel");
    questions.push("Havia agua acessivel ao animal no momento do registro?");
  }

  const noFood = input.animalHasNoFood ?? has(NO_FOOD_RE, text);
  if (noFood) {
    push("SEM_ALIMENTO", "Sem alimento", "relato descreve ausencia de alimentacao");
  }

  const exposed = input.animalExposedToWeather ?? has(EXPOSED_RE, text);
  if (exposed) {
    push("EXPOSICAO_EXTREMA", "Exposicao a intemperie", "relato descreve exposicao a chuva, frio ou calor extremo");
    questions.push("A temperatura no local representa risco a vida nas proximas horas?");
  }

  // 2) Fatores estruturais
  if (input.species === "CACAO" || input.species === "GATO") {
    // Criterio da Lei Sansão: species domesticas tem pena maior — por isso a
    // triagem nao pode rebaixar o caso so por "parece pequeno".
    if (hasInjury) notes.push("Cao/gato com lesao:Lei 14.064/2020 eleva a pena maxima para 5 anos.");
  }

  const count = Math.max(1, input.animalCount ?? 1);
  if (input.animalIsPuppy || count > 0 && isPuppyContext(text)) {
    push("FILHOTES", "Filhotes", "relato indica filhotes ou criacao com filhotes presentes");
    questions.push("Ha filhotes? Filhotes hipotermicos sem a mae tem prognostico pior e exigem triagem imediata.");
  }

  if (count >= 5) {
    push(
      "GRANDE_QUANTIDADE",
      "Grande quantidade",
      `${count} animais informados`,
      Math.min(20, 12 + Math.floor(count / 5) * 2),
    );
  }

  if (has(ILLEGAL_RE, text)) {
    push("CARACTERE_ILICITO", "Possivelillegalidade", "relato descreve abandono, agressao ou maus-tratos");
    notes.push("Usar linguagem neutra ate decisao competente: 'pessoa mencionada na denuncia'.");
  }

  const hours = input.hoursWithoutCare ?? extractHours(text);
  if (hours !== null && hours >= 12) {
    push("DURACAO_PROLONGADA", "Sem cuidado ha muito tempo", `relato indica ${hours}h sem atendimento`);
  }

  const prev = input.hasPreviousReportsSameKey ?? 0;
  if (prev >= 1) {
    push(
      "RECORRENCIA",
      "Recorrencia no local",
      `${prev + 1} occorrencias na mesma chave bairro+categoria+periodo`,
      Math.min(14, 10 + prev * 2),
    );
    questions.push("Ha recorrencia no mesmo ponto? Se sim, avaliar proposta de acaostructural, nao apenas atendimento pontual.");
  }

  const risk = input.neighborhoodRiskScore ?? 0;
  if (risk >= 0.6) {
    push(
      "REGIAO_CRITICA",
      "Regiao com historico de ocorrencias",
      `score de risco do bairro = ${risk.toFixed(2)}`,
      Math.min(12, 6 + Math.round(risk * 6)),
    );
  }

  // 3) Risco imediato: risco intrinseco do par categoria+quantidade
  const baseByCategory: Partial<Record<ReportCategory, number>> = {
    ATROPELAMENTO: 18,
    ANIMAL_FERIDO: 16,
    SITUACAO_DE_RISCO: 14,
    ANIMAL_PRESO: 10,
    DESCARTE_IRREGULAR_DE_CARCACAS: 14,
  };
  const base = baseByCategory[input.category] ?? 0;
  if (base > 0) {
    push("RISCO_IMEDIATO", "Categoria de risco imediato", `categoria ${input.category} implica intervencao rapida`, base);
  }

  if (input.isNight) {
    push("RISCO_IMEDIATO", "Relato feito em horario noturno", "acesso ao local e resposta tends a ser mais lenta", 6);
  }

  // 4) Pontuacao
  const raw = factors.reduce((acc, f) => acc + f.points, 0);
  // Saturacao suave: evita que 10 fatores facam 200 pontos e percam ordenacao.
  const score = Math.round(100 * (1 - Math.exp(-raw / 75)));

  const band = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];
  let suggested = band.urgency;

  // 5) Teto sobre a urgencia declarada pelo cidadao.
  // O cidadao pode superestimar (nao e problema) ou subestimar (e problema).
  // Se o cidadao declarou ACIMA do que os fatos sustentam, anotamos — mas nao
  // rebaixamos:(Thread) barramento de urgencia publica causa perda de sinal.
  const userClaim = input.urgencyClaimedByUser ?? "MODERADA";
  let userClaimWasDowngraded = false;
  if (URGENCY_ORDER[userClaim] > URGENCY_ORDER[suggested]) {
    notes.push(
      `Cidadao declarou ${userClaim}; fatos supported apenas ${suggested}. Manter ${suggested} como piso e confirmar na triagem.`,
    );
  } else if (URGENCY_ORDER[userClaim] < URGENCY_ORDER[suggested] - 1) {
    notes.push(
      `Fatos indicam ${suggested}, acima do que foi declarado (${userClaim}). Triagem humana obrigatoria.`,
    );
    userClaimWasDowngraded = true;
  }

  // Casos com evidencia de crime ambiental entram como piso minimo ALTA.
  if (hasCarcass) suggested = urgencyAtLeast(suggested, "ALTA");

  return {
    score,
    suggestedUrgency: suggested,
    factors: factors.sort((a, b) => b.points - a.points),
    questionsToHuman: [...new Set(questions)],
    userClaimWasDowngraded,
    notes,
  };
}

function normalize(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isPuppyContext(text: string): boolean {
  return /\b(filhote|filhotes|cria|ninhada|filhada|recem.nascid[oa]s?|bebe)\w*/.test(text);
}

function extractHours(text: string): number | null {
  const m = /\b(\d{1,3})\s*(h|hora|horas)\b/.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}