import { haversineMeters, type LatLng } from "@/lib/geo/protection";
import type { Species } from "@/generated/prisma/client";

/**
 * ============================================================================
 * MATCHING PERDIDO x ENCONTRADO (§26)
 * ============================================================================
 *
 * REGRA DO DOCUMENTO: "Criar algoritmo para cruzar especie, cor, porte, bairro,
 * distancia, data, caracteristicas." e "Mostrar: 'Possivel correspondencia'.
 * Nunca afirmar automaticamente que e o mesmo animal."
 *
 * Portanto o modulo:
 *  - devolve um SCORE e os FATORES, nunca uma sentenca;
 *  - a interface sempre exibe "POSSIVEL CORRESPONDENCIA";
 *  - a confirmacao e humana (MatchStatus.CONFIRMADO exige revisao).
 *
 * Similaridade textual (caracteristicas) usa token-set + Jaccard normalizado
 * por tokenizacao pt-BR sem acento. Determinista e sem dependencia.
 */

export type MatchSide = {
  species: Species;
  breed?: string | null;
  color?: string | null;
  size?: string | null;
  sex?: string | null;
  distinguishing?: string | null;
  neighborhoodId?: string | null;
  point?: LatLng | null;
  date?: Date | null;
};

export type MatchFactors = {
  species: number;
  color: number;
  size: number;
  neighborhood: number;
  distance: number;
  date: number;
  distinguishing: number;
};

export type MatchScore = {
  score: number; // 0..100
  factors: MatchFactors;
  label: "FORTE" | "MODERADA" | "FRACA";
  /** Perguntas que o humano deve responder antes de confirmar. */
  checks: string[];
};

const W = {
  species: 30,
  color: 16,
  size: 10,
  neighborhood: 8,
  distance: 12,
  date: 10,
  distinguishing: 14,
} as const;

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas", "um", "uma",
  "com", "sem", "que", "para", "por", "ao", "aos", "as", "os", "the", "of",
]);

export function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function tokens(s: string): Set<string> {
  return new Set(
    normalizeText(s)
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
  );
}

/** Jaccard sobre tokens: 0..1 */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Similaridade de campos curtos (cor, porte): containimento + igualdade. */
export function shortFieldSimilarity(a?: string | null, b?: string | null): number {
  if (!a || !b) return 0; // ausencia nao e evidencia de divergencia
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return 1;
  // "preto e branco" vs "branco e preto"
  const ta = new Set(na.split(/[^a-z0-9]+/).filter(Boolean));
  const tb = new Set(nb.split(/[^a-z0-9]+/).filter(Boolean));
  const overlap = [...ta].filter((t) => tb.has(t)).length;
  if (overlap === 0) return 0;
  return Math.min(1, overlap / Math.max(ta.size, tb.size));
}

export function scoreMatch(lost: MatchSide, found: MatchSide): MatchScore {
  const factors: MatchFactors = {
    species: 0, color: 0, size: 0, neighborhood: 0, distance: 0, date: 0, distinguishing: 0,
  };

  if (lost.species && found.species) {
    factors.species = lost.species === found.species ? 1 : -1; // -1 = eliminatorio
  }

  factors.color = shortFieldSimilarity(lost.color, found.color);
  factors.size = shortFieldSimilarity(lost.size, found.size);

  if (lost.neighborhoodId && found.neighborhoodId) {
    factors.neighborhood = lost.neighborhoodId === found.neighborhoodId ? 1 : 0;
  } else {
    factors.neighborhood = 0.5; // desconhecido: neutro, nao punitivo
  }

  if (lost.point && found.point) {
    const d = haversineMeters(lost.point, found.point);
    // 0 m -> 1.0 ; 3 km -> 0 ; acima disso -> 0
    factors.distance = Math.max(0, 1 - d / 3000);
  } else {
    factors.distance = 0.5;
  }

  if (lost.date && found.date) {
    const days = Math.abs(lost.date.getTime() - found.date.getTime()) / 86_400_000;
    // Janela plausivel: animais se deslocam poucos km/dia; 30 dias -> 0
    factors.date = Math.max(0, 1 - days / 30);
  } else {
    factors.date = 0.5;
  }

  factors.distinguishing = jaccard(tokens(lost.distinguishing ?? ""), tokens(found.distinguishing ?? ""));

  const raw =
    factors.species * W.species +
    factors.color * W.color +
    factors.size * W.size +
    factors.neighborhood * W.neighborhood +
    factors.distance * W.distance +
    factors.date * W.date +
    factors.distinguishing * W.distinguishing;

  const max = W.species + W.color + W.size + W.neighborhood + W.distance + W.date + W.distinguishing;
  const score = Math.round(100 * Math.max(0, Math.min(1, raw / max)));

  const checks: string[] = [];
  if (factors.species === -1) checks.push("Especies diferentes: provavelmente nao e o mesmo animal.");
  if (factors.color < 0.5) checks.push("Cor declarada difere. Pedir foto atualizada.");
  if (factors.distinguishing < 0.3) checks.push("Caracteristicas marcantes com baixa similaridade textual.");
  if (factors.distance < 0.3) checks.push("Distancia grande entre local de sumico e local de encontro.");
  if (factors.date < 0.3) checks.push("Intervalo de tempo longo entre o sumico e o achado.");
  if (lost.color && !found.color) checks.push("Quem encontrou nao informou a cor: solicitar.");
  if (found.color && !lost.color) checks.push("Quem perdeu nao informou a cor: solicitar.");
  checks.push("Confirmar por foto comparativa e, se houver, numero de microchip.");

  return {
    score,
    factors,
    label: score >= 75 ? "FORTE" : score >= 50 ? "MODERADA" : "FRACA",
    checks,
  };
}

/**
 * Cutoff para gerar sugestao. Abaixo de 45 nao vale o custo de exibicao:
 * gera ruido e faz o usuario parar de confiar na ferramenta.
 */
export const MATCH_SUGGESTION_THRESHOLD = 45;

export function shouldSuggest(m: MatchScore): boolean {
  return m.factors.species !== -1 && m.score >= MATCH_SUGGESTION_THRESHOLD;
}