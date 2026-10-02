/**
 * ============================================================================
 * OPENAPI 3.1 (§52)
 * ============================================================================
 * Gerado a partir de uma unica fonte de verdade: este arquivo.
 * `npm run openapi` regenera public/openapi.json e valida coerencia.
 */
export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Lages Protege Animais — API",
    version: "1.0.0",
    description: [
      "API pública e institucional da plataforma municipal de proteção animal de Lages/SC.",
      "",
      "## Princípios da API",
      "",
      "- **Envelope uniforme**: sucesso `{ ok: true, data, meta }`; erro `{ ok: false, error: { code, message, details } }`.",
      "- **Erros por código**: nunca depender de texto de mensagem. Usar `error.code`.",
      "- **Sem PII em resposta pública**: coordenadas são agregadas e dados pessoais nunca são expostos sem permissão.",
      "- **Rate limit**: cada resposta traz `X-RateLimit-Limit` e `X-RateLimit-Remaining`.",
      "- **Autenticação**: cookie `httpOnly` (SameSite=Lax) para o portal; `Authorization: Bearer` para integrações servidor-a-servidor.",
      "",
      "## Precisão geográfica (§12)",
      "",
      "`EXATA` apenas para operadores com permissão `report:read_exact_location` e 2FA válido.",
      "`APROXIMADA` para usuários autorizados (ponto deslocado deterministicamente).",
      "`AGREGADA` público (centro da grade, exige n≥5 para aparecer).",
    ].join("\n"),
    contact: {
      name: "Lages Protege Animais",
      email: "PENDENTE DE VERIFICACAO OFICIAL",
    },
    license: { name: "Uso público institucional" },
  },
  servers: [
    { url: "https://{host}/api/v1", description: "Produção", variables: { host: { default: "lages-protege-animais.gov.br" } } },
    { url: "http://localhost:3000/api/v1", description: "Desenvolvimento" },
  ],
  tags: [
    { name: "Denúncias", description: "Registro, consulta e acompanhamento de denúncias (§7-§13)" },
    { name: "Mapa", description: "Camadas geográficas agregadas (§11)" },
    { name: "Autenticação", description: "Cadastro, sessão e 2FA (§15-§16)" },
    { name: "Animais", description: "Adoção, perdidos e encontrados (§21-§26)" },
    { name: "Observatório", description: "Indicadores agregados (§34-§36)" },
  ],
  paths: {
    "/reports": {
      get: {
        tags: ["Denúncias"],
        summary: "Lista ocorrências publicadas",
        description:
          "Retorna SOMENTE ocorrências com fonte verificável. Nunca retorna coordenada exata nem dado pessoal.",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
          { name: "category", in: "query", schema: { type: "string", enum: ["ABANDONO", "AGRESSAO", "ANIMAL_FERIDO", "DESCARTE_IRREGULAR_DE_CARCACAS", "OUTROS"] } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "neighborhoodId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        security: [],
        responses: {
          200: {
            description: "Lista paginada",
            headers: {
              "X-RateLimit-Limit": { schema: { type: "integer" } },
              "X-RateLimit-Remaining": { schema: { type: "integer" } },
              "X-Request-Id": { schema: { type: "string", format: "uuid" } },
            },
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReportListResponse" },
              },
            },
          },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
      post: {
        tags: ["Denúncias"],
        summary: "Registra denúncia",
        description: [
          "Aberta a terceiros. Não exige conta.",
          "",
          "**Urgência CRÍTICA/URGENTE** dispensa aceite de termo e reduz a exigência de contato (§99).",
          "",
          "A urgência retornada em `suggestedUrgency` é uma **sugestão do motor de triagem**. A urgência final é sempre definida por uma pessoa da equipe, com justificativa registrada.",
        ].join("\n"),
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReportCreate" },
              examples: {
                emergenciaCritica: {
                  summary: "Emergência — caminho reduzido",
                  value: {
                    category: "ANIMAL_FERIDO",
                    description: "Cão atropelado na entrada do bairro, sangrando e não se movimenta. Está na calçada desde a manhã.",
                    species: "CACAO",
                    animalCount: 1,
                    location: { lat: -27.8031, lng: -50.3122 },
                    locationPrecision: "EXATA",
                    locationReference: "Em frente ao posto de saúde",
                    urgency: "CRITICA",
                    isAnonymous: false,
                    contactPhone: "(49) 99999-0000",
                    termsAccepted: false,
                  },
                },
                abbreviada: {
                  summary: "Denúncia padrão",
                  value: {
                    category: "ABANDONO",
                    description: "Vários cachorros sem água e sem comida no terreno baldio há mais de dois dias.",
                    species: "CACAO",
                    animalCount: 4,
                    neighborhoodId: "0f0e9d1c-0000-0000-0000-000000000000",
                    urgency: "ALTA",
                    termsAccepted: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Denúncia registrada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { const: true },
                    data: {
                      type: "object",
                      properties: {
                        protocol: { type: "string", pattern: "^LPA-\\d{4}-\\d{6}$", examples: ["LPA-2026-000001"] },
                        status: { $ref: "#/components/schemas/ReportStatus" },
                        suggestedUrgency: { $ref: "#/components/schemas/Urgency" },
                        triage: {
                          type: "object",
                          properties: {
                            score: { type: "integer", minimum: 0, maximum: 100 },
                            factors: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  label: { type: "string" },
                                  points: { type: "integer" },
                                  evidence: { type: "string", description: "Texto lido por um humano na triagem." },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          422: { $ref: "#/components/responses/ValidationError" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/map": {
      get: {
        tags: ["Mapa"],
        summary: "Camadas do mapa público",
        description:
          "Retornaheatmap agregado (células com n≥5) e marcadores de perdidos, encontrados, adoção, ONGs e clínicas — todos já com precisão reduzida no servidor.",
        parameters: [
          { name: "layer", in: "query", schema: { type: "string", enum: ["heatmap", "markers", "both"], default: "both" } },
          { name: "minCount", in: "query", schema: { type: "integer", minimum: 1, maximum: 200, default: 5 } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        security: [],
        responses: {
          200: {
            description: "Camadas",
            content: { "application/json": { schema: { $ref: "#/components/schemas/MapResponse" } } },
          },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Cria conta",
        description:
          "Schema estrito: chaves desconhecidas são rejeitadas, o que impede coleta de CPF ou outros dados não necessários (§15). Resposta não confirma se o e-mail já existe.",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "publicName", "password", "termsAccepted", "privacyAccepted", "ageConfirmed"],
                additionalProperties: false,
                properties: {
                  email: { type: "string", format: "email" },
                  publicName: { type: "string", minLength: 2, maxLength: 80 },
                  displayName: { type: ["string", "null"], maxLength: 120 },
                  password: { type: "string", minLength: 12, description: "Requer maiúscula, minúscula, número e símbolo." },
                  city: { type: ["string", "null"], maxLength: 120 },
                  termsAccepted: { const: true },
                  privacyAccepted: { const: true },
                  ageConfirmed: { const: true },
                  captchaToken: { type: ["string", "null"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Conta criada (confirmação de e-mail pendente)" },
          422: { $ref: "#/components/responses/ValidationError" },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Autentica",
        description:
          "Mensagem de erro única para credencial errada, conta inexistente e e-mail não confirmado — impede enumeração de contas. Bloqueio progressivo por tentativas (4→5 min, 8→30 min, 13→2 h).",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  totpCode: { type: ["string", "null"], pattern: "^\\d{6}$" },
                  captchaToken: { type: ["string", "null"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Sessão criada (cookies `httpOnly` + token de acesso)" },
          401: {
            description: "Falha de autenticação",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                examples: {
                  invalida: { value: { ok: false, error: { code: "AUTH_INVALID_CREDENTIALS", message: "Credenciais invalidas." } } },
                  duasEtapas: { value: { ok: false, error: { code: "AUTH_2FA_REQUIRED", message: "Autenticacao em dois fatores necessaria." } } },
                  bloqueada: { value: { ok: false, error: { code: "AUTH_ACCOUNT_LOCKED", message: "Conta temporariamente bloqueada por tentativas de acesso." } } },
                },
              },
            },
          },
          429: { $ref: "#/components/responses/RateLimited" },
        },
      },
    },
    "/auth/logout": {
      post: { tags: ["Autenticação"], summary: "Encerra todas as sessões", security: [], responses: { 200: { description: "Sessões revogadas" } } },
    },
    "/official-contacts": {
      get: {
        tags: ["Autenticação"],
        summary: "Contatos oficiais",
        description:
          "Somente contatos com fonte. Sem `sourceUrl`, a resposta traz `verified: false` e o cliente DEVE exibir «PENDENTE DE VERIFICAÇÃO OFICIAL» em vez do número (§14).",
        security: [],
        responses: { 200: { description: "Lista" } },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "lpa_at" },
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    responses: {
      RateLimited: {
        description: "Limite de requisições excedido",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { ok: false, error: { code: "RATE_LIMIT_EXCEEDED", message: "Limite de requisicoes excedido. Tente novamente em instantes.", details: { retryAfterSec: 420 } } } } },
      },
      ValidationError: {
        description: "Dados inválidos",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" }, example: { ok: false, error: { code: "VALIDATION_ERROR", message: "Dados invalidos.", details: [{ path: "contactEmail", message: "Informe um e-mail para acompanhamento, ou marque como anonima.", code: "custom" }] } } } },
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        required: ["ok", "error"],
        properties: {
          ok: { const: false },
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: {
                type: "string",
                enum: [
                  "AUTH_INVALID_CREDENTIALS", "AUTH_ACCOUNT_LOCKED", "AUTH_2FA_REQUIRED", "AUTH_2FA_INVALID",
                  "AUTH_UNAUTHENTICATED", "AUTH_FORBIDDEN", "AUTH_SESSION_EXPIRED", "AUTH_PASSWORD_POLICY",
                  "REPORT_NOT_FOUND", "REPORT_PERMISSION_DENIED", "REPORT_INVALID_TRANSITION",
                  "REPORT_JUSTIFICATION_REQUIRED", "VALIDATION_ERROR", "NOT_FOUND", "CONFLICT",
                  "RATE_LIMIT_EXCEEDED", "UPLOAD_REJECTED", "UPLOAD_TOO_LARGE",
                  "EVIDENCE_INTEGRITY_FAILURE", "RESTRICTED_ACCESS", "SOURCE_NOT_VERIFIED",
                  "MAINTENANCE", "INTERNAL",
                ],
              },
              message: { type: "string" },
              details: {},
              requestId: { type: "string", format: "uuid" },
            },
          },
        },
      },
      Urgency: { type: "string", enum: ["BAIXA", "MODERADA", "ALTA", "URGENTE", "CRITICA"] },
      Precision: { type: "string", enum: ["EXATA", "APROXIMADA", "AGREGADA"] },
      ReportStatus: {
        type: "string",
        enum: [
          "RECEBIDA", "AGUARDANDO_TRIAGEM", "EM_TRIAGEM", "SOLICITANDO_INFORMACOES", "VALIDADA",
          "ENCAMINHADA", "EM_ATENDIMENTO", "EM_FISCALIZACAO", "EM_INVESTIGACAO",
          "AGUARDANDO_ORGAO_RESPONSAVEL", "ATENDIDA", "PROCEDENTE", "IMPROCEDENTE",
          "ARQUIVADA", "REABERTA", "FINALIZADA",
        ],
      },
      ReportCreate: {
        type: "object",
        required: ["category", "description"],
        properties: {
          category: {
            type: "string",
            enum: [
              "ABANDONO", "AGRESSAO", "NEGLIGENCIA", "FALTA_DE_AGUA", "FALTA_DE_ALIMENTO",
              "CONFINAMENTO_INADEQUADO", "ANIMAL_FERIDO", "ATROPELAMENTO", "SITUACAO_DE_RISCO",
              "CRIACAO_IRREGULAR", "ACUMULACAO", "ANIMAL_PRESO", "AUSENCIA_DE_ATENDIMENTO_VETERINARIO",
              "DESCARTE_IRREGULAR_DE_CARCACAS", "OUTROS",
            ],
          },
          description: { type: "string", minLength: 20, maxLength: 8000, description: "Rejeita CPF e telefone de terceiros para reduzir exposição (§2)." },
          species: { type: ["string", "null"], enum: ["CACAO", "GATO", "EQUINO", "BOVINO", "CAPRINO", "OVINO", "AVE", "ROEDOR", "PEIXE", "REPTIL", "OUTRO", null] },
          animalCount: { type: "integer", minimum: 1, maximum: 1000, default: 1 },
          occurredAt: { type: ["string", "null"], format: "date-time" },
          occurredTime: { type: ["string", "null"], pattern: "^\\d{2}:\\d{2}$" },
          neighborhoodId: { type: ["string", "null"], format: "uuid" },
          location: { oneOf: [{ $ref: "#/components/schemas/LatLng" }, { type: "null" }] },
          locationPrecision: { $ref: "#/components/schemas/Precision" },
          locationReference: { type: ["string", "null"], maxLength: 240 },
          urgency: { $ref: "#/components/schemas/Urgency" },
          isAnonymous: { type: "boolean", default: false },
          contactName: { type: ["string", "null"], maxLength: 120 },
          contactEmail: { type: ["string", "null"], format: "email" },
          contactPhone: { type: ["string", "null"] },
          witnessCount: { type: "integer", minimum: 0, maximum: 500, default: 0 },
          observations: { type: ["string", "null"], maxLength: 4000 },
          animalIds: { type: "array", items: { type: "string", format: "uuid" }, maxItems: 20 },
          evidenceIds: { type: "array", items: { type: "string", format: "uuid" }, maxItems: 10 },
          captchaToken: { type: ["string", "null"] },
          termsAccepted: { type: "boolean", description: "Obrigatório fora de emergência." },
        },
      },
      ReportListResponse: {
        type: "object",
        properties: {
          ok: { const: true },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                protocol: { type: "string" },
                category: { type: "string" },
                status: { $ref: "#/components/schemas/ReportStatus" },
                summary: { type: "string", description: 'Texto público revisado ou "INFORMACAO PENDENTE DE VERIFICACAO".' },
                species: { type: ["string", "null"] },
                animalCount: { type: "integer" },
                location: {
                  type: ["object", "null"],
                  properties: {
                    lat: { type: "number" },
                    lng: { type: "number" },
                    precision: { $ref: "#/components/schemas/Precision" },
                  },
                },
                publishedAt: { type: ["string", "null"], format: "date-time" },
                officialSource: { type: ["string", "null"] },
                sources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      sourceOrg: { type: "string" },
                      sourceUrl: { type: ["string", "null"], format: "uri" },
                      documentDate: { type: ["string", "null"], format: "date" },
                      consultedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
          meta: {
            type: "object",
            properties: {
              requestId: { type: "string" },
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
            },
          },
        },
      },
      LatLng: {
        type: "object",
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", minimum: -28.9, maximum: -27.3, description: "Limitado à Serra Catarinense." },
          lng: { type: "number", minimum: -50.9, maximum: -49.7 },
        },
      },
      MapResponse: {
        type: "object",
        properties: {
          ok: { const: true },
          data: {
            type: "object",
            properties: {
              period: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } } },
              center: { $ref: "#/components/schemas/LatLng" },
              precisionNotice: { type: "string" },
              heatmap: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string" },
                    category: { type: "string" },
                    status: { type: "string" },
                    period: { type: "string" },
                    count: { type: "integer" },
                    lat: { type: "number" },
                    lng: { type: "number" },
                    precision: { const: "AGREGADA" },
                  },
                },
              },
              markers: { type: "array", items: { $ref: "#/components/schemas/MapMarker" } },
            },
          },
        },
      },
      MapMarker: {
        type: "object",
        properties: {
          id: { type: "string" },
          kind: { type: "string", enum: ["REPORT", "ANIMAL", "LOST", "FOUND", "ORG", "CLINIC", "EVENT"] },
          label: { type: "string" },
          meta: { type: "string" },
          lat: { type: "number" },
          lng: { type: "number" },
          precision: { $ref: "#/components/schemas/Precision" },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { bearerAuth: [] }],
} as const;