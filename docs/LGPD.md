# LGPD — Lei 13.709/2018

## 1. Controlador e encarregado

| Item | Valor |
|---|---|
| Controlador | **PENDENTE DE VERIFICAÇÃO OFICIAL** — preencher com o órgão municipal |
| Encarregado (DPO) | **PENDENTE DE VERIFICAÇÃO OFICIAL** |
| Canal de privacidade | **PENDENTE DE VERIFICAÇÃO OFICIAL** |
| Prazo de resposta | 15 dias (art. 19, §3º) |

> A plataforma não exibe e-mail de encarregado inventado. Enquanto não houver o dado real, os
> documentos exibem o rótulo acima.

## 2. Princípios aplicados no código

**Privacy by Design (§45):** minimização implementada na validação — o schema de cadastro é
`.strict()` e rejeita chaves desconhecidas, o que **impede tecnicamente** coletar CPF (§15).
Geo-proteção elimina exposição por padrão. k-anonimato nas distribuições.

**Controle do titular (§47):** `privacy_requests` com tipo, prazo automático de 15 dias,
responsável, resposta e fechamento.necessário anexar comprovação de identidade.

**Consentimento versionado (§115):** `consent_records` grava `(tipo, versão, data, usuário, IP,
user-agent)`. Termos antigos permanecem no banco.

## 3. Matriz de dados

| Dado | Finalidade | Base legal | Retenção | Acesso | Eliminação |
|---|---|---|---|---|---|
| E-mail, nome público | Autenticação e autoria | Execução de contrato | Conta + 6 meses | Titular, equipe interna | Hard delete ao encerrar conta |
| Nome de exibição | Perfil comunitário | Consentimento | Conta + 6 meses | Público (sob pseudônimo) | Idem |
| Descrição da denúncia | Registro e encaminhamento | Dever legal | 5 anos | Operadores autorizados | Hard delete |
| **Coordenada exata** | Atendimento pelo órgão | Legítimo interesse + dever legal | 5 anos | `report:read_exact_location` + AAL2 | Hard delete |
| Coordenada agregada | Mapa público | Legítimo interesse | 5 anos | Público | Hard delete |
| Evidências | Comprovação | Consentimento + dever legal | 5 anos | `evidence:view_restricted` | Arquivo + registro |
| Contato do denunciante | Comunicação | Consentimento | 5 anos | Operadores | Hard delete |
| Dados do citado | Instrução e defesa | Legítimo interesse | Decisão + 5 anos | `report:view_pii` | Hard delete |
| Registro de impedimentos | Proteção de terceiros | Ordem judicial/autoridade | Vigência + 5 anos | `restricted:read` + motivo | Hard delete |
| Audit logs | Prestação de contas | Obrigação legal | 5 anos | `audit:read` | Hard delete |
| Login attempts | Segurança | Legítimo interesse | 12 meses | `systemlog:read` | Purge job |
| Sessões | Segurança | Legítimo interesse | 30 dias | Titular + admin | Auto |
| Exportações | Rastreabilidade | Obrigação legal | 5 anos | `audit:read` | Hard delete |
| Termos/políticas aceitos | Prova de conformidade | Obrigação legal | 5 anos | `audit:read` | Permanente |

## 4. Direitos do titular (§47)

Todos disponíveis sem custo, com canal na área "Minha Conta > Privacidade":

- Confirmação de tratamento
- Acesso aos dados
- Correção
- Anonimização
- Bloqueio e eliminação
- Portabilidade
- Eliminação de consentimentos
- Revisão de decisão automatizada
- Informação sobre compartilhamentos

## 5. Compartilhamento

Somente com órgãos públicos necessários ao atendimento e entidades parceiras verificadas, no
escopo. **Nunca** vendemos dados. **Nunca** usamos dados de denúncia para publicidade.

## 6. Incidentes (§116)

| Severidade | Ação |
|---|---|
| 1–2 (baixa) | Registro interno |
| 3 (média) | Contenção + avaliação de comunicação |
| 4 (alta) | Comunicação ao encarregado + titulares afetados |
| 5 (crítica) | Comunicação à ANPD conforme art. 48 |

Módulo `security_incidents` com status: Detectado · Em investigação · Contido · Resolvido ·
Encerrado. Campos `notifiedAnpd` e `notifiedTitulares` para comprovação.

## 7. Checklist LGPD

- [x] Matriz dado → finalidade → base → retenção documentada
- [x] Consentimento versionado e registrado
- [x] Titular com acesso, correção, portabilidade e eliminação
- [x] Minimização validada no schema (cadastro estrito)
- [x] Dado sensível (registro de impedimentos) com acesso restrito e auditado
- [x] Audit trail completo com redator de PII
- [x] Exportação registrada com justificativa
- [x] Política de retenção com eliminação real
- [x] Política de incidentes com comunicação à ANPD
- [x] Política de privacidade e termos versionados no banco
- [x] Revisão de decisão automatizada documentada (triagem é **sugestão**, decisão humana)
- [ ] **Encarregado nomeado e publicado**
- [ ] **E-mail institucional real no canal de privacidade**
- [ ] **Política de cookies revisto porAdvogado**
- [ ] **Relatório de RIPD (Relatório de Impacto) aprovado**

## 8. Decisões de LGPD que valem registro

**Triagem automatizada não é decisão automatizada.** O motor calcula sugestão e pergunta. A
responsabilidade é humana, registrada com justificativa. Isso émitigação de risco do art. 20.

**Anonimato na denúncia.** O campo `isAnonymous` impede que `authorName`/`authorEmail` sejam
vinculados ao protocolo. Ainda é pseudonimização (LGPD art. 13, §4), não anonimização — e o
sistema trata como tal.

**Mapa público.** Mesmo com agregação, um ponto de baixa contagem pode ser reidentificável. Daí o
k-anonimato (n<5 fundido). É mitigação, não garantia absoluta — registrado como limitação.

**Registro de impedimentos.** Base legal é ordem judicial/autoridade, não consentimento. Por isso
o acesso exige motivo escrito e gera auditoria sensível, para que o titular saiba, se exercer
direito de acesso, **quem** consultou **por quê**.