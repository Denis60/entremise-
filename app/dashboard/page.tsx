import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import NewNeedButton from "@/components/NewNeedButton";
import { NEED_STATUS_LABELS, SOL_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/onboarding");

  const [{ data: needs }, { data: sols }, { data: quota }, { data: rep }, { data: credits }, { data: txs }] =
    await Promise.all([
      supabase.from("needs").select("*").order("created_at", { ascending: false }),
      supabase
        .from("solicitations")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("needs_quota").single(),
      supabase.from("demander_reputation").select("*").eq("owner_id", user.id).maybeSingle(),
      supabase.from("credits").select("*").eq("profile_id", user.id).is("used_at", null),
      supabase.from("transactions").select("*").eq("profile_id", user.id).order("created_at", { ascending: false }).limit(10),
    ]);

  const q = quota as { solicited_count: number; free_remaining: number } | null;

  const { data: adminRow } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Projets en attente d'une réponse de l'utilisateur (dernier message ≠ lui)
  const needIds = (needs ?? []).map((n) => n.id);
  const solIds = (sols ?? []).map((s) => s.id);
  const lastNeedMsgs = needIds.length
    ? (await supabase.from("last_need_message").select("*").in("need_id", needIds)).data
    : [];
  const lastSolMsgs = solIds.length
    ? (await supabase.from("last_solicitation_message").select("*").in("solicitation_id", solIds)).data
    : [];
  const activeNeed = (s: string) => !["resolved", "closed", "abandoned"].includes(s);
  const needAwaiting = new Set(
    (lastNeedMsgs ?? []).filter((m: any) => m.role !== "user").map((m: any) => m.need_id)
  );
  const solAwaiting = new Set(
    (lastSolMsgs ?? []).filter((m: any) => m.role !== "user").map((m: any) => m.solicitation_id)
  );

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{profile.company_name}</h1>
            <p className="text-sm text-stone-500">
              {adminRow && (
                <Link href="/admin" className="mr-2 font-semibold text-amber-700 underline">
                  Administration
                </Link>
              )}
              {profile.is_solicitable
                ? "Sollicitable comme prestataire"
                : "Non sollicitable"}
              {" · "}
              {q ? `${q.free_remaining} besoin(s) gratuit(s) restant(s)` : ""}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Mes besoins */}
          <section>
            <h2 className="font-semibold text-stone-700">
              Mes besoins (demandeur)
            </h2>
            <div className="mt-3 space-y-3">
              {(needs ?? []).length === 0 && (
                <p className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
                  Aucun besoin pour l&apos;instant. Décrivez votre premier
                  besoin, même flou : l&apos;IA vous aidera à le faire mûrir,
                  sans aucune conséquence tant que vous ne décidez rien.
                </p>
              )}
              {(needs ?? []).map((n) => (
                <Link
                  key={n.id}
                  href={`/needs/${n.id}`}
                  className={`block rounded-xl border bg-white p-4 hover:border-amber-400 ${
                    needAwaiting.has(n.id) && activeNeed(n.status)
                      ? "border-amber-400"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={
                        needAwaiting.has(n.id) && activeNeed(n.status)
                          ? "font-bold"
                          : "font-medium"
                      }
                    >
                      {needAwaiting.has(n.id) && activeNeed(n.status) && (
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
                      )}
                      {n.title}
                    </p>
                    <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs">
                      {NEED_STATUS_LABELS[n.status] ?? n.status}
                    </span>
                  </div>
                  {n.theme && (
                    <p className="mt-1 text-xs text-stone-500">{n.theme}</p>
                  )}
                </Link>
              ))}
              <div className="pt-1">
                <NewNeedButton />
              </div>
            </div>
          </section>

          {/* Mes sollicitations */}
          <section>
            <h2 className="font-semibold text-stone-700">
              Sollicitations reçues (prestataire)
            </h2>
            <div className="mt-3 space-y-3">
              {(sols ?? []).length === 0 && (
                <p className="rounded-xl border border-dashed border-stone-300 p-6 text-sm text-stone-500">
                  {profile.is_solicitable
                    ? "Aucune sollicitation pour l'instant. L'IA vous contactera quand un besoin correspondra à votre activité."
                    : "Activez « sollicitable » dans votre profil pour recevoir des opportunités qualifiées, sans prospection."}
                </p>
              )}
              {(sols ?? []).map((s) => (
                <Link
                  key={s.id}
                  href={`/solicitations/${s.id}`}
                  className={`block rounded-xl border bg-white p-4 hover:border-amber-400 ${
                    solAwaiting.has(s.id) && ["pending", "engaged", "contact_offered"].includes(s.status)
                      ? "border-amber-400"
                      : "border-stone-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={
                        solAwaiting.has(s.id) && ["pending", "engaged", "contact_offered"].includes(s.status)
                          ? "font-bold"
                          : "font-medium"
                      }
                    >
                      {solAwaiting.has(s.id) &&
                        ["pending", "engaged", "contact_offered"].includes(s.status) && (
                          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
                        )}
                      Besoin anonymisé
                      {s.is_best_contributor && " ★"}
                    </p>
                    <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs">
                      {SOL_STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </div>
                  {s.relevance_reason && (
                    <p className="mt-1 line-clamp-2 text-xs text-stone-500">
                      Pertinence : {s.relevance_reason}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>

        {/* Réputation, crédits, transactions */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-700">
              Réputation demandeur
            </h3>
            {rep && rep.reliability_score !== null ? (
              <p className="mt-2 text-3xl font-bold">
                {rep.reliability_score}%
                <span className="ml-2 text-sm font-normal text-stone-500">
                  de demandes menées au bout
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-stone-500">
                Calculée à partir de 5 besoins présentés au marché
                {rep ? ` (${rep.needs_solicited}/5)` : " (0/5)"}.
                L&apos;exploration avec l&apos;IA ne compte pas.
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-700">
              Crédits de mise en relation
            </h3>
            <p className="mt-2 text-3xl font-bold">
              {(credits ?? []).length}
              <span className="ml-2 text-sm font-normal text-stone-500">
                crédit(s) gratuit(s)
              </span>
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Gagnés comme meilleur contributeur d&apos;un besoin clos.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-stone-700">
              Paiements (simulés — pilote)
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              Mises en relation (150 €) et besoins au-delà des 4 gratuits
              (50 €). Aucun paiement réel dans cette phase pilote.
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {(txs ?? []).length === 0 && (
                <li className="text-stone-500">Aucune.</li>
              )}
              {(txs ?? []).map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span className="text-stone-600">
                    {t.type === "contact_fee"
                      ? "Mise en relation"
                      : t.type === "need_fee"
                        ? "Besoin supplémentaire"
                        : "Newsletter"}
                  </span>
                  <span className="font-medium">
                    {t.status === "credited" ? "crédit" : `${t.amount_eur} €`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}
