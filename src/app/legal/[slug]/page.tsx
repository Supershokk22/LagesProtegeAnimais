import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** §114: documentacao versionada. Cada doc tem versao e data de vigencia. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = await prisma.legalDocument.findFirst({
    where: { slug, isCurrent: true },
    select: { title: true, summary: true, version: true },
  });
  if (!doc) return { title: "Documento nao encontrado" };
  return { title: `${doc.title} (v${doc.version})`, description: doc.summary ?? undefined };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await prisma.legalDocument.findFirst({
    where: { slug, isCurrent: true },
    select: { title: true, summary: true, body: true, version: true, effectiveAt: true, kind: true },
  });

  if (!doc) {
    return (
      <>
        <SiteHeader />
        <main id="conteudo" className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-verde-900">Documento nao encontrado</h1>
          <p className="mt-3 text-neutro-600">
            O documento juridico solicitado ainda nao foi publicado. Enquanto nao houver versao vigente
            aprovada, nada e exibido — preferimos ausencia a texto desatualizado.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-10">
        <article>
          <p className="text-sm font-semibold uppercase tracking-widest text-verde-700">
            Versão {doc.version} · vigente desde {new Date(doc.effectiveAt).toLocaleDateString("pt-BR")}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-verde-900">{doc.title}</h1>
          {doc.summary && <p className="mt-3 text-lg text-neutro-700">{doc.summary}</p>}

          <div className="mt-8 rounded-xl border border-neutro-300 bg-white p-6">
            <Markdown source={doc.body} />
          </div>

          <p className="mt-6 text-sm text-neutro-600">
            Este documento tem controle de versão. Alterações registram a versão anterior em arquivo e
            a data de início de vigência de cada uma. O aceite da versão vigente é registrado
            individualmente para fins de conformidade.
          </p>
          <p className="mt-2 text-sm text-neutro-500">
            <strong>Atenção:</strong> os dados de contato do controlador (encarregado/DPO, endereço
            institucional e e-mail) estão marcados como pendentes de verificação oficial e devem ser
            preenchidos pela instituição antes da publicação em produção.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Renderizador de Markdown mínimo e sem dependência externa.
 * Sanitizado: escapa TODO o HTML antes de aplicar formatação, eliminando
 * XSS armazenado vindo do banco (defesa em profundidade, §43).
 */
function Markdown({ source }: { source: string }) {
  const lines = source.split("\n");
  const out: React.ReactNode[] = [];
  let list: string[] = [];

  const flush = (key: string) => {
    if (!list.length) return;
    out.push(
      <ul key={key} className="my-4 list-disc space-y-1.5 pl-6 text-neutro-700">
        {list.map((li, i) => (
          <li key={i}>{inline(li)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      i++;
      continue;
    }

    if (/^#{1,4}\s+/.test(line)) {
      flush(`l${i}`);
      const level = line.match(/^#+/)!.length;
      const text = line.replace(/^#+\s+/, "");
      const sizes = ["text-2xl", "text-xl", "text-lg", "text-base"];
      out.push(
        <h2 key={i} className={`${sizes[level - 1]} mt-6 mb-2 font-bold text-verde-900`}>
          {inline(text)}
        </h2>,
      );
      i++;
      continue;
    }

    if (/^\|/.test(line)) {
      flush(`l${i}`);
      const rows: string[][] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      const [head, ...body] = rows.filter((r) => !r.every((c) => /^-+$/.test(c)));
      out.push(
        <div key={`t${i}`} className="my-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutro-300">
                {head?.map((h, j) => (
                  <th key={j} className="py-2 pr-4 font-bold text-neutro-900">{inline(h)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutro-100">
              {body.map((r, j) => (
                <tr key={j}>
                  {r.map((c, k) => (
                    <td key={k} className="py-2 pr-4 align-top text-neutro-700">{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (line.trim() === "") {
      flush(`l${i}`);
      i++;
      continue;
    }

    flush(`l${i}`);
    out.push(
      <p key={i} className="my-3 leading-relaxed text-neutro-700">
        {inline(line)}
      </p>,
    );
    i++;
  }
  flush("last");

  return <div>{out}</div>;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function inline(s: string): React.ReactNode {
  const safe = esc(s);
  const parts = safe.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-neutro-100 px-1 py-0.5 font-mono text-[0.9em]">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}