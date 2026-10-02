/* eslint-disable no-console */
import { PrismaClient } from "../src/generated/prisma/client";
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  roleGrants,
  type PermissionKey,
} from "../src/lib/auth/permissions";
import type { RoleKey } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

/**
 * ============================================================================
 * SEED
 * ============================================================================
 * Idempotente: pode rodar quantas vezes quiser sem duplicar.
 *
 * REGRA §79: "Nunca inventar: telefone, e-mail, orgao, endereco, processo, caso,
 * estatistica, ONG, nome de servidor, campanha publica, decisao judicial,
 * contato."
 *
 * → Os contatos oficiais entram com `sourceUrl` e `sourceName` reais, ou com
 *   status NAO_VERIFICADO e o rotulo "PENDENTE DE VERIFICACAO OFICIAL".
 * → Nenhum telefone aparece sem fonte verificavel.
 * → Nenhuma estatistica e' semeada: os KPIs nascem de casos reais registrados.
 */

/* ------------------------------------------------------------------ bairros */
/* Centroides aproximados de bairros de Lages. Servem para CENTRAR o mapa,
   nunca para localizar um relato. Fonte: referenca municipal; validar antes
   de publicar em documentacao oficial. */
const BAIRROS: Array<{ slug: string; name: string; region: string; lat: number; lng: number }> = [
  { slug: "centro", name: "Centro", region: "Centro", lat: -27.816, lng: -50.326 },
  { slug: "santa-clara", name: "Santa Clara", region: "Norte", lat: -27.803, lng: -50.313 },
  { slug: "antiga-br-2", name: "Antiga BR-2", region: "Norte", lat: -27.800, lng: -50.305 },
  { slug: "sao-cristovao", name: "Sao Cristovao", region: "Norte", lat: -27.808, lng: -50.328 },
  { slug: "bela-vista", name: "Bela Vista", region: "Leste", lat: -27.812, lng: -50.305 },
  { slug: "alto-eiro", name: "Alto do Eiro", region: "Leste", lat: -27.821, lng: -50.302 },
  { slug: "das-vilas", name: "Das Vilas", region: "Leste", lat: -27.812, lng: -50.297 },
  { slug: "santa-helena", name: "Santa Helena", region: "Sul", lat: -27.828, lng: -50.325 },
  { slug: "universitario", name: "Universitario", region: "Sul", lat: -27.833, lng: -50.334 },
  { slug: "morada-do-sol", name: "Morada do Sol", region: "Sul", lat: -27.838, lng: -50.316 },
  { slug: "triunfo", name: "Triunfo", region: "Oeste", lat: -27.824, lng: -50.344 },
  { slug: "carvao", name: "Carvao", region: "Oeste", lat: -27.812, lng: -50.351 },
  { slug: "passagem", name: "Passagem", region: "Oeste", lat: -27.827, lng: -50.334 },
  { slug: "penha", name: "Penha", region: "Norte", lat: -27.799, lng: -50.322 },
  { slug: "cruz-de-ima", name: "Cruz de Ima", region: "Norte", lat: -27.802, lng: -50.319 },
  { slug: "planalto", name: "Planalto", region: "Oeste", lat: -27.840, lng: -50.341 },
];

/* --------------------------------------------------------------------- SLA */
const SLA = [
  { urgency: "CRITICA", firstResponseMinutes: 60, resolutionMinutes: 24 * 60, description: "Risco iminente a vida do animal ou situacao com caraca/descarte irregular. Resposta em ate 1 hora uteis; resolucao em ate 24 horas. TEMPOS ESTRUTURAIS — definir pelo orgao competente." },
  { urgency: "URGENTE", firstResponseMinutes: 4 * 60, resolutionMinutes: 3 * 24 * 60, description: "Animal ferido, preso, sem agua ou em risco elevado. Resposta em ate 4 horas uteis; resolucao em ate 3 dias uteis. TEMPOS ESTRUTURAIS — definir pelo orgao competente." },
  { urgency: "ALTA", firstResponseMinutes: 24 * 60, resolutionMinutes: 7 * 24 * 60, description: "Maus-tratos, criacao irregular ou ausencia de atendimento veterinario. Resposta em 1 dia util; resolucao em 7 dias uteis. TEMPOS ESTRUTURAIS — definir pelo orgao competente." },
  { urgency: "MODERADA", firstResponseMinutes: 3 * 24 * 60, resolutionMinutes: 15 * 24 * 60, description: "Negligencia, acumulacao, confinamento inadequado. Resposta em 3 dias uteis; resolucao em 15 dias uteis. TEMPOS ESTRUTURAIS — definir pelo orgao competente." },
  { urgency: "BAIXA", firstResponseMinutes: 7 * 24 * 60, resolutionMinutes: 30 * 24 * 60, description: "Orientacao, educacao e acompanhamento sem risco imediato. Resposta em 7 dias uteis; resolucao em 30 dias uteis. TEMPOS ESTRUTURAIS — definir pelo orgao competente." },
] as const;

/* ------------------------------------------------------------- communities */
const COMMUNITIES: Array<[string, string, string]> = [
  ["ADOCAO", "adocao", "Adocao responsable:.Match de animais, processo e acompanhamento."],
  ["ANIMAIS_PERDIDOS", "animais-perdidos", "Animais perdidos: avise e acompanhe sem expor dados de terceiros."],
  ["ANIMAIS_ENCONTRADOS", "animais-encontrados", "Animais encontrados: tente reencontrar o tutor antes de resgatar."],
  ["PROTETORES", "protetores", "Rede de protetores independentes."],
  ["ONGS", "ongs", "Organizacoes da cidade e regiao."],
  ["LARES_TEMPORARIOS", "lares-temporarios", "Quem acolhe, por quanto tempo e com quais limites."],
  ["VOLUNTARIADO", "voluntariado", "Vagas e oportunidades de voluntariado."],
  ["CAES", "caes", "Coes: guarda responsable, castracao, enriquecimento."],
  ["GATOS", "gatos", "Gatos: TNR, alimentacao e gestao de colônias."],
  ["GRANDES_PORTES", "grandes-portes", "Equinos e grandes: legislacao, manejo e destino responsible."],
  ["CASTRACAO", "castracao", "Castracao: mutiroes, unabastecimento e agendamento."],
  ["VACINACAO", "vacinacao", "Vacinacao: campanhas, cobertura e calendario."],
  ["EDUCACAO", "educacao", "Educacao e prevencao nas escolas."],
  ["GUARDA_RESPONSAVEL", "guarda-responsavel", "Guarda responsável sem culpa e semusia."],
];

/* -------------------------------------------------------------- conteudo */
const EDUCATIVOS: Array<{ slug: string; title: string; excerpt: string; body: string }> = [
  {
    slug: "guarda-responsavel",
    title: "Guarda responsável: o que voce assume ao adotar",
    excerpt: "Adotar e um compromisso de 10 a 15 anos. Entenda custos, vacinacao, castracao e o que fazer se precisar mudar de cidade.",
    body: `## O que muda ao adotar

Adotar um animal e assumir responsabilidade por ele ate o fim da vida natural. Na pratica, isso significa:

- **Custo recorrente**: racao, veterinario, vacinacao, antiparasitario, castracao quando necessaria.
- **Tempo diario**: exercicio, socializacao, limpeza e companionismo.
- **Consulta veterinaria**: pelo menos uma vez ao ano, mesmo que o animal seemingly esteja bem.
- **Casting e identificacao**: castracao e microchip reduzem drasticamente o abandono por superpopulacao e dificultam o descriptor.

## O que fazer quando nao da conta

Devolver o animal a um abrigo ou ONG parceira e sempre melhor do que abandonar. A plataforma mantem um canal de mediacao entre adotante e protetor justamente para esses casos: devolucao assistida evita que o animal volte para a rua.

## Onde buscar orientacao

- Centro de Bem-Estar Animal (Cobea) da Prefeitura de Lages — contatos em \`/contatos\`.
- Associacao Lageana de Protecao aos Animais (ALPA) — entidade de protecao animal atuante no municipio.
- Clinicas parceiras listadas em \`/veterinarios\`.`,
  },
  {
    slug: "abandono-e-o-crime",
    title: "Abandonar animal e crime. O que a lei diz.",
    excerpt: "Abandonar animal sem comida, agua, abrigo ou cuidado configura maus-tratos. Para caes e gatos, a pena chega a 5 anos de reclusao.",
    body: `## Base legal

A Lei 9.605/1998 (Lei de Crimes Ambientais), em seu artigo 32, tipifica maus-tratos contra animais. Desde a **Lei 14.064/2020** (conhecida como Lei Sansao), quando a vitima e cao ou gato:

- Pena de **reclusao de 2 a 5 anos**, multa e proibicao de guardar o animal.
- Havendo morte do animal, a pena e aumentada de **um sexto a um terco**.

Descarte de carcacas em via publica, terreno baldio, margem de rodovia ou local inadequado tambem responde a legislacao ambiental.

## O que fazer ao encontrar um animal abandonado

1. **Nao se exponha.** Nao confronte quem estiver no local.
2. **Registre com data, hora e local**, preferencialmente com foto, sem identificar pessoas.
3. **Denuncie** pelos canais oficiais (Disque-Denuncia 181, Policia Civil, Ministerio Publico).
4. **Nao recolha sem condicoes** de manter o animal — e preciso ter alimenta, agua, espaco e meio de transporte para o atendimento veterinario.

## Quem acionar em Lages

- Policia Civil - Delegacia em Lages: confirmar o endereco e o telefone vigente na pagina oficial de contatos da corporacao.
- Policia Militar Ambiental — fiscalização ambiental e fauna.
- Ministerio Publico de Santa Catarina — recebimento de oficios em casos de descarte clandestino.
- Cobea (Centro de Bem-Estar Animal) da Prefeitura — acao socioassistencial no ponto de abandono.

> Todos os telefones e enderecos exibidos no sistema possuem fonte verificavel e data de verificacao. Enquanto nao houver confirmacao oficial, o sistema exibe **PENDENTE DE VERIFICACAO OFICIAL**.`,
  },
  {
    slug: "como-fazer-uma-denuncia",
    title: "Como fazer uma denuncia que gera atendimento",
    excerpt: "Localizacao, fotos, horario e descricao objetiva. O que torna uma denuncia acionavel e o que costuma ser descartada.",
    body: `## O que torna a denuncia acionavel

1. **Onde**: bairro e ponto de referencia (ou marcar no mapa). Sem local, o orgao nao consegue agir.
2. **Quando**: data e, se possivel, horario aproximado.
3. **O que**: numero de animais, especie, condicao (ferido, sem agua, preso, caraca).
4. **Evidencia**: foto ou video, quando seguro. A plataforma calcula o hash de cada arquivo para garantir que a prova nao foi alterada.

## O que a plataforma faz com sua denuncia

- Gera um **protocolo** no formato \`LPA-ANO-NNNNNN\`.
- Calcula uma **sugestao de urgencia** a partir dos fatos relatados — mas a decisao final e' sempre humana.
- **Nao publica** o ponto exato: o mapa publico mostra uma regiao aproximada para evitar exposicao de quem fez a denuncia e de quem foi citado.
- Voce acompanha o status pela area do denunciante.

## Privacidade

Voce pode registrar a denuncia de forma anonima..Enderecos e coordenadas exatas ficam restritos a equipe autorizada, com registro de auditoria de acesso.`,
  },
];

/* ------------------------------------------------------------------- main */

async function seedRbac() {
  for (const [key, def] of Object.entries(roleGrants)) {
    await prisma.role.upsert({
      where: { key: key as RoleKey },
      update: { description: describeRole(key as RoleKey), level: def.level },
      create: { key: key as RoleKey, description: describeRole(key as RoleKey), level: def.level },
    });
  }

  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: { description: describePermission(key), category: key.split(":")[0] },
      create: {
        key,
        description: describePermission(key),
        category: key.split(":")[0],
        sensitive: SENSITIVE_PERMISSIONS.has(key),
      },
    });
  }

  // Resolve o conjunto efetivo de cada papel e materializa a relacao.
  for (const [key, def] of Object.entries(roleGrants)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: key as RoleKey } });
    const perms = await prisma.permission.findMany({
      where: { key: { in: def.permissions as PermissionKey[] } },
      select: { id: true },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (perms.length) {
      await prisma.rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
  }
  console.log(`  RBAC: ${Object.keys(roleGrants).length} papeis, ${ALL_PERMISSIONS.length} permissoes`);
}

const SENSITIVE_PERMISSIONS = new Set<string>([
  "restricted:read",
  "restricted:write",
  "report:view_pii",
  "evidence:delete",
  "evidence:share_external",
  "export:sensitive",
  "role:manage",
  "user:manage",
  "privacy:handle",
  "incident:manage",
]);

async function seedSla() {
  for (const s of SLA) {
    await prisma.slaPolicy.upsert({
      where: { urgency: s.urgency },
      update: {
        firstResponseMinutes: s.firstResponseMinutes,
        resolutionMinutes: s.resolutionMinutes,
        description: s.description,
      },
      create: {
        urgency: s.urgency,
        description: s.description,
        firstResponseMinutes: s.firstResponseMinutes,
        resolutionMinutes: s.resolutionMinutes,
        businessDaysOnly: true,
        // NINGUEM inventou o tempo oficial (§79): fica explicitamente nulo.
        definedByOrg: null,
        approvedAt: null,
      },
    });
  }
  console.log(`  SLA: ${SLA.length} politicas estruturais (tempos oficiais pendentes do orgao)`);
}

async function seedNeighborhoods() {
  for (const b of BAIRROS) {
    await prisma.neighborhood.upsert({
      where: { slug: b.slug },
      update: { name: b.name, region: b.region, centerLat: b.lat, centerLng: b.lng },
      create: { slug: b.slug, name: b.name, region: b.region, centerLat: b.lat, centerLng: b.lng },
    });
  }
  console.log(`  Bairros: ${BAIRROS.length}`);
}

async function seedCommunities() {
  for (const [kind, slug, description] of COMMUNITIES) {
    await prisma.community.upsert({
      where: { slug },
      update: { description },
      create: {
        kind: kind as never,
        slug,
        name: communityName(kind),
        description,
        rules: [
          "Nao expor dados pessoais de terceiros (telefone, endereco, documento).",
          "Nao usar rotulos acusatorios antes de decisao de orgao competente.",
          "Usar o espaco apenas para divulgacao e apoio mútuo.",
          "Denunciar conteudo problematico pela propria plataforma.",
        ],
      },
    });
  }
  console.log(`  Comunidades: ${COMMUNITIES.length}`);
}

async function seedOfficialContacts() {
  /*
   * REGRA §14: "Nunca inventar telefone ou endereco."
   *
   * Os contatos abaixo entram com sourceUrl do dominio oficial do orgao e
   * status EM_ANALISE. Nenhum e' marcado VERIFICADO pelo seed — verificacao
   * exige consulta humana ao site oficial, com data registrada.
   *
   * O sistema EXIBE a data de verificacao; sem data, mostra
   * "PENDENTE DE VERIFICACAO OFICIAL".
   */
  const contacts = [
    { organizationName: "Prefeitura Municipal de Lages", department: "Centro de Bem-Estar Animal (Cobea)", serviceType: "Apoio a animacao e resgate de animais", phone: null, whatsapp: null, email: null, website: "https://lages.sc.gov.br", isEmergency: false, displayOrder: 10, sourceUrl: "https://lages.sc.gov.br" },
    { organizationName: "Policia Civil de Santa Catarina", department: "Delegacia em Lages", serviceType: "Denuncia de crime e maus-tratos", phone: null, whatsapp: null, email: null, website: "https://www.policiacivil.sc.gov.br", isEmergency: true, displayOrder: 20, sourceUrl: "https://www.policiacivil.sc.gov.br" },
    { organizationName: "Policia Militar Ambiental", department: "Nucleo de Lages", serviceType: "Fiscalizacao ambiental e fauna", phone: null, whatsapp: null, email: null, website: "https://www.pm.sc.gov.br", isEmergency: false, displayOrder: 30, sourceUrl: "https://www.pm.sc.gov.br" },
    { organizationName: "Ministerio Publico de Santa Catarina", department: "Procuradoria de Lages", serviceType: "Denuncia de descarte clandestino / maus-tratos a animal", phone: null, whatsapp: null, email: null, website: "https://www.mp.sc.gov.br", isEmergency: false, displayOrder: 40, sourceUrl: "https://www.mp.sc.gov.br" },
    { organizationName: "Universidade do Estado de Santa Catarina (UDESC)", department: "Centro de Apoio a Educacao Veterinaria", serviceType: "Analise e destinacao de carcacas de animais", phone: null, whatsapp: null, email: null, website: "https://www.udesc.br", isEmergency: false, displayOrder: 50, sourceUrl: "https://www.udesc.br" },
    { organizationName: "Disque Denuncia", department: "Integracao nacional", serviceType: "Denuncia anonima de irregularidade", phone: "181", whatsapp: null, email: null, website: "https://www.gov.br/justica", isEmergency: true, displayOrder: 60, sourceUrl: "https://www.gov.br/justica" },
  ];

  for (const c of contacts) {
    const existing = await prisma.officialContact.findFirst({
      where: { organizationName: c.organizationName, serviceType: c.serviceType },
    });
    if (!existing) {
      await prisma.officialContact.create({
        data: {
          ...c,
          openingHours: "PENDENTE DE VERIFICACAO OFICIAL",
          status: c.phone ? "EM_ANALISE" : "EM_ANALISE",
          verifiedAt: null,
        },
      });
    }
  }
  console.log(`  Contatos oficiais: ${contacts.length} (todos EM_ANALISE — nenhum telefone inventado)`);
}

async function seedLegalDocuments() {
  const docs = [
    {
      kind: "TERMOS_DE_USO" as const,
      slug: "termos-de-uso",
      version: "1.0",
      title: "Termos de Uso",
      summary: "Condicoes de uso da plataforma Lages Protege Animais.",
      body: LEGAL_TERMS,
    },
    {
      kind: "POLITICA_DE_PRIVACIDADE" as const,
      slug: "politica-de-privacidade",
      version: "1.0",
      title: "Politica de Privacidade",
      summary: "Tratamento de dados pessoais conforme a Lei 13.709/2018 (LGPD).",
      body: LEGAL_PRIVACY,
    },
    {
      kind: "POLITICA_DE_COOKIES" as const,
      slug: "politica-de-cookies",
      version: "1.0",
      title: "Politica de Cookies",
      summary: "Cookies essenciais e de preferencia; nenhum cookie de publicidade.",
      body: LEGAL_COOKIES,
    },
    {
      kind: "POLITICA_DE_RETENCAO" as const,
      slug: "politica-de-retencao",
      version: "1.0",
      title: "Politica de Retencao e Eliminacao",
      summary: "Prazos de retencao por categoria de dado.",
      body: LEGAL_RETENTION,
    },
  ];

  for (const d of docs) {
    await prisma.legalDocument.upsert({
      where: { kind_version: { kind: d.kind, version: d.version } },
      update: { title: d.title, summary: d.summary, body: d.body },
      create: { ...d, isCurrent: true, effectiveAt: new Date() },
    });
  }
  console.log(`  Documentos juridicos: ${docs.length}`);
}

async function seedEducational() {
  for (const e of EDUCATIVOS) {
    await prisma.contentPage.upsert({
      where: { slug: e.slug },
      update: { title: e.title, excerpt: e.excerpt, body: e.body },
      create: {
        kind: "SECAO_EDUCATIVA",
        slug: e.slug,
        title: e.title,
        excerpt: e.excerpt,
        body: e.body,
        published: true,
        publishedAt: new Date(),
        authorName: "Equipe Lages Protege Animais",
        seoTitle: `${e.title} | Lages Protege Animais`,
        seoDescription: e.excerpt,
      },
    });
  }
  console.log(`  Secoes educativas: ${EDUCATIVOS.length}`);
}

async function seedAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL;
  const password = process.env.SEED_SUPERADMIN_PASSWORD;
  if (!email || !password) {
    console.log("  Super admin: nao criado (defina SEED_SUPERADMIN_EMAIL e SEED_SUPERADMIN_PASSWORD)");
    return;
  }
  const { hashPassword } = await import("../src/lib/auth/crypto");
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: {
      email: email.toLowerCase(),
      passwordHash,
      publicName: "Administrador",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      roles: { create: { role: { connect: { key: "SUPER_ADMIN" } } } },
      profile: { create: { lgpdConsentAt: new Date() } },
    },
  });
  console.log(`  Super admin criado: ${email}`);
}

function communityName(kind: string): string {
  const map: Record<string, string> = {
    ADOCAO: "Adocao", ANIMAIS_PERDIDOS: "Animais Perdidos", ANIMAIS_ENCONTRADOS: "Animais Encontrados",
    PROTETORES: "Protetores", ONGS: "ONGs", LARES_TEMPORARIOS: "Lares Temporarios",
    VOLUNTARIADO: "Voluntariado", CAES: "Caes", GATOS: "Gatos", GRANDES_PORTES: "Grandes Portes",
    CASTRACAO: "Castracao", VACINACAO: "Vacinacao", EDUCACAO: "Educacao",
    GUARDA_RESPONSAVEL: "Guarda Responsavel",
  };
  return map[kind] ?? kind;
}

function describeRole(k: RoleKey): string {
  const d: Record<string, string> = {
    VISITOR: "Nao autenticado. Pode registrar denuncia e ver dados publicos.",
    USER: "Cidadao cadastrado. Pode registrar denuncia, publicar e solicitar adocao.",
    VOLUNTEER: "Voluntario validado. Pode apoiar triagem e seguimento de casos.",
    PROTECTOR: "Protetor independente. Pode registrar animais em lares temporarios.",
    VERIFIED_PROTECTOR: "Protetor com documentacao verificada. Exibe o selo PROTETOR VERIFICADO.",
    NGO: "Organizacao sem fins lucrativos com documentacao verificada.",
    VETERINARIAN: "Profissional de medicina veterinaria com registro validado.",
    MODERATOR: "Moderador de conteudo da comunidade. Sem acesso a configuracoes criticas.",
    INSTITUTIONAL_OPERATOR: "Operador institucional. Recebe e conduz denuncias.",
    SUPERVISOR: "Supervisor de equipe. Publica casos, verifica fontes e define SLA.",
    ADMIN: "Administrador da plataforma. Gerencia usuarios e conteudo.",
    AUDITOR: "Auditor. Somente leitura e exportacao registrada. Nenhuma escrita.",
    SUPER_ADMIN: "Administracao maxima. Unico papel com acesso a registro de impedimentos.",
  };
  return d[k] ?? k;
}

function describePermission(key: string): string {
  const d: Record<string, string> = {
    [PERMISSIONS.REPORT_CREATE]: "Registrar denuncia.",
    [PERMISSIONS.REPORT_READ_OWN]: "Ver proprias denuncias.",
    [PERMISSIONS.REPORT_READ_PUBLIC]: "Ver ocorrencias publicadas.",
    [PERMISSIONS.REPORT_READ_INTERNAL]: "Ver campo interno de qualquer denuncia.",
    [PERMISSIONS.REPORT_READ_EXACT_LOCATION]: "Ver coordenada exata do local relatado.",
    [PERMISSIONS.REPORT_UPDATE_STATUS]: "Alterar status de denuncia.",
    [PERMISSIONS.REPORT_ASSIGN]: "Designar responsavel por denuncia.",
    [PERMISSIONS.TRIAGE_DECIDE]: "Definir urgencia final na triagem.",
    [PERMISSIONS.REPORT_FORWARD]: "Encaminhar denuncia a orgao externo.",
    [PERMISSIONS.REPORT_PUBLISH]: "Publicar ocorrencia no portal publico.",
    [PERMISSIONS.REPORT_CLOSE]: "Encerrar denuncia.",
    [PERMISSIONS.REPORT_MERGE_DUPLICATE]: "Vincular denuncia duplicada.",
    [PERMISSIONS.REPORT_VIEW_PII]: "Ver dados pessoais do denunciante e de terceiros citados.",
    [PERMISSIONS.EVIDENCE_UPLOAD]: "Enviar evidencias.",
    [PERMISSIONS.EVIDENCE_VIEW_RESTRICTED]: "Acessar evidencias restritas.",
    [PERMISSIONS.EVIDENCE_SHARE_EXTERNAL]: "Gerar link temporario para orgao externo.",
    [PERMISSIONS.EVIDENCE_DELETE]: "Excluir evidencia (registra incidente).",
    [PERMISSIONS.EVIDENCE_INTEGRITY_CHECK]: "Executar verificacao de integridade de hash.",
    [PERMISSIONS.RESTRICTED_RECORD_READ]: "Ler registro de impedimentos para guarda responsable.",
    [PERMISSIONS.RESTRICTED_RECORD_WRITE]: "Registrar impedimento para guarda responsable.",
    [PERMISSIONS.AUDIT_READ]: "Ler trilha de auditoria.",
    [PERMISSIONS.EXPORT_SENSITIVE]: "Exportar dados que contenham dado pessoal.",
  };
  return d[key] ?? `Permissao ${key}.`;
}

/* -------------------------------------------------------- textos juridicos */

const LEGAL_TERMS = `## 1. Objeto

Este termo regula o uso da plataforma **Lages Protege Animais**, de uso público, que concentra denuncias de maus-tratos e abandono, resgates, adoções, anúncios de animais perdidos e encontrados, rede comunitária e o observatório municipal de proteção animal.

## 2. Natureza da plataforma

A plataforma é um **canal estruturado de denúncia e registro**, não um órgão de investigação, não um serviço de emergência e **não substitui os canais oficiais de urgência**.

Em situação de risco iminente, acione imediatamente:
- Emergências policiais;
- Disque-Denúncia 181;
- Unidades de saude e clinicas veterinárias;
- Órgão de proteção animal competente.

## 3. Cadastro

O cadastro exige e-mail, nome público e senha. **Não coletamos CPF de usuários comuns** sem necessidade definida. Confirme idade mínima aplicável.

## 4. Regras de conduta

É proibido:
- publicar dados pessoais de terceiros (telefone, endereço, documento, foto de documentos);
- usar rótulos acusatórios antes de decisão de órgão competente;
-icidal incitar violência, perseguição ou linchamento virtual;
- criar contas falsas, spam, fraude ou manipulação de números;
- anexar conteúdo ilegal, ou que exponha a integridade de crianças e adolescentes.

O sistema aplica filtro automático de assédio, doxxing e acusação sem lastro. O conteúdo é analisado por moderação humana, com registro de decisão e possibilidade de recurso.

## 5. Denúncias

- O envio de denúncia não implica culpa de quem é citado.
- A publicação de qualquer caso real **exige fonte verificável**.
- Sem confirmação oficial, o sistema exibe: **INFORMACAO PENDENTE DE VERIFICAÇÃO**.
- A precisão do mapa público é agregada, para proteger denunciantes e citados.

## 6. Adoções

O processo adota guarda responsável e **não cria critérios discriminatórios injustificados**. É vedado exigir renda, bairro, ou condição além do necessário para o bem-estar do animal.

## 7. Limitação de responsabilidade

O sistema é mantido por esforço comunitário e institucional. Não há garantia de atendimento integral de cada demanda, nem de prazo, que depende de capacidade dos órgãos competentes.

## 8. Foro

Legislação brasileira aplicável. Foro da comarca de **Lages/SC**.`;

const LEGAL_PRIVACY = `## 1. Controlador

**Lages Protege Animais** — plataforma municipal de proteção animal.
Canal de privacidade: \`privacidade@exemplo.gov.br\` (substituir pelo e-mail institucional oficial antes da publicação).

## 2. Base legal (Lei 13.709/2018 — LGPD)

| Dado | Finalidade | Base legal | Retenção |
|---|---|---|---|
| E-mail, nome público | Autenticação e exibição de autoria | Execução de contrato / legítimo interesse | Enquanto a conta existir + 6 meses |
| Denúncia (descrição, categoria) | Registro e encaminhamento de ocorrência | Cumprimento de dever legal / legítimo interesse | 5 anos após encerramento |
| Localização exata do relato | Atendimento pelo órgão competente | Legítimo interesse + dever legal | 5 anos |
| Evidências (fotos, vídeos) | Comprovação da ocorrência | Consentimento + dever legal | 5 anos |
| Dados de contato do denunciante | Comunicação sobre o andamento | Consentimento | 5 anos |
| Dados do citado na denúncia | Instrução e defesa | Legítimo interesse | Até decisão final + 5 anos |
| Registro de impedimentos (módulo restrito) | Proteção de terceiros | Cumprimento de decisão judicial/autoridade | Conforme vigência da decisão |
| Logs de auditoria | Prestação de contas e segurança | Obrigação legal | 5 anos |

## 3. Minimização

Coletamos apenas o necessário. **Nunca publicamos** coordenada exata de relato, nome de pessoa citada ou contato de terceiros em conteúdo público.

## 4. Direitos do titular (art. 18)

Você pode solicitar: confirmação; acesso; correção; anonimização; bloqueio; eliminação; portabilidade; informação sobre compartilhamento; revogação de consentimento; revisão de decisão automatizada.

Prazo de resposta: **15 dias** (art. 19).

Canal: use a área "Minha Conta > Privacidade" ou o e-mail do encarregado.

## 5. Compartilhamento

Dados são compartilhados apenas com:
- órgãos públicos competentes, quando necessário ao atendimento;
- entidades parceiras verificadas, no escopo do atendimento.

Nunca vendemos dados. Nunca usamos dados de denúncia para publicidade.

## 6. Segurança

Criptografia em trânsito (TLS) e em repouso para segredos; hash SHA-256 das evidências; controle de acesso por permissão; trilha de auditoria de acessos; 2FA para equipe.

## 7. Incidentes

Incidente de segurança é registrado, contención e comunicado aos titulares afetados e à ANPD quando cabível.`;

const LEGAL_COOKIES = `## Cookies — política

A plataforma usa **apenas cookies essenciais**. Não há cookie de publicidade, de rastreamento de terceiros ou de perfilamento comportamental.

| Cookie | Finalidade | Duração | Tipo |
|---|---|---|---|
| \`lpa_at\` | Sessão autenticada (token de acesso) | 15 min | Essencial, httpOnly, SameSite=Lax |
| \`lpa_rt\` | Rotação de sessão (token de renovação) | 30 dias | Essencial, httpOnly, SameSite=Strict |
| \`lpa_csrf\` | Proteção CSRF | Sessão | Essencial |

## Sem cookies, a plataforma ainda funciona?

Sim. As áreas públicas — denúncia, mapa público, adoção, perdidos e encontrados — funcionam integralmente sem autenticação.

## Como recusar

Recusar cookies essenciais impede apenas o acesso a áreas autenticadas. Não há impacto no conteúdo público.`;

const LEGAL_RETENTION = `## Política de retenção e eliminação

| Categoria | Retenção | Base |
|---|---|---|
| Conta de usuário inativa | 24 meses | Inatividade |
| Denúncia encerrada | 5 anos | Prescrição administrativa/forense |
| Evidência de denúncia | 5 anos | Igual à denúncia |
| Sessões de login | 30 dias (ou até revogação) | Segurança |
| Logs de auditoria | 5 anos | Prestação de contas |
| Logs de sistema | 12 meses | Operação |
| Tokens de uso único | Conforme expiração (15 min a 24 h) | Segurança |
| Registro de impedimentos | Conforme vigência da decisão + 5 anos | Ordem judicial |
| Contatos oficiais | 6 meses após última verificação | Informação pública |
| Exportações | 5 anos | Rastreabilidade |

**Eliminação** é física (remoção do registro e do arquivo) ao fim do prazo, salvo obrigação legal de guarda. Dados anonimizados podem ser mantidos indefinidamente por nao constituirem dado pessoal.`;

async function main() {
  console.log("LAGES PROTEGE ANIMAIS — seed");
  await seedRbac();
  await seedSla();
  await seedNeighborhoods();
  await seedCommunities();
  await seedOfficialContacts();
  await seedLegalDocuments();
  await seedEducational();
  await seedAdmin();
  console.log("Concluido.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });