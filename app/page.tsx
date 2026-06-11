import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">
          entre<span className="text-amber-600">mise</span>
        </span>
        <nav className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-100"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
          >
            Inscrire mon entreprise
          </Link>
        </nav>
      </header>

      <section className="mt-24">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Ceci n&apos;est pas un annuaire
          <br />
          ou une vitrine d&apos;entreprises.
          <br />
          C&apos;est une place de marché intermédiée par une IA,
          <br />
          qui aide à mûrir les besoins
          <br />
          et révèle les solutions du territoire.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-stone-600">
          Décrivez votre besoin, même flou. L&apos;IA vous aide à le faire
          mûrir. Quand vous le décidez — et seulement alors — elle sonde
          anonymement les prestataires pertinents du territoire. La mise en
          contact n&apos;a lieu qu&apos;avec le consentement des deux parties.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/signup"
            className="rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-500"
          >
            Exprimer un besoin
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-stone-300 px-6 py-3 font-semibold hover:bg-stone-100"
          >
            Devenir sollicitable
          </Link>
        </div>
      </section>

      <section className="mt-24 grid gap-6 sm:grid-cols-3">
        {[
          {
            t: "Le besoin d'abord",
            d: "Toutes les plateformes partent de l'offre. Entremise part de votre besoin, même embryonnaire — sans formulaire, en conversation.",
          },
          {
            t: "Confidentialité graduée",
            d: "Rien ne sort sans votre validation explicite. Anonymat préservé jusqu'à accord mutuel, garanti par contrat.",
          },
          {
            t: "Aucune visibilité achetée",
            d: "Pas de premium, pas de mise en avant payante. Le seul filtre est la pertinence professionnelle.",
          },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-2xl border border-stone-200 bg-white p-6"
          >
            <h3 className="font-semibold">{c.t}</h3>
            <p className="mt-2 text-sm text-stone-600">{c.d}</p>
          </div>
        ))}
      </section>

      <footer className="mt-24 border-t border-stone-200 pt-6 text-sm text-stone-500">
        Entremise — pilote Charente (Angoulême, Cognac). Concours « Les Idées
        Neuves » Crédit Mutuel Sud-Ouest.
      </footer>
    </main>
  );
}
