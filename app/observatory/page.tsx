"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase/client";

type Row = {
  theme: string;
  needs_count: number;
  solicited_count: number;
  concluded_count: number;
  last_seen: string;
};

export default function ObservatoryPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [subscribed, setSubscribed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: sub }] = await Promise.all([
        supabase.rpc("get_observatory"),
        supabase.from("newsletter_subscriptions").select("active").maybeSingle(),
      ]);
      setRows((data as Row[]) ?? []);
      setSubscribed(!!sub?.active);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleNewsletter() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    if (subscribed) {
      await supabase
        .from("newsletter_subscriptions")
        .update({ active: false })
        .eq("profile_id", user.id);
      setSubscribed(false);
    } else {
      await supabase
        .from("newsletter_subscriptions")
        .upsert({ profile_id: user.id, active: true });
      await supabase.from("transactions").select("id").limit(0); // noop
      setSubscribed(true);
    }
  }

  const max = Math.max(1, ...rows.map((r) => r.needs_count));

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Observatoire du territoire</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Cartographie vivante des besoins de l&apos;économie locale —
          uniquement des statistiques agrégées et anonymisées. Le détail des
          projets n&apos;est jamais divulgué.
        </p>

        <div className="mt-8 space-y-3">
          {rows.length === 0 && (
            <p className="rounded-xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              Pas encore assez de besoins exprimés pour produire des tendances.
            </p>
          )}
          {rows.map((r) => (
            <div
              key={r.theme}
              className="rounded-xl border border-stone-200 bg-white p-4"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{r.theme}</span>
                <span className="text-stone-500">
                  {r.needs_count} besoin(s) · {r.solicited_count} présenté(s) au
                  marché · {r.concluded_count} abouti(s)
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full bg-amber-500"
                  style={{ width: `${(r.needs_count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-semibold">Newsletter tendances marché</h2>
          <p className="mt-1 text-sm text-stone-600">
            Recevez chaque mois les tendances agrégées du territoire
            (abonnement payant — simulé dans ce pilote).
          </p>
          {subscribed !== null && (
            <button
              onClick={toggleNewsletter}
              className={`mt-4 rounded-lg px-5 py-2 text-sm font-semibold ${
                subscribed
                  ? "border border-stone-300 text-stone-600 hover:bg-stone-50"
                  : "bg-amber-600 text-white hover:bg-amber-500"
              }`}
            >
              {subscribed ? "Se désabonner" : "S'abonner (simulé)"}
            </button>
          )}
        </div>
      </main>
    </>
  );
}
