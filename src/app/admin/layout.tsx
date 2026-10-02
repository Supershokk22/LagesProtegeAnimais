import "server-only";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { can, isRole } from "@/lib/auth/guards";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { SiteHeader, SiteFooter } from "@/components/layout/chrome";

export const dynamic = "force-dynamic";

/**
 * PAINEL ADMINISTRATIVO (§40)
 *
 * REGRA: o menu é montado a partir de PERMISSIONS, não de um array fixo.
 * Um módulo que o usuário não pode acessar NÃO RENDEREZA o link — mas o
 * endpoint continua protegido no servidor (defesa em profundidade: esconder o
 * botão nunca substitui a checagem de permissão).
 */
const MODULES = [
  { key: "dashboard", href: "/admin", label: "Dashboard", perm: PERMISSIONS.ANALYTICS_INTERNAL },
  { key: "denuncias", href: "/admin/denuncias", label: "Denúncias", perm: PERMISSIONS.REPORT_READ_INTERNAL },
  { key: "sla", href: "/admin/sla", label: "Painel de SLA", perm: PERMISSIONS.REPORT_READ_INTERNAL },
  { key: "animais", href: "/admin/animais", label: "Animais", perm: PERMISSIONS.ANIMAL_VIEW_INTERNAL },
  { key: "adocoes", href: "/admin/adocoes", label: "Adoções", perm: PERMISSIONS.ADOPTION_FOLLOWUP },
  { key: "perdidos", href: "/admin/perdidos", label: "Perdidos", perm: PERMISSIONS.MATCH_REVIEW },
  { key: "encontrados", href: "/admin/encontrados", label: "Encontrados", perm: PERMISSIONS.MATCH_REVIEW },
  { key: "usuarios", href: "/admin/usuarios", label: "Usuários", perm: PERMISSIONS.USER_MANAGE },
  { key: "ongs", href: "/admin/ongs", label: "ONGs", perm: PERMISSIONS.ORG_UPDATE },
  { key: "protetores", href: "/admin/protetores", label: "Protetores", perm: PERMISSIONS.ORG_UPDATE },
  { key: "veterinarios", href: "/admin/veterinarios", label: "Veterinários", perm: PERMISSIONS.ORG_UPDATE },
  { key: "comunidades", href: "/admin/comunidades", label: "Comunidades", perm: PERMISSIONS.COMMUNITY_MANAGE },
  { key: "publicacoes", href: "/admin/publicacoes", label: "Publicações", perm: PERMISSIONS.POST_MODERATE },
  { key: "moderacao", href: "/admin/moderacao", label: "Moderação", perm: PERMISSIONS.MODERATION_QUEUE },
  { key: "campanhas", href: "/admin/campanhas", label: "Campanhas", perm: PERMISSIONS.CONTENT_MANAGE },
  { key: "eventos", href: "/admin/eventos", label: "Eventos", perm: PERMISSIONS.CONTENT_MANAGE },
  { key: "contatos", href: "/admin/contatos", label: "Contatos oficiais", perm: PERMISSIONS.CONTACT_VERIFY },
  { key: "impedimentos", href: "/admin/impedimentos", label: "Impedimentos", perm: PERMISSIONS.RESTRICTED_RECORD_READ, restricted: true },
  { key: "relatorios", href: "/admin/relatorios", label: "Relatórios", perm: PERMISSIONS.ANALYTICS_INSTITUTIONAL },
  { key: "exportacoes", href: "/admin/exportacoes", label: "Exportações", perm: PERMISSIONS.EXPORT_RUN },
  { key: "importacoes", href: "/admin/importacoes", label: "Importações", perm: PERMISSIONS.IMPORT_RUN },
  { key: "privacidade", href: "/admin/privacidade", label: "LGPD", perm: PERMISSIONS.PRIVACY_REQUEST_HANDLE },
  { key: "incidentes", href: "/admin/incidentes", label: "Incidentes", perm: PERMISSIONS.INCIDENT_MANAGE },
  { key: "configuracoes", href: "/admin/configuracoes", label: "Configurações", perm: PERMISSIONS.SLA_MANAGE },
  { key: "papeis", href: "/admin/papeis", label: "Papéis e permissões", perm: PERMISSIONS.ROLE_MANAGE },
  { key: "logs", href: "/admin/logs", label: "Logs", perm: PERMISSIONS.SYSTEM_LOG_READ },
  { key: "auditoria", href: "/admin/auditoria", label: "Auditoria", perm: PERMISSIONS.AUDIT_READ },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();

  if (!user) {
    return (
      <>
        <SiteHeader />
        <main id="conteudo" className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="text-3xl font-black text-verde-900">Acesso restrito</h1>
          <p className="mt-3 text-neutro-600">
            O painel administrativo exige autenticação com perfil institucional autorizado.
          </p>
          <a href="/entrar" className="mt-6 inline-block rounded-lg bg-verde-900 px-5 py-3 text-sm font-bold text-white hover:bg-verde-700">
            Entrar
          </a>
        </main>
        <SiteFooter />
      </>
    );
  }

  const visible = MODULES.filter((m) => can(user, m.perm));

  return (
    <>
      <SiteHeader />
      <div className="mx-auto flex max-w-[1600px] gap-0">
        <aside className="sticky top-[92px] hidden h-[calc(100vh-92px)] w-64 shrink-0 overflow-y-auto border-r border-neutro-300 bg-white lg:block">
          <nav aria-label="Módulos administrativos" className="p-4">
            <p className="mb-1 px-2 text-xs font-bold uppercase tracking-widest text-neutro-500">Painel</p>
            <p className="mb-4 truncate px-2 text-sm font-semibold text-verde-900">{user.publicName}</p>
            <p className="mb-4 flex flex-wrap gap-1 px-2">
              {user.roles.map((r) => (
                <span key={r} className="rounded bg-neutro-100 px-1.5 py-0.5 text-[10px] font-bold text-neutro-700">
                  {r}
                </span>
              ))}
            </p>

            <ul className="space-y-0.5">
              {visible.map((m) => (
                <li key={m.key}>
                  <Link
                    href={m.href}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-verde-50 hover:text-verde-900 ${
                      m.restricted ? "text-vermelho" : "text-neutro-700"
                    }`}
                  >
                    {m.label}
                    {m.restricted && (
                      <span className="rounded bg-vermelho/15 px-1 py-0.5 text-[9px] font-black uppercase text-vermelho">
                        restrito
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {isRole(user, "AUDITOR") && (
              <p className="mt-6 rounded-md bg-azul-claro p-3 text-xs text-blue-900">
                <strong>Modo auditor:</strong> somente leitura. Exportações são registradas.
              </p>
            )}
          </nav>
        </aside>

        <main id="conteudo" className="min-w-0 flex-1 bg-creme p-5 lg:p-8">
          <div className="mb-5 flex flex-wrap gap-2 lg:hidden">
            {visible.map((m) => (
              <Link key={m.key} href={m.href} className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-neutro-700">
                {m.label}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </>
  );
}