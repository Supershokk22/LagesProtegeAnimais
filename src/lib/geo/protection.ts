/**
 * ============================================================================
 * PROTECAO GEOSPATIAL (§12)
 * ============================================================================
 *
 * PROBLEMA REAL (Lages, ago/2026): denuncia de descarte clandestino de carcacas
 * na antiga BR-2, bairro Santa Clara. Se o mapa publico mostrasse o ponto exato
 * de um denuncia de maus-tratos, o denuncia vira alvo de retaliacao. Portanto:
 *
 *   - Endereco residencial NUNCA e publicado com precisao.
 *   - A coordenada exata fica em colunas separadas, legiveis apenas por quem tem
 *     `report:read_exact_location`.
 *   - O publico recebe uma versao deslocada (jitter deterministico) ou agregada.
 *   - As coordenadas publicas sao gravadas NO MOMENTO DA CRIACAO e nunca
 *     recalculadas a partir da original — trocar o algoritmo depois nao expoe
 *     retroativamente o historico.
 *
 * O deslocamento e DETERMINISTICO (seed = hash do protocolo): o mesmo caso
 * produz o mesmo ponto borrado, o que permite garantir coerencia entre mapa,
 * relatorio e exportacao, sem guardar o segredo de onde o ponto real esta.
 */

export type LatLng = { lat: number; lng: number };
export type Precision = "EXATA" | "APROXIMADA" | "AGREGADA";

/** Raio de deslocamento maximo por nivel, em metros. */
export const JITTER_RADIUS_M: Record<Exclude<Precision, "EXATA">, number> = {
  // ~ raio de uma quadra: suficiente para o mapa publico fazer sentido
  APROXIMADA: 220,
  // ~ raio de bairro: util para heatmap, inútil para localizar alguem
  AGREGADA: 900,
};

/** Celula de agregacao em graus (~1100 m de latitude). */
export const AGGREGATION_CELL_DEG = 0.01;

const EARTH_R = 6_371_000; // metros

function hashToUnitInt(seed: string, mod: number): number {
  // FNV-1a 32 bits: rapido, deterministico, sem dependencia nativa.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h % mod;
}

/**
 * Desloca um ponto aleatoriamente dentro de um circulo de raio `radiusM`.
 * Usa o angulo e a distancia derivados do seed — nao de Math.random — para que
 * o resultado seja estavel entre deploys.
 */
export function jitter(
  point: LatLng,
  radiusM: number,
  seed: string,
): LatLng {
  const angle = (hashToUnitInt(`${seed}:ang`, 3600) / 3600) * 2 * Math.PI;
  // sqrt para area uniforme dentro do disco (evita concentracao no centro)
  const dist = Math.sqrt(hashToUnitInt(`${seed}:dist`, 10000) / 10000) * radiusM;

  const dLat = (dist * Math.cos(angle)) / 110_574;
  const dLng =
    (dist * Math.sin(angle)) /
    (111_320 * Math.max(0.2, Math.cos((point.lat * Math.PI) / 180)));

  return {
    lat: round6(point.lat + dLat),
    lng: round6(point.lng + dLng),
  };
}

/** Agrega ao centroide da celula da grade. Nao revela nada dentro da celula. */
export function aggregate(point: LatLng, cellDeg = AGGREGATION_CELL_DEG): LatLng {
  const lat = Math.floor(point.lat / cellDeg) * cellDeg + cellDeg / 2;
  const lng = Math.floor(point.lng / cellDeg) * cellDeg + cellDeg / 2;
  return { lat: round6(lat), lng: round6(lng) };
}

/** Chave de recorrencia (§86): bairro + categoria + bucket temporal. */
export function recurrenceKey(input: {
  neighborhoodId?: string | null;
  category: string;
  point?: LatLng | null;
  occurredAt?: Date | null;
  bucketDays?: number;
}): string | null {
  if (!input.point) return null;
  const t = input.occurredAt ?? new Date();
  // bucket mensal em UTC: mesma chave para casos do mesmo mes e local
  const bucket = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  const cell = aggregate(input.point);
  const grid = `${cell.lat.toFixed(2)},${cell.lng.toFixed(2)}`;
  return `${input.neighborhoodId ?? "NA"}|${input.category}|${grid}|${bucket}`;
}

export function recurrenceKeyFor(input: {
  neighborhoodId?: string | null;
  category: string;
  point?: LatLng | null;
  occurredAt?: Date | null;
}): string | null {
  if (!input.point) return null;
  const t = input.occurredAt ?? new Date();
  const bucket = `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}`;
  const cell = aggregate(input.point);
  return `${input.neighborhoodId ?? "NA"}|${input.category}|${cell.lat.toFixed(2)},${cell.lng.toFixed(2)}|${bucket}`;
}

/**
 * Produz os dois pares de coordenadas que sao gravados na denuncia.
 * `seed` deve ser o protocolo: determinismo sem guardar segredo adicional.
 */
export function derivePublicCoordinates(
  exact: LatLng | null | undefined,
  protocol: string,
  precision: Precision,
): {
  exactLat: number | null;
  exactLng: number | null;
  publicLat: number | null;
  publicLng: number | null;
  publicPrecision: Precision;
} {
  if (!exact || !isValidLatLng(exact)) {
    return {
      exactLat: null,
      exactLng: null,
      publicLat: null,
      publicLng: null,
      publicPrecision: precision,
    };
  }
  if (precision === "EXATA") {
    return {
      exactLat: exact.lat,
      exactLng: exact.lng,
      publicLat: exact.lat,
      publicLng: exact.lng,
      publicPrecision: "EXATA",
    };
  }
  const blurred =
    precision === "AGREGADA" ? aggregate(exact) : jitter(exact, JITTER_RADIUS_M.APROXIMADA, protocol);
  return {
    exactLat: exact.lat,
    exactLng: exact.lng,
    publicLat: blurred.lat,
    publicLng: blurred.lng,
    publicPrecision: precision,
  };
}

export function isValidLatLng(p: unknown): p is LatLng {
  if (!p || typeof p !== "object") return false;
  const { lat, lng } = p as Record<string, unknown>;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  // Limites do municipio de Lages (SC) com folga; tambem barra o resto do planeta.
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  // Bounding box da Serra Catarinense com folga (~60 km). Barro o resto do`n
  // planeta E impede que um GPS adulterado injure dados do outro pais.`n
  if (lat < -28.9 || lat > -27.3) return false;
  if (lng < -50.9 || lng > -49.7) return false;
  return true;
}

/** Distancia em metros — formula de Haversine (estabilidade numerica). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

/** Bounding box simples para consulta de pontos num intervalo. */
export function bbox(p: LatLng, radiusM = 1500): [number, number, number, number] {
  const dLat = radiusM / 110_574;
  const dLng = radiusM / (111_320 * Math.max(0.2, Math.cos((p.lat * Math.PI) / 180)));
  return [p.lat - dLat, p.lng - dLng, p.lat + dLat, p.lng + dLng];
}

/** Centro aproximado de Lages/SC. Usado como fallback do mapa. */
export const LAGES_CENTER: LatLng = { lat: -27.816, lng: -50.326 };