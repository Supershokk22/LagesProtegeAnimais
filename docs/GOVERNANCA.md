# GOVERNANÇA (§82, §83, §84, §85)

## 1. Papéis institucionais

| Papel | Responsabilidade | Quem ocupa |
|---|---|---|
| **Responsável institucional** | Aprova política de proteção animal, define SLA, presta contas à Câmara | Definir: Cobea / Secretaria de Meio Ambiente |
| **Encarregado (DPO)** | LGPD, direitos do titular, incidentes | Definir: nome + publicação |
| **Administradores** | Usuários, papéis, configurações | 2–3 pessoas |
| **Supervisores** | Publicação, verificação de fontes, SLA, verificação de NGOs | 1–2 pessoas |
| **Operadores** | Triagem, atendimento, encaminhamento | 3–6 pessoas |
| **Moderadores** | Comunidade, fila de moderação | 2–4 pessoas |
| **Auditores** | Leitura, exportação registrada | 1 pessoa (independente) |

> **PENDENTE DE VERIFICAÇÃO OFICIAL** — a instituição deve nomear as pessoas e registrar aqui.

## 2. Matriz RACI

R=Responsável · A=Aprova · C=Consultado · I=Informado

| Atividade | Instituição | Supervisor | Operador | Moderador | Auditor | Administrador |
|---|---|---|---|---|---|---|
| Triagem de denúncia | A | A | R | I | I | I |
| Decisão de urgência | I | A | R | — | I | I |
| Encaminhamento a órgão | A | C | R | — | I | I |
| Publicação de caso | I | **A/R** | C | — | C | I |
| Verificação de fonte | I | **A/R** | C | — | C | I |
| Verificação de ONG/protetor | I | A | C | — | C | R |
| Verificação de contato oficial | A | **R** | C | — | C | I |
| Moderação de conteúdo | I | I | I | **A/R** | C | C |
| Resposta a incidente de segurança | A | R | I | I | C | R |
| Solicitação LGPD (titular) | I | I | C | — | C | **A/R** |
| Registro de impedimento | A | C | — | — | C | **R** |
| Exportação de dados | I | A | C | — | C | R |
| Relatório institucional | A | **R** | C | — | C | I |
| Execução do backup | A | I | — | — | C | **R** |

**Conflito de interesse:** quem **verifica** fonte não pode ser quem **decide** publicar caso que
depende dessa fonte sem segunda checagem de supervisor.

## 3. SLA (§84, §85)

Os tempos **não são inventados por esta plataforma**. O seed cria as políticas como *estrutura*
com `defined_by_org = NULL`. O órgão competente deve definir e registrar.

| Prioridade | 1ª resposta | Resolução | Base |
|---|---|---|---|
| Crítica | 1 h útil | 24 h | Estrutura — **a definir** |
| Urgente | 4 h úteis | 3 dias úteis | Estrutura — **a definir** |
| Alta | 24 h | 7 dias úteis | Estrutura — **a definir** |
| Moderada | 3 dias úteis | 15 dias úteis | Estrutura — **a definir** |
| Baixa | 7 dias úteis | 30 dias úteis | Estrutura — **a definir** |

`addSlaMinutes()` trata fim de semana (09:00–17:00, UTC−3). **Feriados** exigem calendário
oficial — a implementar.

## 4. Painel de SLA

`/admin/sla` exibe: prazo, casos atrasados, tempo médio, fila, responsável. Métricas:
- **Atraso:** casos abertos além do prazo.
- **Tempo médio de 1ª resposta:** `firstResponseAt − createdAt`.
- **Tempo médio de resolução:** `closedAt − createdAt`.

## 5. Separação de poderes

| Papel | Escreve? | Pode ver PII? | Pode publicar? | Acesso restrito? |
|---|---|---|---|---|
| OPERADOR | Sim | Sim | Não | Não |
| SUPERVISOR | Sim | Sim | **Sim** | **Leitura** |
| ADMIN | Sim | Sim | Não | Não |
| **AUDITOR** | **NÃO** | **NÃO** | Não | Não |
| SUPER_ADMIN | Sim | Sim | Não | **Sim** |

Implicação: `AUDITOR` não pode ser o mesmo servidor que opera. Se a equipe for pequena, a
instituição deve aceitar esse risco **de forma explícita e registrada**.

## 6. Ciclos de revisão

| Revisão | Frequência | Responsável |
|---|---|---|
| Verificação de contatos oficiais | 6 meses | Operador designado |
| Verificação de ONGs/protetores | 12 meses | Supervisor |
| Revisão da matriz de permissões | 6 meses | Administrador + Administrador |
| Revisão de retenção e eliminação | 12 meses | Administrador |
| Teste de restauração de backup | Mensal | Administrador |
| Revisão de dependências (audit) | Trimestral | Desenvolvedor |
| Revisão metodológica do observatório | 12 meses | Supervisor |

## 7. Continuidade (§70)

**RPO:** 24 h sem WAL archiving; ~15 min com.
**RTO:** 4 h (dump completo); 1 h com PITR.

Runbook em `DEPLOY.md` §5. Teste de restauração **mensal e registrado** — backup não testado não
é backup.