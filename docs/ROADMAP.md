# ROADMAP (§104)

## FASE 1 — MVP (protocolo + geoespacial)

**Objetivo:** tirar a cidade do improviso. Um canal estruturado, do relato ao resultado.

| Entrega | Status |
|---|---|
| Cadastro e autenticação (e-mail, senha, confirmação, recuperação) | ✅ |
| Sessão com refresh rotativo + 2FA TOTP | ✅ |
| RBAC de 13 papéis com herança e 2FA obrigatório | ✅ |
| Denúncia em 7 etapas + modo emergência reduzido | ✅ |
| Protocolo `LPA-ANO-NNNNNN` | ✅ |
| Motor de triagem com sugestão + perguntas | ✅ |
| Máquina de 15 estados com justificativa obrigatória | ✅ |
| SLA estrutural com dias úteis | ✅ |
| Cadeia de evidências (magic bytes, SHA-256, custódia) | ✅ |
| Geoproteção em 3 níveis (exata/aproximada/agregada) | ✅ |
| Mapa Leaflet com heatmap e filtros | ✅ |
| Painel de transparência com k-anonimato | ✅ |
| Observatório com KPIs e série temporal | ✅ |
| Contatos oficiais com fonte obrigatória | ✅ |
| PWA instalável + offline | ✅ |
| Documentos jurídicos versionados | ✅ |
| Testes de núcleo (37) | ✅ |

**Fora do MVP (deixa para a Fase 2):** comunidade social, ONGs/protetores, adoção completa,
voluntariado.

## FASE 2 — Rede comunitária

| Entrega | Depende de | Complexidade |
|---|---|---|
| Adoption completa: página do animal, processo de 7 etapas, termo | Fase 1 | Alta |
| Acompanhamento pós-adoção (7/30/90/180 dias) | Fase 2 | Média |
| CRUD de animais pelo painel | Fase 1 | Média |
| CRUD de perdidos e encontrados + matching com revisão humana | Fase 1 | Alta |
| CRUD de ONGs/protetores com verificação documental | Fase 1 | Alta |
| Diretório de clínicas e veterinários | Fase 1 | Média |
| Comunidades (14) com regras e moderação | Fase 1 | Média |
| Posts, comentários, reações, seguir | Fase 2 | Média |
| Fila de moderação com recurso | Fase 2 | Média |
| Voluntariado com gating de risco | Fase 1 | Média |
| Campanhas e eventos | Fase 1 | Média |

## FASE 3 — Observatório e institucional

| Entrega | Complexidade |
|---|---|
| Painel da Câmara (série, distribuição, evolução, capacidade, gargalo) | Média |
| Relatório institucional automatizado (14 seções) | Média |
| Exportação PDF/CSV/XLSX com log e hash | Média |
| Importador validado com dry-run obrigatório | Alta |
| Central de fontes com status de verificação | Média |
| Registro de impedimentos (UI + justificativa obrigatória) | Alta |
| Solicitações LGPD (UI + fluxo de 15 dias) | Média |
| Módulo de incidentes de segurança (UI) | Média |
| Tickets internos | Média |
| Notificações (e-mail + push) | Média |
| Busca global sem vazamento de privado | Alta |
| Painel de auditoria | Média |

## FASE 4 — Integrações e escala

| Entrega | Complexidade |
|---|---|
| Integração com 1Doc / SEI (órgãos municipais) | Alta |
| Integração com o Ministério Público | Alta |
| Open data (datasets anonimizados + metodologia) | Média |
| App nativo Android | Alta |
| App nativo iOS | Alta |
| API pública documentada com chave de parceiro | Média |
| Calendário de feriados oficiais no SLA | Baixa |
| Antivírus no pipeline de upload | Média |
| Fila assíncrona para triagem em lote | Média |
| Observabilidade com tracing distribuído | Média |
| Migração para infraestrutura pública (portal do município) | Alta |

## Dependências críticas (nãoeguem por ordem de esforço)

1. **Nomeação institucional** — responsável, encarregado, equipe. Sem isso nada é operacional.
2. **Tempos oficiais de SLA** definidos pelo órgão.
3. **Verificação de contatos oficiais** contra a fonte.
4. **Antivírus** no upload antes de receber evidência real.
5. **Calendário de feriados** para o SLA ser honesto.
6. **Infraestrutura pública de identidade** (gov.br), se a instituição quiser single sign-on.

## Estimativa de esforço por fase

| Fase | Equipe | Duração |
|---|---|---|
| 1 | 2 devs | 3–4 meses |
| 2 | 2 devs | 3 meses |
| 3 | 1 dev | 3 meses |
| 4 | 2 devs | 4+ meses |

Estimativa estrutural. Depende de disponibilidade da equipe, daRapidez de resposta dos órgãos e
do anonimato dos dados reais para desenvolvimento.