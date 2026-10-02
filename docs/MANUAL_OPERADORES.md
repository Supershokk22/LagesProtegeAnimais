# MANUAL DO OPERADOR (§119)

## 1. Fluxo de uma denúncia

```
RECEBIDA → AGUARDANDO_TRIAGEM → EM_TRIAGEM → VALIDADA → ENCAMINHADA
   → EM_ATENDIMENTO / EM_FISCALIZACAO / EM_INVESTIGACAO
   → ATENDIDA → FINALIZADA
```

Exceções: `IMPROCEDENTE` (verificado, sem ocorrência), `ARQUIVADA` (sem movimento), `REABERTA`
(surgiu fato novo).

Transições inválidas são **rejeitadas pelo sistema** — não existe "pular" etapa.

## 2. Como analisar uma denúncia

### Passo 1 — Leia os fatos, não a opinião
A descrição é o que aconteceu. Separe fato de interpretação. Se o relato diz "abandono", confirme
os indicadores: há animal sem saída? sem água? há veículo ou entulho que sugira descarte?

### Passo 2 — Confira os fatores da triagem
O sistema calcula fatores com pontos. **Leia cada `evidence`** — é o texto que sustenta o peso.

### Passo 3 — Responda as perguntas
`questionsToHuman` é a lista do que precisa ser confirmado. Se não tem resposta, use
`SOLICITANDO_INFORMACOES` e contate o denunciante.

### Passo 4 — Decida a urgência
`decideTriage()` exige justificativa de 10+ caracteres. Seja específico:

- ❌ "urgente"
- ✅ "cachorro atropelado com sangramento ativo, sem tutor identificado no local; acionamento de
  resgate imediato"

### Passo 5 — Verifique se há caso similar
Chave de recorrência = bairro + categoria + célula de grade + mês. Se a chave já existe,
`occurrencesCount` > 1 indica **causa estrutural** — não é caso isolado. Isso muda a resposta:
em vez de socorrer, planejar ação de vistoria / apoio a ONG / sugestão de videomonitoramento.

## 3. Como alterar status

1. Abra a denúncia.
2. Escolha o novo status **na lista de transições válidas** (a UI só oferece as válidas).
3. Preencha a justificativa quando exigida (Improcedente, Procedente, Arquivada, Reaberta,
   Aguardando órgão).
4. O sistema grava `report_status_history` com autor, IP, data e status anterior.

**Nunca apague a denúncia.** Se duplicada, use *vincular duplicata* — a original permanece.

## 4. Como verificar fonte (§80)

Aceito, em ordem de preferência:

1. Prefeitura Municipal de Lages
2. Câmara Municipal de Vereadores
3. Polícia Civil / Polícia Militar Ambiental
4. Ministério Público de Santa Catarina
5. Tribunal de Justiça de SC
6. IBAMA / órgãos estaduais / federais
7. Imprensa confiável

Ao vincular:
- `sourceOrg` — nome do órgão
- `sourceUrl` — endereço verificável
- `sourceDoc` — número do BO, inquiry, ofício
- `documentDate` — data do documento
- `consultedAt` — quando você consultou

Só então marque `status = VERIFICADO`. **Publicação sem fonte verificada é bloqueada pelo
sistema.**

## 5. Quando Publishing é permitido

✅ Sempre que:
- Há fato consumado confirmado por órgão
- Existe número de procedimento
- A descrição pública está revisada

❌ Nunca:
- "Segundo relatos em grupos"
- Sem documento
- Baseada apenas em foto sem contexto

Enquanto não há confirmação, o sistema exibe **"INFORMACAO PENDENTE DE VERIFICAÇÃO"**.

## 6. Linguagem (§97)

| Não use | Use |
|---|---|
| "agressor" | "pessoa mencionada na denúncia" |
| "culpado" | "pessoa mencionada na denúncia" |
| "infrator" | "pessoa mencionada na denúncia" |
| "ladrão de animais" | "pessoa mencionada na denúncia" |

**Antes de decisão competente, ninguém é culpado.** Depois de decisão, cite o órgão e o número do
processo. A linguagem pública **é** proteção para o cidadão e para a pessoa citada.

## 7. Como moderar conteúdo

Fila em `/admin/moderacao`. Critérios:

**Remove:**
- Dado pessoal de terceiro (CPF, RG, telefone, endereço, foto de documento)
- Ameaça, incitação à violência
- Agressão verbal
- Acusação sem comprovação
- Spam, fraude, conta falsa
- Manipulação de números (criar caso artificial para forçar ação)

**Edita (não remove):**
- Não incluir nome no corpo do texto
- Falta de contexto
- Imagem sem legenda informativa

**Prioridade:** ameaça > doxxing > fraude > spam.

Toda decisão gera `moderation_actions` com autor, motivo, regra aplicada e **snapshot do conteúdo**.
Cidadão tem direito de recurso.

## 8. Como exportar relatório

1. `/admin/relatorios` → período e escopo.
2. A exportação é **registrada** em `export_logs` com autor, formato, filtros, quantidade de linhas,
   hash do arquivo e **justificativa**.
3. Exportação com dado pessoal exige `export:sensitive`.
4. O hash permite provar a integridade do que foi entregue.

## 9. Casos especiais

### Descarte de carcaça
1. **Não autorize remoção** antes de registro.
2. Acione Polícia Científica e a vigilância ambiental.
3. Registre a ocorrência com `DESCARTE_IRREGULAR_DE_CARCACAS`.
4. A triagem coloca o caso em piso `ALTA` automaticamente.
5. Documente: local, quantidade, estado, quem foi acionado, horário.

### Animal de grande porte
Verifique se a situação configura criação irregular ou conflito com propriedade. Não prometa
resgate se não há estrutura de transporte e abrigo.

### Recorrência alta no mesmo ponto
Um ponto com 5+ ocorrências não é acaso. Escale: proposta de vistoria, apoio a ONG para
monitoramento, moção de videomonitoramento, comunicação com a comunidade.

## 10. O que não fazer

- Não prometa resultado
- Não use o sistema para retaliação
- Não compartilhe dado de contato fora da equipe
- Não publique sem fonte
- Não apague denúncia
- Não use rótulo acusatório antes do órgão competente
- Não registre speculate em campo de texto livre