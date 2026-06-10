"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError("Identifiants invalides ou e-mail non confirmé.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Link href="/" className="text-xl font-bold">
        entre<span className="text-amber-600">mise</span>
      </Link>
      <h1 className="mt-8 text-2xl font-semibold">Connexion</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <input
          type="email"
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-4 py-2.5"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-stone-900 py-2.5 font-medium text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-amber-700 underline">
          Inscrire mon entreprise
        </Link>
      </p>
    </main>
  );
}
