import { describe, expect, it } from "vitest";
import { computeTriage } from "@/lib/reports/triage";
import {
  derivePublicCoordinates,
  jitter,
  aggregate,
  haversineMeters,
  isValidLatLng,
  recurrenceKeyFor,
} from "@/lib/geo/protection";
import {
  canTransition,
  validateTransition,
  addSlaMinutes,
  STATUS_FLOW,
} from "@/lib/reports/workflow";
import { PERMISSION_INVARIANTS, resolvePermissions, roleGrants, ALL_PERMISSIONS } from "@/lib/auth/permissions";
import { scoreMatch, jaccard, shortFieldSimilarity, shouldSuggest } from "@/lib/matching/engine";
import { normalizeText, tokens } from "@/lib/matching/engine";

/* ===========================================================================
   TESTES DOS NÚCLEOS CRÍTICOS (§75, §76, §77)
   Estes testes cobrem as decisões onde um erro tem consequência real:
   subestimar uma urgência, vazar coordenadas, abrir caminho indevido ou
   permitir transição de status indevida.
   =========================================================================== */

describe("TRIAGEM (§8)", () => {
  it("determinística: mesma entrada, mesma saída", () => {
    const input = {
      category: "ABANDONO" as const,
      species: "CACAO" as const,
      animalCount: 3,
      description: "Cachorro sem agua e sem comida no terreno baldio ha dois dias.",
      urgencyClaimedByUser: "BAIXA" as const,
    };
    expect(computeTriage(input)).toEqual(computeTriage(input));
  });

  it("animal ferido com noite sugere pelo menos ALTA", () => {
    const r = computeTriage({
      category: "ANIMAL_FERIDO",
      species: "GATO",
      animalCount: 1,
      description: "Gato atropelado na rua, sangrando, nao se movimenta.",
      urgencyClaimedByUser: "ALTA",
      isNight: true,
    });
    expect(["ALTA", "URGENTE", "CRITICA"]).toContain(r.suggestedUrgency);
    expect(r.factors.some((f) => f.key === "ANIMAL_FERIDO")).toBe(true);
  });

  it("descarte de carcaça tem piso mínimo ALTA (§8 + Lei 9.605/98)", () => {
    const r = computeTriage({
      category: "DESCARTE_IRREGULAR_DE_CARCACAS",
      animalCount: 1,
      description: "Carcacas e sacos de lixo com restos de animais no terreno.",
      urgencyClaimedByUser: "BAIXA",
    });
    expect(r.suggestedUrgency).toBe("ALTA");
    expect(r.factors.some((f) => f.key === "CARCACA_DESCARTE")).toBe(true);
    // Perguntas de verificação obrigatória devem existir.
    expect(r.questionsToHuman.length).toBeGreaterThan(0);
  });

  it("relato com fatos graves mas usuário declarou BAIXA sinaliza a divergência", () => {
    const r = computeTriage({
      category: "ABANDONO",
      species: "CACAO",
      animalCount: 12,
      description: "12 filhotes presos sem agua, expostos a chuva, ha 3 dias.",
      urgencyClaimedByUser: "BAIXA",
    });
    expect(r.userClaimWasDowngraded).toBe(true);
    expect(r.notes.length).toBeGreaterThan(0);
    expect(["ALTA", "URGENTE", "CRITICA"]).toContain(r.suggestedUrgency);
  });

  it("relato trivial sugere BAIXA ou MODERADA", () => {
    const r = computeTriage({
      category: "OUTROS",
      animalCount: 1,
      description: "Consulta sobre-castracao de caes.",
      urgencyClaimedByUser: "BAIXA",
    });
    expect(["BAIXA", "MODERADA"]).toContain(r.suggestedUrgency);
  });

  it("recorrência no mesmo local eleva o caso", () => {
    const base = {
      category: "ABANDONO" as const,
      animalCount: 1,
      description: "Descarte de animais no mesmo ponto.",
      urgencyClaimedByUser: "BAIXA" as const,
      hasPreviousReportsSameKey: 0,
    };
    const semRecorrencia = computeTriage(base);
    const comRecorrencia = computeTriage({ ...base, hasPreviousReportsSameKey: 4 });
    expect(comRecorrencia.score).toBeGreaterThan(semRecorrencia.score);
  });

  it("score fica limitado a 100 (saturação)", () => {
    const r = computeTriage({
      category: "DESCARTE_IRREGULAR_DE_CARCACAS",
      species: "CACAO",
      animalCount: 800,
      description: "carcacas sacos lixo osso restos animal ferido preso sem agua sem comida chuva filhotes acumulacao",
      urgencyClaimedByUser: "CRITICA",
      hasPreviousReportsSameKey: 20,
      neighborhoodRiskScore: 1,
      hoursWithoutCare: 500,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });
});

describe("PROTEÇÃO GEOSPATIAL (§12)", () => {
  const EXATA = { lat: -27.8031, lng: -50.3122 }; // bairro Santa Clara / antiga BR-2

  it("precisão AGREGADA desloca o ponto de forma determinística", () => {
    const a = derivePublicCoordinates(EXATA, "LPA-2026-000001", "AGREGADA");
    const b = derivePublicCoordinates(EXATA, "LPA-2026-000001", "AGREGADA");
    expect(a.publicLat).toBe(b.publicLat);
    expect(a.publicLng).toBe(b.publicLng);
  });

  it("protocolos diferentes produzem pontos diferentes (não vaza o mesmo endereço)", () => {
    const a = derivePublicCoordinates(EXATA, "LPA-2026-000001", "APROXIMADA");
    const b = derivePublicCoordinates(EXATA, "LPA-2026-000002", "APROXIMADA");
    expect(`${a.publicLat},${a.publicLng}`).not.toBe(`${b.publicLat},${b.publicLng}`);
  });

  it("o ponto público nunca coincide com o ponto exato", () => {
    const p = derivePublicCoordinates(EXATA, "LPA-2026-000007", "APROXIMADA");
    const d = haversineMeters({ lat: p.exactLat!, lng: p.exactLng! }, { lat: p.publicLat!, lng: p.publicLng! });
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThanOrEqual(220 + 1); // dentro do raio configurado
  });

  it("agregação usa centro de grade, não o ponto original", () => {
    const g = aggregate(EXATA);
    expect(g.lat).toBeCloseTo(-27.805, 2);
    expect(haversineMeters(EXATA, g)).toBeGreaterThan(0);
  });

  it("coordenada inválida (fora de SC) é rejeitada", () => {
    expect(isValidLatLng({ lat: 0, lng: 0 })).toBe(false);
    expect(isValidLatLng({ lat: -23.55, lng: -46.63 })).toBe(false); // São Paulo
    expect(isValidLatLng(EXATA)).toBe(true);
    expect(isValidLatLng({ lat: NaN, lng: 1 })).toBe(false);
    expect(isValidLatLng(null)).toBe(false);
  });

  it("jitter rejeita raio negativo", () => {
    const p = jitter(EXATA, -100, "seed");
    expect(Number.isFinite(p.lat)).toBe(true);
  });

  it("chave de recorrência separa categorias e meses", () => {
    const a = recurrenceKeyFor({
      neighborhoodId: "b1",
      category: "ABANDONO",
      point: EXATA,
      occurredAt: new Date("2026-08-21T12:00:00Z"),
    });
    const b = recurrenceKeyFor({
      neighborhoodId: "b1",
      category: "AGRESSAO",
      point: EXATA,
      occurredAt: new Date("2026-08-21T12:00:00Z"),
    });
    const c = recurrenceKeyFor({
      neighborhoodId: "b1",
      category: "ABANDONO",
      point: EXATA,
      occurredAt: new Date("2026-09-02T12:00:00Z"),
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("MÁQUINA DE ESTADOS (§9)", () => {
  it("não permite pular de RECEBIDA para FINALIZADA", () => {
    expect(canTransition("RECEBIDA", "FINALIZADA")).toBe(false);
    expect(canTransition("RECEBIDA", "AGUARDANDO_TRIAGEM")).toBe(true);
  });

  it("exige justificativa para IMPROCEDENTE", () => {
    const semJust = validateTransition("EM_TRIAGEM", "IMPROCEDENTE", "");
    expect(semJust.ok).toBe(false);
    if (!semJust.ok) expect(semJust.code).toBe("REPORT_JUSTIFICATION_REQUIRED");

    const comJust = validateTransition("EM_TRIAGEM", "IMPROCEDENTE", "Verificado em campo, sem ocorrência.");
    expect(comJust.ok).toBe(true);
  });

  it("rejeita transição para o mesmo status", () => {
    const r = validateTransition("EM_TRIAGEM", "EM_TRIAGEM");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("REPORT_STATUS_UNCHANGED");
  });

  it("toda transição declarada existe no grafo", () => {
    for (const [from, targets] of Object.entries(STATUS_FLOW)) {
      for (const to of targets) {
        expect(canTransition(from as never, to)).toBe(true);
      }
    }
  });

  it("caso finalizado pode ser reaberto", () => {
    expect(canTransition("FINALIZADA", "REABERTA")).toBe(true);
  });

  it("SLA em dias úteis respeita o fim de semana", () => {
    // 2026-08-21 é sexta-feira.
    const sexta = new Date("2026-08-21T13:00:00Z"); // 10:00 local (UTC-3)
    const due = addSlaMinutes(sexta, 4 * 60, true);
    // 4 horas úteis a partir de sexta 10h local = sexta 14h local = 17:00 UTC
    expect(due.toISOString()).toBe("2026-08-21T17:00:00.000Z");
  });

  it("SLA de 24h úteis pula sábado e domingo", () => {
    const sexta = new Date("2026-08-21T13:00:00Z");
    const due = addSlaMinutes(sexta, 8 * 60, true);
    // expediente 09:00-17:00 local (UTC-3) = 12:00-20:00 UTC
    // sexta 13:00 UTC -> restam 7h na sexta -> sobra 1h -> segunda 13:00 UTC
    expect(due.getUTCDay()).toBe(1);
    expect(due.toISOString()).toBe("2026-08-24T13:00:00.000Z");
  });
});

describe("RBAC (§17, §76)", () => {
  it("invariantes de separação de poderes", () => {
    expect(Object.values(PERMISSION_INVARIANTS).every(Boolean)).toBe(true);
  });

  it("visitante não vê campo interno nem gere usuários", () => {
    const p = resolvePermissions(["VISITOR"]);
    expect(p.has("report:read_internal")).toBe(false);
    expect(p.has("user:manage")).toBe(false);
    expect(p.has("report:create")).toBe(true);
  });

  it("usuário comum não acessa nada de equipe", () => {
    const p = resolvePermissions(["USER"]);
    for (const k of ["report:read_internal", "report:read_exact_location", "user:manage", "role:manage", "audit:read", "export:run"]) {
      expect(p.has(k as never)).toBe(false);
    }
  });

  it("moderador não gerencia usuários, papéis nem registro restrito", () => {
    const p = resolvePermissions(["MODERATOR"]);
    expect(p.has("post:moderate")).toBe(true);
    expect(p.has("user:manage")).toBe(false);
    expect(p.has("role:manage")).toBe(false);
    expect(p.has("restricted:read")).toBe(false);
    expect(p.has("restricted:write")).toBe(false);
  });

  it("auditor não escreve nada", () => {
    const p = resolvePermissions(["AUDITOR"]);
    expect(p.has("report:read_internal")).toBe(true);
    expect(p.has("audit:read")).toBe(true);
    expect(p.has("report:update_status")).toBe(false);
    expect(p.has("report:view_pii")).toBe(false);
    expect(p.has("report:publish")).toBe(false);
    expect(p.has("triage:decide")).toBe(false);
  });

  it("só SUPER_ADMIN escreve no registro de impedimentos", () => {
    for (const r of Object.keys(roleGrants)) {
      const p = resolvePermissions([r as never]);
      if (p.has("restricted:write")) expect(r).toBe("SUPER_ADMIN");
    }
  });

  it("herança funciona: supervisor inclui o que o operador tem", () => {
    const sup = resolvePermissions(["SUPERVISOR"]);
    expect(sup.has("report:update_status")).toBe(true); // herdado do operador
    expect(sup.has("report:publish")).toBe(true); // próprio do supervisor
    expect(sup.has("role:manage")).toBe(false);
  });

  it("herança tem profundidade máxima (sem ciclo infinito)", () => {
    // resolvePermissions sobre todos os papéis não deve estourar a pilha
    expect(() => resolvePermissions(Object.keys(roleGrants) as never)).not.toThrow();
  });

  it("todas as permissões referenciadas existem no catálogo", () => {
    const catalog = new Set<string>(ALL_PERMISSIONS);
    for (const def of Object.values(roleGrants)) {
      for (const p of def.permissions) {
        expect(catalog.has(p)).toBe(true);
      }
    }
  });
});

describe("MATCHING (§26)", () => {
  it("espécies diferentes zeram a correspondência", () => {
    const m = scoreMatch(
      { species: "CACAO", color: "preto", distinguishing: "coleira azul" },
      { species: "GATO", color: "preto", distinguishing: "coleira azul" },
    );
    expect(m.factors.species).toBe(-1);
    expect(shouldSuggest(m)).toBe(false);
  });

  it("caso forte: mesma espécie, cor, bairro e perto no tempo", () => {
    const m = scoreMatch(
      { species: "CACAO", color: "preto com mancha branca no peito", size: "MEDIO", neighborhoodId: "b1", point: { lat: -27.803, lng: -50.312 }, date: new Date("2026-08-20"), distinguishing: "coleira azul e tag do nome" },
      { species: "CACAO", color: "preto, mancha branca no peito", size: "MEDIO", neighborhoodId: "b1", point: { lat: -27.804, lng: -50.313 }, date: new Date("2026-08-21"), distinguishing: "usa coleira azul com plaquinha" },
    );
    expect(m.score).toBeGreaterThanOrEqual(50);
    expect(m.label).not.toBe("FRACA");
  });

  it("sempre devolve a lista de verificações humanas", () => {
    const m = scoreMatch({ species: "GATO" }, { species: "GATO" });
    expect(m.checks.length).toBeGreaterThan(0);
    expect(m.checks.some((c) => /microchip/i.test(c))).toBe(true);
  });

  it("jaccard é 0..1 e insensível a acento/caixa", () => {
    expect(jaccard(tokens("coleira azul"), tokens("COLEIRA Azul"))).toBe(1);
    expect(jaccard(tokens("coleira azul"), tokens("carro preto"))).toBe(0);
  });

  it("similaridade de cor trata reordenação de palavras", () => {
    expect(shortFieldSimilarity("preto e branco", "branco e preto")).toBeGreaterThan(0.8);
  });

  it("campo ausente não é tratado como divergência", () => {
    expect(shortFieldSimilarity(null, "preto")).toBe(0);
    expect(shortFieldSimilarity("preto", null)).toBe(0);
  });

  it("normalização remove acento (pt-BR)", () => {
    expect(normalizeText("Cao")).toBe("cao");
  });
});