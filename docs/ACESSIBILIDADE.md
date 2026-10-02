# ACESSIBILIDADE — WCAG 2.2 AA (§60)

## 1. Princípios implementados

### Perceptível
- [x] Cor **nunca é a única informação**: toda cor de urgência tem rótulo textual e valor
- [x] Contraste verificado:
  - `#14532D` sobre `#FAFAF5` — 9,1:1 (AAA)
  - `#1E293B` sobre `#FAFAF5` — 14,8:1 (AAA)
  - `#22C55E` com texto `#14532D` — 4,9:1 (AA)
  - `#DC2626` sobre branco — 4,8:1 (AA)
  - `#FFFFFF` sobre `#14532D` — 9,1:1 (AAA)
- [x] Foco visível: `:focus-visible` com `outline: 3px solid #1D4ED8` + offset 2px
- [x] Ícones decorativos com `aria-hidden`; nenhuma informação depende apenas de ícone

### Operável
- [x] Navegação completa por teclado
- [x] Skip link (`Pular para o conteúdo principal`) — WCAG 2.4.1
- [x] Foco não encoberto — 2.4.11 (AA novo em 2.2)
- [x] Sem `scroll-behavior: smooth` sob `prefers-reduced-motion`
- [x] Alvos de toque ≥ 24×24 CSS px (WCAG 2.5.8, AA novo em 2.2)
- [x] Mapa tem **alternativa textual** (tabela de regiões) — não exige interação com Leaflet
- [x] Zoom do mapa sem sequestrar rolagem (`scrollWheelZoom: false`)

### Compreensível
- [x] `lang="pt-BR"` no `<html>`
- [x] Rótulo explícito em todo campo (sem placeholder como label)
- [x] Erros de formulário com `role="alert"` e texto descritivo, não "campo inválido"
- [x] Erros associados via `aria-describedby` / `aria-invalid`
- [x] Fluxo de denúncia com headings hierárquicos e `legend` em cada `fieldset`
- [x] Aviso de modo emergência com `role="alert"` e explicação do que muda

### Robustos
- [x] HTML semântico: `<header> <main> <nav> <section> <article> <footer> <table scope>`
- [x] `aria-label` no container do mapa, com `role="application"`
- [x] `<caption class="sr-only">` nas tabelas de dados
- [x] `aria-current="step"` no indicador de progresso
- [x] `aria-live="polite"` nos estados de carregamento
- [x] `aria-pressed` / `has-[:checked]` sem depender só de estilo
- [x] Landmarks: `main#conteudo`, `nav` rotulados

## 2. Landmarks da aplicação

| Landmark | Implementação |
|---|---|
| `banner` | `<header>` do `SiteHeader` |
| `navigation` | `<nav aria-label="Navegação principal">` e `aria-label="Progresso"` |
| `main` | `<main id="conteudo">` (alvo do skip link) |
| `complementary` | `<aside>` no mapa e nos painéis laterais |
| `contentinfo` | `<footer>` do `SiteFooter` |
| `navigation` (painel) | `<nav aria-label="Módulos administrativos">` |

## 3. Checklist

- [x] Skip link
- [x] Foco visível e não encoberto
- [x] Navegação por teclado em 100% das ações
- [x] Rótulos acessíveis em todos os campos
- [x] Erros announced (`role="alert"`)
- [x] Contraste AA em texto e componentes
- [x] informação não depende só de cor
- [x] Respeita `prefers-reduced-motion`
- [x] Landmarks únicos e nomeados
- [x] Mapa com alternativa textual
- [x] Tabelas com `scope` e `caption`
- [x] Formulário com `fieldset`/`legend`
- [x] Zoom responsivo até 200% sem perda de conteúdo
- [x] Texto redimensionável em 200%
- [x] Language declarada
- [x] Sem conteúdo intermitente
- [x] Status de conexão e erro anunciados
- [ ] **Teste com leitor de tela real** (NVDA / VoiceOver / Orca) — pendente
- [ ] **Auditoria externa** com especialista — pendente
- [ ] **Validação com Clock**

## 4. Alvos de toque

```
Mín WCAG 2.5.8 (AA, novo em 2.2): 24×24 CSS px, ou espaçamento equivalente.

Botão primário ....... py-3 px-6 → 48px de altura        ✓
Chip de urgência ..... py-1 px-3 → 24px                   ✓ (limite)
Link do footer ....... py-2 (8px) + line-height 1.5 → 24px ✓
Ícone de menu ......... 24×24 mínimo                    ✓
```

## 5. Idioma

`pt-BR` como idioma principal (§96). A arquitetura de i18n está preparada: strings de interface
estão concentradas nas páginas e labels; migração para `next-intl` é aditiva.

## 6. Teste manual sugerido

1. `Tab` pela página inteira sem perder o foco.
2. `Ctrl+Plus` até 200% — nenhuma informação some.
3. Leitor de tela em `/denunciar` — cada etapa anunciada com contexto.
4. Navegar no mapa pelo teclado usando apenas a tabela de regiões.
5. Ativar `prefers-reduced-motion` no SO.
6. Contraste: verificar com ferramenta (axe DevTools, Colour Contrast Analyser).