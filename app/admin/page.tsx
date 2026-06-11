import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import { NEED_STATUS_LABELS, SOL_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: companies, error } = await supabase.rpc("admin_companies");
  if (error) redirect("/dashboard"); // non admin
  const { data: sols } = await supabase.rpc("admin_solicitations");

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Administration</h1>
        <p className="mt-1 text-sm text-stone-500">
          Vue réservée aux administrateurs de la plateforme.
        </p>

        <h2 className="mt-10 font-semibold text-stone-700">
          Entreprises inscrites ({(companies ?? []).length})
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Entreprise</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Ville</th>
                <th className="px-4 py-3">Effectif</th>
                <th className="px-4 py-3">CA</th>
                <th className="px-4 py-3">Sollicitable</th>
                <th className="px-4 py-3">Besoins émis</th>
                <th className="px-4 py-3">Sollicitations reçues</th>
                <th className="px-4 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {(companies ?? []).map((c: any) => (
                <tr key={c.id} className="border-t border-stone-100">
                  <td className="px-4 py-3 font-medium">{c.company_name}</td>
                  <td className="px-4 py-3 text-stone-500">{c.email}</td>
                  <td className="px-4 py-3">{c.city ?? "—"}</td>
                  <td className="px-4 py-3">{c.headcount_band ?? "—"}</td>
                  <td className="px-4 py-3">{c.revenue_band ?? "—"}</td>
                  <td className="px-4 py-3">{c.is_solicitable ? "Oui" : "Non"}</td>
                  <td className="px-4 py-3">{c.needs_count}</td>
                  <td className="px-4 py-3">{c.solicitations_received}</td>
                  <td className="px-4 py-3">{fmt(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-10 font-semibold text-stone-700">
          Sollicitations — qui a été interrogé sur quoi ({(sols ?? []).length})
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase text-stone-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Prestataire interrogé</th>
                <th className="px-4 py-3">Pseudo</th>
                <th className="px-4 py-3">Besoin</th>
                <th className="px-4 py-3">Demandeur</th>
                <th className="px-4 py-3">Score IA</th>
                <th className="px-4 py-3">Contributions</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {(sols ?? []).map((s: any, i: number) => (
                <tr key={i} className="border-t border-stone-100">
                  <td className="px-4 py-3">{fmt(s.created_at)}</td>
                  <td className="px-4 py-3 font-medium">{s.provider}</td>
                  <td className="px-4 py-3 text-stone-500">{s.anon_label}</td>
                  <td className="px-4 py-3">
                    {s.need_title}
                    {s.theme && <span className="text-stone-400"> · {s.theme}</span>}
                    <span className="ml-1 text-xs text-stone-400">
                      ({NEED_STATUS_LABELS[s.need_status] ?? s.need_status})
                    </span>
                  </td>
                  <td className="px-4 py-3">{s.demander}</td>
                  <td className="px-4 py-3">{s.score != null ? `${s.score}%` : "—"}</td>
                  <td className="px-4 py-3">{s.contributions}</td>
                  <td className="px-4 py-3">{SOL_STATUS_LABELS[s.sol_status] ?? s.sol_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-stone-400">
          Rappel doctrine de confidentialité (§8) : cette vue interne sert à opérer le pilote.
          Le contenu des conversations n&apos;y est volontairement pas exposé.
        </p>
      </main>
    </>
  );
}
