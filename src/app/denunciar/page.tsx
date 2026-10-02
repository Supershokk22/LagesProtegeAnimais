"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";

/* ============================================================================
   FLUXO DE DENUNCIA (§98)
   Etapas: Tipo -> Animal -> Local -> O que aconteceu -> Evidencias ->
           Contato -> Revisao -> Envio
   §99: urgencia CRITICA/URGENTE reduz etapas (caminho de emergencia).
   §65: rascunho em localStorage para nao perder conteudo em rede ruim.
   ========================================================================== */

type Categoria = {
  value: string;
  label: string;
  desc: string;
  especie: string[];
};

const CATEGORIAS: Categoria[] = [
  { value: "ABANDONO", label: "Abandono", desc: "Animal dejado sem cuidado, água ou abrigo.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "AGRESSAO", label: "Agressão", desc: "Ataques ou agressões praticadas contra animais.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "NEGLIGENCIA", label: "Negligência", desc: "Falta de cuidado básico de forma recorrente.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "FALTA_DE_AGUA", label: "Falta de água", desc: "Animal sem água potável acessível.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "FALTA_DE_ALIMENTO", label: "Falta de alimento", desc: "Animal sem alimentação.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "CONFINAMENTO_INADEQUADO", label: "Confinamento inadequado", desc: "Animal em espaço inapropriado ou sem ventilação.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "ANIMAL_FERIDO", label: "Animal ferido", desc: "Lesão, fratura, atropelamento.", especie: ["CACAO", "GATO", "AVE", "OUTRO"] },
  { value: "ATROPELAMENTO", label: "Atropelamento", desc: "Animal atropelado em via.", especie: ["CACAO", "GATO", "EQUINO", "BOVINO", "OUTRO"] },
  { value: "SITUACAO_DE_RISCO", label: "Situação de risco", desc: "Risco iminente à vida do animal.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "CRIACAO_IRREGULAR", label: "Criação irregular", desc: "Criação ou venda sem condições adequadas.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "ACUMULACAO", label: "Acumulação", desc: "Grande quantidade de animais em local inadequado.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "ANIMAL_PRESO", label: "Animal preso", desc: "Animal preso, trancado ou acorrentado.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "AUSENCIA_DE_ATENDIMENTO_VETERINARIO", label: "Sem atendimento veterinário", desc: "Animal necessitando de atendimento sem acesso.", especie: ["CACAO", "GATO", "OUTRO"] },
  { value: "DESCARTE_IRREGULAR_DE_CARCACAS", label: "Descarte irregular de carcaças", desc: "Restos de animais em via, terreno ou lixo.", especie: ["OUTRO"] },
  { value: "OUTROS", label: "Outros", desc: "Outra situação relevante.", especie: ["OUTRO"] },
];

const ESPECIES = [
  { v: "CACAO", l: "Cão" }, { v: "GATO", l: "Gato" }, { v: "EQUINO", l: "Equino" },
  { v: "BOVINO", l: "Bovino" }, { v: "CAPRINO", l: "Caprino" }, { v: "OVINO", l: "Ovino" },
  { v: "AVE", l: "Ave" }, { v: "ROEDOR", l: "Roedor" }, { v: "PEIXE", l: "Peixe" },
  { v: "REPTIL", l: "Réptil" }, { v: "OUTRO", l: "Outro" },
];

const URGENCIAS = [
  { v: "BAIXA", l: "Baixa", d: "Sem risco no momento" },
  { v: "MODERADA", l: "Moderada", d: "Precisa de atenção, sem urgência" },
  { v: "ALTA", l: "Alta", d: "Animal sofre sem atendimento" },
  { v: "URGENTE", l: "Urgente", d: "Precisa de ação em poucas horas" },
  { v: "CRITICA", l: "Crítica", d: "Risco iminente à vida" },
];

const BAIRROS = [
  "Centro", "Santa Clara", "Antiga BR-2", "São Cristóvão", "Bela Vista", "Alto do Eiro",
  "Das Vilas", "Santa Helena", "Universitário", "Morada do Sol", "Triunfo", "Carvão",
  "Passagem", "Penha", "Cruz de Ima", "Planalto",
];

const DRAFT_KEY = "lpa:denuncia:rascunho:v1";

type State = {
  step: number;
  category: string;
  species: string;
  animalCount: number;
  occurredDate: string;
  occurredTime: string;
  neighborhood: string;
  lat: number | null;
  lng: number | null;
  precision: "EXATA" | "APROXIMADA" | "AGREGADA";
  reference: string;
  description: string;
  urgency: string;
  anonymous: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  witnessCount: number;
  terms: boolean;
};

const EMPTY: State = {
  step: 0, category: "", species: "", animalCount: 1,
  occurredDate: "", occurredTime: "", neighborhood: "",
  lat: null, lng: null, precision: "APROXIMADA", reference: "",
  description: "", urgency: "MODERADA", anonymous: false,
  contactName: "", contactEmail: "", contactPhone: "", witnessCount: 0, terms: false,
};

export default function ReportFlow() {
  const [s, setS] = useState<State>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ protocol: string; suggestedUrgency: string; score: number } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const started = useRef(false);

  /* --- §65 modo de baixa conectividade: rascunho local --------------------- */
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<State>;
        setS((prev) => ({ ...prev, ...parsed, step: 0, submitting: false } as State));
        setBanner("Rascunho recuperado deste dispositivo. Revise antes de enviar.");
      }
    } catch {
      /* storage bloqueado */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(s));
    } catch {
      /* quota / modo privado */
    }
  }, [s]);

  /* --- caminho de emergencia (§99) ---------------------------------------- */
  const isEmergency = s.urgency === "CRITICA" || s.urgency === "URGENTE";
  const steps = useMemo(
    () => (isEmergency
      ? ["Situação", "Local", "Relato", "Contato", "Enviar"]
      : ["Tipo", "Animal", "Local", "Relato", "Contato", "Revisão", "Enviar"]),
    [isEmergency],
  );

  const stepKey = (i: number) => steps[i] ?? "";
  const total = steps.length;

  const set = useCallback(<K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
    setErrors((e) => {
      const n = { ...e };
      delete n[k as string];
      return n;
    });
  }, []);

  function validateStep(i: number): boolean {
    const e: Record<string, string> = {};

    if (stepKey(i) === "Tipo" || stepKey(i) === "Situação") {
      if (!s.category) e.category = "Escolha a situação.";
    }
    if (stepKey(i) === "Animal" && !s.species) e.species = "Informe a espécie.";
    if (stepKey(i) === "Local") {
      if (!s.neighborhood && s.lat === null) e.neighborhood = "Informe o bairro ou marque o ponto no mapa.";
    }
    if (stepKey(i) === "Relato") {
      if (s.description.trim().length < 20) {
        e.description = "Descreva em pelo menos 20 caracteres: o que aconteceu, onde e quando.";
      }
      if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(s.description)) {
        e.description = "Remova o CPF do relato. A equipe solicitará por canal seguro se necessário.";
      }
      if (/\(?\d{2}\)?[\s-]?9\d{4}[\s-]?\d{4}\b/.test(s.description)) {
        e.description = "Remova telefones de terceiros: isso expõe a pessoa citada.";
      }
    }
    if (stepKey(i) === "Contato") {
      if (!s.anonymous && !s.contactEmail && !s.contactPhone) {
        e.contactEmail = "Informe um meio de contato ou marque como anônima.";
      }
      if (s.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(s.contactEmail)) {
        e.contactEmail = "E-mail inválido.";
      }
      if (s.contactPhone && !/^\+?55?\s?\(?\d{2}\)?[\s-]?9?\d{4}[-\s]?\d{4}$/.test(s.contactPhone)) {
        e.contactPhone = "Use (49) 9XXXX-XXXX.";
      }
    }
    if (stepKey(i) === "Revisão" && !s.terms) {
      e.terms = "É necessário aceitar os Termos e a Política de Privacidade.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validateStep(s.step)) return;
    setS((p) => ({ ...p, step: Math.min(p.step + 1, total - 1) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    setS((p) => ({ ...p, step: Math.max(0, p.step - 1) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!validateStep(s.step)) return;
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: s.category,
          description: s.description,
          species: s.species || null,
          animalCount: s.animalCount,
          occurredAt: s.occurredDate || undefined,
          occurredTime: s.occurredTime || undefined,
          neighborhoodId: null,
          location: s.lat !== null && s.lng !== null ? { lat: s.lat, lng: s.lng } : null,
          locationPrecision: s.precision,
          locationReference: s.reference || null,
          urgency: s.urgency,
          isAnonymous: s.anonymous,
          contactName: s.contactName || null,
          contactEmail: s.contactEmail || null,
          contactPhone: s.contactPhone || null,
          witnessCount: s.witnessCount,
          observations: null,
          termsAccepted: s.terms || isEmergency,
          evidenceIds: [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const first = json?.error?.details?.[0];
        setErrors(first ? { [first.path]: first.message } : { form: json?.error?.message ?? "Falha ao enviar." });
        return;
      }
      setResult({
        protocol: json.data.protocol,
        suggestedUrgency: json.data.suggestedUrgency,
        score: json.data.triage?.score ?? 0,
      });
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ form: "Falha de conexão. Seu rascunho foi salvo neste dispositivo — tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------------------------------------------------------ */

  if (result) {
    return (
      <>
        <SiteHeader />
        <main id="conteudo" className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl border border-verde-600 bg-verde-50 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-verde-700">Denúncia registrada</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-verde-900">
              {result.protocol}
            </h1>
            <p className="mt-2 font-mono text-sm text-verde-700">Guarde este número de protocolo.</p>

            <dl className="mt-8 grid gap-3 text-left sm:grid-cols-2">
              <div className="rounded-lg bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutro-500">Urgência sugerida</dt>
                <dd className="mt-1 text-lg font-bold text-verde-900">{result.suggestedUrgency}</dd>
                <dd className="text-xs text-neutro-500">Definida pela triagem humana, não por você.</dd>
              </div>
              <div className="rounded-lg bg-white p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-neutro-500">Índice de Factors</dt>
                <dd className="mt-1 text-lg font-bold text-verde-900">{result.score}/100</dd>
                <dd className="text-xs text-neutro-500">Calculado a partir dos fatos relatados.</dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href={`/denunciar/consultar?protocolo=${result.protocol}`}
                className="rounded-lg bg-verde-900 px-5 py-3 text-sm font-bold text-white hover:bg-verde-700"
              >
                Acompanhar protocolo
              </Link>
              <Link
                href="/denunciar"
                className="rounded-lg border border-neutro-300 px-5 py-3 text-sm font-bold hover:bg-white"
              >
                Registrar outra
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const cat = CATEGORIAS.find((c) => c.value === s.category);

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-verde-900">Registrar denúncia</h1>
          <p className="mt-2 text-neutro-700">
            Nenhuma denúncia transforma automaticamente uma pessoa citada em culpada. Todo caso
            publicado terá fonte verificável.
          </p>
        </header>

        {banner && (
          <p role="status" className="mb-6 rounded-lg border border-amarelo bg-amarelo/10 px-4 py-3 text-sm">
            {banner}
          </p>
        )}

        {isEmergency && (
          <div role="alert" className="mb-6 rounded-lg border-2 border-vermelho bg-vermelho/5 p-4">
            <p className="font-bold text-vermelho">Modo emergência ativado</p>
            <p className="mt-1 text-sm text-neutro-700">
              Reduzimos as etapas. Em risco iminente, acione também os canais oficiais — esta
              plataforma não substitui o atendimento emergencial.{ " "}
              <Link href="/emergencia" className="font-bold underline">Ver contatos oficiais</Link>
            </p>
          </div>
        )}

        {/* Progresso */}
        <nav aria-label="Progresso" className="mb-8">
          <ol className="flex flex-wrap gap-1.5">
            {steps.map((label, i) => (
              <li key={label} className="flex items-center gap-1.5">
                <span
                  aria-current={i === s.step ? "step" : undefined}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    i === s.step
                      ? "bg-verde-900 text-white"
                      : i < s.step
                        ? "bg-verde-100 text-verde-900"
                        : "bg-neutro-100 text-neutro-500"
                  }`}
                >
                  {label}
                </span>
                {i < steps.length - 1 && <span aria-hidden className="text-neutro-300">→</span>}
              </li>
            ))}
          </ol>
        </nav>

        {/* Urgência visível desde o início para acionar o modo emergência */}
        <fieldset className="mb-6 rounded-xl border border-neutro-300 bg-white p-5">
          <legend className="px-1 text-sm font-bold uppercase tracking-wide text-neutro-500">
            Nível de urgência
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {URGENCIAS.map((u) => (
              <label
                key={u.v}
                className={`cursor-pointer rounded-lg border p-3 text-center transition-colors has-[:checked]:border-verde-900 has-[:checked]:bg-verde-50 ${
                  s.urgency === u.v ? "border-verde-900 bg-verde-50" : "border-neutro-300"
                }`}
              >
                <input
                  type="radio"
                  name="urgencia"
                  value={u.v}
                  checked={s.urgency === u.v}
                  onChange={() => {
                    set("urgency", u.v);
                    if (u.v === "CRITICA" || u.v === "URGENTE") setS((p) => ({ ...p, step: 0 }));
                  }}
                  className="sr-only"
                />
                <span className="block text-sm font-bold text-neutro-900">{u.l}</span>
                <span className="mt-0.5 block text-[11px] leading-tight text-neutro-500">{u.d}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutro-500">
            A triagem pode ajustar este nível. Você não é punido por classificar acima — e a equipe
            é avisada quando o caso é mais grave do que o declarado.
          </p>
        </fieldset>

        <div className="rounded-xl border border-neutro-300 bg-white p-6">
          {/* ---------------------------------------------- ETAPA */}
          {(stepKey(s.step) === "Tipo" || stepKey(s.step) === "Situação") && (
            <fieldset>
              <legend className="text-lg font-bold text-verde-900">O que está acontecendo?</legend>
              <p className="mt-1 text-sm text-neutro-500">Escolha a opção mais próxima.</p>
              {errors.category && <FieldError msg={errors.category} />}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {CATEGORIAS.map((c) => (
                  <label
                    key={c.value}
                    className={`cursor-pointer rounded-lg border p-3 transition-colors has-[:checked]:border-verde-900 has-[:checked]:bg-verde-50 ${
                      s.category === c.value ? "border-verde-900 bg-verde-50" : "border-neutro-300 hover:border-neutro-500"
                    }`}
                  >
                    <input
                      type="radio"
                      name="categoria"
                      value={c.value}
                      checked={s.category === c.value}
                      onChange={() => {
                        set("category", c.value);
                        if (!c.especie.includes(s.species)) set("species", c.especie[0]);
                      }}
                      className="sr-only"
                    />
                    <span className="block text-sm font-bold text-neutro-900">{c.label}</span>
                    <span className="mt-0.5 block text-xs text-neutro-500">{c.desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {stepKey(s.step) === "Animal" && (
            <fieldset>
              <legend className="text-lg font-bold text-verde-900">Sobre o animal</legend>
              <div className="mt-4 space-y-5">
                <div>
                  <label htmlFor="especie" className="block text-sm font-semibold">Espécie *</label>
                  {errors.species && <FieldError msg={errors.species} />}
                  <select
                    id="especie"
                    value={s.species}
                    onChange={(e) => set("species", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutro-300 bg-white px-3 py-2.5"
                  >
                    <option value="">Selecione…</option>
                    {cat?.especie.map((v) => {
                      const esp = ESPECIES.find((x) => x.v === v);
                      return <option key={v} value={v}>{esp?.l ?? v}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label htmlFor="qtd" className="block text-sm font-semibold">Quantidade de animais</label>
                  <input
                    id="qtd"
                    type="number"
                    min={1}
                    max={1000}
                    value={s.animalCount}
                    onChange={(e) => set("animalCount", Math.max(1, Number(e.target.value) || 1))}
                    className="mt-1 w-40 rounded-lg border border-neutro-300 px-3 py-2.5"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="data" className="block text-sm font-semibold">Quando aconteceu</label>
                    <input
                      id="data"
                      type="date"
                      value={s.occurredDate}
                      onChange={(e) => set("occurredDate", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="hora" className="block text-sm font-semibold">Horário aproximado</label>
                    <input
                      id="hora"
                      type="time"
                      value={s.occurredTime}
                      onChange={(e) => set("occurredTime", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5"
                    />
                  </div>
                </div>
              </div>
            </fieldset>
          )}

          {stepKey(s.step) === "Local" && (
            <fieldset>
              <legend className="text-lg font-bold text-verde-900">Onde aconteceu</legend>
              {errors.neighborhood && <FieldError msg={errors.neighborhood} />}

              <div className="mt-4">
                <label htmlFor="bairro" className="block text-sm font-semibold">Bairro</label>
                <select
                  id="bairro"
                  value={s.neighborhood}
                  onChange={(e) => set("neighborhood", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutro-300 bg-white px-3 py-2.5"
                >
                  <option value="">Selecione o bairro…</option>
                  {BAIRROS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="mt-4">
                <label htmlFor="ref" className="block text-sm font-semibold">Ponto de referência</label>
                <input
                  id="ref"
                  value={s.reference}
                  onChange={(e) => set("reference", e.target.value)}
                  maxLength={240}
                  placeholder="Ex.: em frente à escola, próximo à curva do posto"
                  className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5"
                  aria-describedby="ref-help"
                />
                <p id="ref-help" className="mt-1 text-xs text-neutro-500">
                  Descreva o ponto sem citar números de casas. Endereços exatos não são publicados.
                </p>
              </div>

              <div className="mt-5">
                <p className="block text-sm font-semibold">Marcar no mapa (opcional)</p>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      setErrors((e) => ({ ...e, neighborhood: "Seu navegador não oferece geolocalização. Informe o bairro." }));
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setS((p) => ({ ...p, lat: pos.coords.latitude, lng: pos.coords.longitude, precision: "EXATA" }));
                        setErrors((e) => { const n = { ...e }; delete n.neighborhood; return n; });
                      },
                      () => {
                        setErrors((e) => ({
                          ...e,
                          neighborhood: "Não foi possível obter sua localização. Informe o bairro e o ponto de referência.",
                        }));
                      },
                      { enableHighAccuracy: true, timeout: 8000 },
                    );
                  }}
                  className="mt-2 rounded-lg border border-neutro-300 px-4 py-2.5 text-sm font-semibold hover:bg-neutro-100"
                >
                  Usar minha localização atual
                </button>
                {s.lat !== null && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-verde-700">
                    <span aria-hidden>✓</span> Coordenada capturada. Visível apenas para a equipe autorizada.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <p className="block text-sm font-semibold">Precisão do ponto</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {([
                    ["EXATA", "Exata", "Só a equipe autorizada vê o ponto."],
                    ["APROXIMADA", "Aproximada", "Usuários autorizados veem uma área."],
                    ["AGREGADA", "Agregada", "O público vê só a região."],
                  ] as const).map(([v, l, d]) => (
                    <label key={v} className={`cursor-pointer rounded-lg border p-3 text-xs has-[:checked]:border-verde-900 has-[:checked]:bg-verde-50 ${s.precision === v ? "border-verde-900 bg-verde-50" : "border-neutro-300"}`}>
                      <input type="radio" name="precisao" value={v} checked={s.precision === v} onChange={() => set("precision", v)} className="sr-only" />
                      <span className="block font-bold text-neutro-900">{l}</span>
                      <span className="mt-0.5 block text-neutro-500">{d}</span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>
          )}

          {stepKey(s.step) === "Relato" && (
            <fieldset>
              <legend className="text-lg font-bold text-verde-900">O que aconteceu</legend>
              {errors.description && <FieldError msg={errors.description} />}
              <label htmlFor="desc" className="sr-only">Descrição do que aconteceu</label>
              <textarea
                id="desc"
                value={s.description}
                onChange={(e) => set("description", e.target.value)}
                rows={7}
                maxLength={8000}
                placeholder="Descreva objetivamente: o que você viu, o estado dos animais, o que já foi feito, se há risco imediato."
                className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5"
                aria-invalid={!!errors.description}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-neutro-500">
                <span>Mínimo 20 caracteres. Evite CPF e telefone de terceiros.</span>
                <span className="tabular-nums">{s.description.length}/8000</span>
              </div>

              <div className="mt-5">
                <label htmlFor="test" className="block text-sm font-semibold">Testemunhas presentes</label>
                <input
                  id="test"
                  type="number"
                  min={0}
                  max={500}
                  value={s.witnessCount}
                  onChange={(e) => set("witnessCount", Math.max(0, Number(e.target.value) || 0))}
                  className="mt-1 w-40 rounded-lg border border-neutro-300 px-3 py-2.5"
                />
              </div>
            </fieldset>
          )}

          {stepKey(s.step) === "Contato" && (
            <fieldset>
              <legend className="text-lg font-bold text-verde-900">Como acompanhar</legend>

              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-lg border border-neutro-300 p-4 has-[:checked]:border-verde-900 has-[:checked]:bg-verde-50">
                <input type="checkbox" checked={s.anonymous} onChange={(e) => set("anonymous", e.target.checked)} className="mt-1 h-4 w-4" />
                <span>
                  <span className="block text-sm font-bold text-neutro-900">Registrar como anônima</span>
                  <span className="mt-0.5 block text-xs text-neutro-500">
                    Você ainda poderá acompanhar usando e-mail ou telefone, mas seu nome não será
                    vinculado à denúncia.
                  </span>
                </span>
              </label>

              {!isEmergency && (
                <p className="mt-5 text-sm font-semibold">Seus dados de contato</p>
              )}
              {errors.contactEmail && <FieldError msg={errors.contactEmail} />}
              {errors.contactPhone && <FieldError msg={errors.contactPhone} />}

              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nome" className="block text-sm font-semibold">Nome</label>
                  <input id="nome" value={s.contactName} onChange={(e) => set("contactName", e.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold">E-mail</label>
                  <input id="email" type="email" value={s.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5" />
                </div>
                <div>
                  <label htmlFor="tel" className="block text-sm font-semibold">Telefone / WhatsApp</label>
                  <input id="tel" value={s.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="(49) 9XXXX-XXXX" className="mt-1 w-full rounded-lg border border-neutro-300 px-3 py-2.5" />
                </div>
              </div>
            </fieldset>
          )}

          {stepKey(s.step) === "Revisão" && (
            <div>
              <h2 className="text-lg font-bold text-verde-900">Revise antes de enviar</h2>
              {errors.terms && <FieldError msg={errors.terms} />}
              <dl className="mt-4 divide-y divide-neutro-300 rounded-lg border border-neutro-300">
                {[
                  ["Situação", CATEGORIAS.find((c) => c.value === s.category)?.label ?? "—"],
                  ["Urgência declarada", URGENCIAS.find((u) => u.v === s.urgency)?.l ?? "—"],
                  ["Espécie", ESPECIES.find((e) => e.v === s.species)?.l ?? "—"],
                  ["Quantidade", String(s.animalCount)],
                  ["Bairro", s.neighborhood || "—"],
                  ["Referência", s.reference || "—"],
                  ["Localização capturada", s.lat !== null ? "Sim" : "Não"],
                  ["Anonimato", s.anonymous ? "Sim" : "Não"],
                  ["Contato", s.contactEmail || s.contactPhone || "Não informado"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm">
                    <dt className="text-neutro-500">{k}</dt>
                    <dd className="text-right font-semibold text-neutro-900">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 rounded-lg bg-neutro-100 p-4">
                <p className="text-sm font-semibold text-neutro-900">Seu relato</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-neutro-700">{s.description}</p>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={s.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-1 h-4 w-4" />
                <span className="text-sm text-neutro-700">
                  Aceito os{" "}
                  <Link href="/legal/termos-de-uso" className="font-semibold text-verde-900 underline">Termos de Uso</Link> e a{" "}
                  <Link href="/legal/politica-de-privacidade" className="font-semibold text-verde-900 underline">Política de Privacidade</Link>.
                </span>
              </label>
            </div>
          )}

          {stepKey(s.step) === "Enviar" && (
            <div>
              <h2 className="text-lg font-bold text-verde-900">Enviar denúncia</h2>
              <p className="mt-2 text-sm text-neutro-700">
                Você receberá um protocolo no formato <code className="rounded bg-neutro-100 px-1 font-mono text-xs">LPA-ANO-NNNNNN</code>.
                Guarde esse número para acompanhar.
              </p>

              {errors.form && (
                <p role="alert" className="mt-4 rounded-lg border border-vermelho bg-vermelho/5 px-4 py-3 text-sm">
                  {errors.form}
                </p>
              )}

              <ul className="mt-6 space-y-2 text-sm text-neutro-700">
                {[
                  "A urgência final é definida por uma pessoa da equipe, com justificativa registrada.",
                  "O mapa público mostrará apenas uma região agregada, nunca o ponto exato.",
                  "Se você não tiver conta, ainda poderá acompanhar pelo protocolo.",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <span aria-hidden className="text-verde-700">✓</span> {t}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="mt-8 w-full rounded-lg bg-verde-900 px-6 py-4 text-base font-bold text-white transition-colors hover:bg-verde-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Enviando…" : "Enviar denúncia"}
              </button>
            </div>
          )}

          {/* Navegação */}
          <div className="mt-8 flex items-center justify-between border-t border-neutro-300 pt-6">
            <button
              type="button"
              onClick={back}
              disabled={s.step === 0}
              className="rounded-lg border border-neutro-300 px-5 py-3 text-sm font-bold disabled:invisible"
            >
              Voltar
            </button>
            {stepKey(s.step) !== "Enviar" && (
              <button
                type="button"
                onClick={next}
                className="rounded-lg bg-verde-900 px-6 py-3 text-sm font-bold text-white hover:bg-verde-700"
              >
                Continuar →
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-neutro-500">
          Seu rascunho é salvo automaticamente neste dispositivo.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p role="alert" className="mt-2 flex items-start gap-2 rounded-md bg-vermelho/10 px-3 py-2 text-sm text-vermelho">
      <span aria-hidden>⚠</span> {msg}
    </p>
  );
}