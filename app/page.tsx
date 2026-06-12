import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
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

      <section className="mt-12">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Ceci n&apos;est pas un annuaire ou une vitrine d&apos;entreprises.
          <br />
          <span className="mt-6 block">
            C&apos;est une place de marché B2B
            <br />
            intermédiée par une IA, qui
          </span>
          <span className="mt-6 block">
            <span className="text-amber-600">
              mobilise le marché pour mûrir vos besoins
            </span>{" "}
            <span className="text-stone-400">/</span>{" "}
            <span className="text-teal-700">
              vous connecte aux projets de votre territoire
            </span>
          </span>
        </h1>
        <p className="mt-6 text-lg text-stone-600">
          Décrivez votre besoin, même flou. L&apos;IA vous aide à le faire
          mûrir.
          <br />
          Quand vous le décidez — et seulement alors — elle sonde anonymement
          les prestataires pertinents du territoire. Leurs contributions ou
          leurs questions poursuivent la maturation de votre projet.
          <br />
          La mise en contact n&apos;a lieu qu&apos;avec le consentement des
          deux parties.
        </p>
        <div className="mt-8 flex gap-4">
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

      <section className="mt-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/bd-entremise.png"
          alt="Entremise en bande dessinée : Camille exprime un besoin flou, Plume l'hirondelle sonde anonymement le territoire, les experts locaux répondent, la rencontre a lieu."
          className="w-full rounded-2xl border border-stone-200"
        />
      </section>

      <footer className="mt-24 border-t border-stone-200 pt-6 text-sm text-stone-500">
        <p>
          Entremise — pilote Charente (Angoulême, Cognac). Concours « Les Idées
          Neuves » Crédit Mutuel Sud-Ouest.
        </p>
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/mentions-legales" className="hover:text-stone-900">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-stone-900">
            Confidentialité & RGPD
          </Link>
          <Link href="/cgu" className="hover:text-stone-900">
            CGU
          </Link>
          <a
            href="mailto:denis.oblin@memorandum-ai.com"
            className="hover:text-stone-900"
          >
            Contact
          </a>
        </p>
      </footer>
    </main>
  );
}
