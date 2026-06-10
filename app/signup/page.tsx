"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // Si la confirmation e-mail est désactivée, une session existe déjà
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Vérifiez votre boîte mail</h1>
        <p className="mt-4 text-stone-600">
          Un lien de confirmation vient de vous être envoyé à{" "}
          <strong>{email}</strong>. Cliquez dessus pour activer votre compte,
          puis complétez le profil de votre entreprise.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link href="/" className="text-xl font-bold">
        entre<span className="text-amber-600">mise</span>
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">Créer un compte</h1>
      <p className="mt-2 text-sm text-stone-600">
        Un compte = une entreprise. Vous pourrez être tour à tour demandeur et
        prestataire.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="E-mail professionnel"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mot de passe (8 caractères min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-amber-600 py-2.5 font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer mon compte"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-amber-700 underline">
          Connexion
        </Link>
      </p>
    </main>
  );
}
