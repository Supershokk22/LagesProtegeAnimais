# MATERIAL INSTITUCIONAL — Câmara Municipal (§103, §105)

## 1. O problema

Lages registrou, em agosto de 2026, o achado de mais de 20 corpos de cães em sacos de lixo na
antiga BR-2, bairro Santa Clara. O caminho do caso foi registrado em boletim de ocorrência,
encaminhado ao Ministério Público e respondido pela Cobea (Centro de Bem-Estar Animal) e pela
Polícia Civil, com apoio da Polícia Militar Ambiental. A Associação Lageana de Proteção aos Animais
passou a demandar ação judicial. A Câmara apresentou moções para videomonitoramento e placas de
conscientização.

**O que o caso revela:** existe lei. A Lei 9.605/1998 (art. 32) e a Lei 14.064/2020 já preveem
reclusão de **2 a 5 anos** para maus-tratos contra cão ou gato, com aumento de pena de 1/6 a 1/3
se houver morte. Existe orçamento, existe órgão, existeongsão.

O que falta é o **trilho estruturado** entre o relato, a triagem, o encaminhamento e o resultado.
Hoje o atendimento depende de quem conhece quem, e a vizinhança crítica da BR-2 é conhecida por
ocorrência — não por dado.

## 2. A solução

Uma plataforma que:

- **Gera protocolo público** (`LPA-ANO-NNNNNN`) — o citizen sabe o que aconteceu.
- **Calcula a urgência por fatores objetivos** e escala para cima quando os fatos são graves.
- **Cronometra o atendimento** com SLA visível e painel de atraso.
- **Preserva a evidência** com hash SHA-256 — se a prova for alterada, o sistema abre incidente.
- **Não expõe ninguém**: coordenada exata só para operador autorizado, com auditoria.
- **Só publica caso com fonte verificável**.
- **Registra tudo**: cada acesso a dado sensível gera log com autor, motivo e horário.

## 3. O que já está construído

| Item | Status |
|---|---|
| Banco de dados | 73 tabelas · 131 índices · 137 relacionamentos |
| Motor de triagem | Funcionando, com pesos calibrados e perguntas para o humano |
| Geoproteção | 3 níveis, jitter determinístico, k-anonimato |
| Cadeia de evidências | Validação em 4 camadas + SHA-256 + incidente automático |
| RBAC | 13 papéis, 47 permissões, separação de poderes testada |
| Painel institucional | Fila priorizada por urgência e SLA |
| Observatório | KPIs, série temporal, mapa de calor |
| Transparência | Somente dados agregados; nada de dado pessoal |
| PWA | Instalável, funciona offline, rascunho não se perde |
| Testes | 37 testes de núcleo (triagem, geoproteção, estados, RBAC, matching) |
| Build de produção | 21 rotas · 103 kB de JS compartilhado · verde |

## 4. Impacto social esperado

**Medível, não prometido.** A plataforma permite medir, pela primeira vez de forma estruturada:

- Denúncias registradas por bairro, categoria e mês
- Tempo médio até a primeira resposta
- Tempo médio até a resolução
- Casos fora do prazo
- Recorrência por ponto (indica causa estrutural, não evento isolado)
- Efeitos de campanha (castração, vacinação) no volume de abandonos

**Limite honesto:** subnotificação é provável e não é medida. O número absoluto não é o
indicador de problema — **a tendência** e o **tempo de resposta** são.

## 5. Custo estimado por módulo

| Módulo | Horas | Observação |
|---|---|---|
| Fundação (banco, auth, RBAC, auditoria) | 320 | Já feito |
| Motor de denúncia + triagem + SLA | 200 | Já feito |
| Geoproteção + mapa | 120 | Já feito |
| Evidências | 100 | Falta antivírus |
| Painel institucional + observatório | 160 | Feito |
| Transparência + juridico | 60 | Feito |
| PWA + offline | 60 | Feito |
| Fase 2 (adoção, rede, ONGs) | 400 | A fazer |
| Fase 3 (relatórios, LGPD, tickets) | 300 | A fazer |
| Fase 4 (integrações, app) | 500+ | A fazer |

Custo de infraestrutura: VPS 4 GB ≈ R$ 60–120/mês, ou Vercel Hobby + banco gerenciado ≈ R$ 0–90/mês
na escala municipal. **O custo que mais pesa é operacional: uma pessoa dedicada ao atendimento.**

## 6. Fase 1 — implantação sugerida

| Semana | Ação |
|---|---|
| 1 | Nomear responsável institucional e encarregado; definir tempos de SLA |
| 2 | Verificar contatos oficiais contra as fontes; cadastrar bairros |
| 3 | Treinar 3–5 operadores; cadastrar 2–3 protetores/ONGs |
| 4 | Teste controlado com 20 denúncias reais; calibrar pesos de triagem |
| 5–6 | Abertura ao público; monitoramento diário de SLA |
| 7 | Primeira revisão de calibragem com base nos casos reais |
| 8 | Relatório de 30 dias para a Câmara |

## 7. Argumento institucional

**Transparência radical.** A plataforma é Auditável por desenho: cada acesso a dado sensível gera
log com autor e motivo. Qualquer cidadão pode ver quantos casos estão em atraso.

**Sem risco de linchamento.** O mapa público mostra região agregada, nunca o ponto do relato. Numa
cidade onde protetores já enfrentam agressão por publicar, isso não é detalhe técnico — é
condição para o sistema ser usado.

**Não cria ônus inventado.** O sistema não promete o que não controla. Não acelera resolução; ele dá
visibility, prioriza e cobra prazo. Quem resolve é o órgão, que é quem tem competência.

**Código aberto para a cidade.** A arquitetura permite migração para infraestrutura pública
(portal do município, Dataprev, Gov.br) sem reescrita.

## 8. Perguntas que a Câmara deve fazer

1. Quem é o responsável institucional pela operação diária?
2. Quais os tempos de SLA oficiais por prioridade?
3. Qual o procedimento quando o caso envolve risco à vida?
4. Quem responde pelos dados pessoais, e onde fica o encarregado?
5. Como os Voluntários de protetores serão habilitados?
6. Haverá dotação para a equipe de atendimento?

Sem resposta para (1) e (2), o sistema registra denúncias com muita eficiência e não as resolve —
e o caso de agosto prova que registro sem resultado é insuficiente.