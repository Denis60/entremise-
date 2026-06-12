import Link from "next/link";

export const metadata = { title: "Mentions légales — Entremise" };

export default function MentionsLegales() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Mentions légales
      </h1>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">Éditeur du site</h2>
        <p>
          Le site Entremise est édité par <strong>Memorandum</strong>, société à
          responsabilité limitée (SARL) au capital de 10 000 €, immatriculée au
          RCS d&apos;Angoulême sous le numéro 818 096 992 (SIRET du siège :
          818&nbsp;096&nbsp;992&nbsp;00024, TVA intracommunautaire :
          FR92818096992).
        </p>
        <p>
          Siège social : 1 route de Veillard, 16200 Bourg-Charente, France.
        </p>
        <p>
          Directeur de la publication : Denis Oblin, gérant.
          <br />
          Contact :{" "}
          <a
            href="mailto:denis.oblin@memorandum-ai.com"
            className="text-amber-700 underline"
          >
            denis.oblin@memorandum-ai.com
          </a>
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133,
          Covina, CA 91723, États-Unis (vercel.com). Les données applicatives
          sont hébergées par Supabase dans la région Paris (eu-west-3, France).
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          Statut du service
        </h2>
        <p>
          Entremise est un <strong>démonstrateur en phase pilote</strong>,
          développé dans le cadre du concours « Les Idées Neuves » du Crédit
          Mutuel Sud-Ouest. Le service est gratuit et non commercial à ce
          stade ; les fonctions de facturation présentées sont simulées et
          n&apos;entraînent aucun paiement réel.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          Propriété intellectuelle
        </h2>
        <p>
          La marque « Entremise », le concept, les contenus et les éléments
          graphiques de ce site (dont le personnage Plume) sont la propriété de
          Memorandum. Toute reproduction sans autorisation est interdite.
        </p>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        Voir aussi : <Link href="/confidentialite" className="underline">Politique de confidentialité</Link> ·{" "}
        <Link href="/cgu" className="underline">Conditions générales d&apos;utilisation</Link>
      </p>
    </main>
  );
}
