"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { REVENUE_BANDS } from "@/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    siret: "",
    company_name: "",
    activity_description: "",
    revenue_band: "",
    department: "16",
    city: "",
    certifications: "",
    reference_missions: "",
    is_solicitable: true,
  });
  const [existing, setExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setExisting(true);
        setForm({
          siret: data.siret,
          company_name: data.company_name,
          activity_description: data.activity_description,
          revenue_band: data.revenue_band ?? "",
          department: data.department ?? "16",
          city: data.city ?? "",
          certifications: (data.certifications ?? []).join(", "),
          reference_missions: data.reference_missions ?? "",
          is_solicitable: data.is_solicitable,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const payload = {
      id: user.id,
      siret: form.siret,
      company_name: form.company_name,
      activity_description: form.activity_description,
      revenue_band: form.revenue_band || null,
      department: form.department || null,
      city: form.city || null,
      certifications: form.certifications
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      reference_missions: form.reference_missions || null,
      is_solicitable: form.is_solicitable,
    };
    const { error } = await supabase.from("profiles").upsert(payload);
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const input =
    "w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm";

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold">
        {existing ? "Profil de l'entreprise" : "Bienvenue — votre entreprise"}
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        Ces informations servent uniquement de critères d&apos;éligibilité lors
        des sollicitations. Elles ne servent jamais à vendre de la visibilité.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            required
            placeholder="SIRET"
            value={form.siret}
            onChange={(e) => setForm({ ...form, siret: e.target.value })}
            className={input}
          />
          <input
            required
            placeholder="Raison sociale"
            value={form.company_name}
            onChange={(e) =>
              setForm({ ...form, company_name: e.target.value })
            }
            className={input}
          />
        </div>
        <textarea
          required
          rows={4}
          placeholder="Description de l'activité (sert au matching par pertinence : soyez précis sur vos savoir-faire)"
          value={form.activity_description}
          onChange={(e) =>
            setForm({ ...form, activity_description: e.target.value })
          }
          className={input}
        />
        <div className="grid grid-cols-3 gap-4">
          <select
            value={form.revenue_band}
            onChange={(e) =>
              setForm({ ...form, revenue_band: e.target.value })
            }
            className={input}
          >
            <option value="">Chiffre d&apos;affaires</option>
            {REVENUE_BANDS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <input
            placeholder="Département (ex. 16)"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className={input}
          />
          <input
            placeholder="Ville"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={input}
          />
        </div>
        <input
          placeholder="Certifications (séparées par des virgules) — optionnel"
          value={form.certifications}
          onChange={(e) =>
            setForm({ ...form, certifications: e.target.value })
          }
          className={input}
        />
        <textarea
          rows={2}
          placeholder="Missions de référence — optionnel"
          value={form.reference_missions}
          onChange={(e) =>
            setForm({ ...form, reference_missions: e.target.value })
          }
          className={input}
        />
        <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <input
            type="checkbox"
            checked={form.is_solicitable}
            onChange={(e) =>
              setForm({ ...form, is_solicitable: e.target.checked })
            }
            className="mt-1"
          />
          <span className="text-sm">
            <strong>Être sollicitable comme prestataire.</strong> Vous recevrez
            des besoins anonymisés jugés pertinents par l&apos;IA. Choix
            réversible à tout moment. Inscription et sollicitations gratuites.
          </span>
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-stone-900 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </main>
  );
}
