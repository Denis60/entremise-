import Link from "next/link";

export const metadata = { title: "Confidentialité & RGPD — Entremise" };

export default function Confidentialite() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Politique de confidentialité
      </h1>
      <p className="mt-4 text-stone-600">
        La confidentialité n&apos;est pas une page légale chez Entremise :
        c&apos;est le cœur du produit. Voici, en clair, ce que nous collectons,
        pourquoi, et vos droits.
      </p>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          Responsable de traitement
        </h2>
        <p>
          Memorandum SARL, 1 route de Veillard, 16200 Bourg-Charente —
          représentée par Denis Oblin, gérant. Contact pour toute question ou
          exercice de droits :{" "}
          <a
            href="mailto:denis.oblin@memorandum-ai.com"
            className="text-amber-700 underline"
          >
            denis.oblin@memorandum-ai.com
          </a>{" "}
          (réponse sous 30 jours au plus).
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          Données collectées et finalités
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Données de compte</strong> (e-mail, SIRET, raison sociale,
            description d&apos;activité, chiffre d&apos;affaires déclaré) :
            création du profil, éligibilité aux sollicitations filtrées.
          </li>
          <li>
            <strong>Contenus des projets</strong> (besoins exprimés,
            conversations, contributions) : fourniture du service —
            maturation du besoin, sollicitation anonymisée du marché, mise en
            relation. Jamais divulgués, jamais exploités commercialement.
          </li>
          <li>
            <strong>Notifications</strong> (e-mail) : alertes lors de la
            réception d&apos;un message.
          </li>
          <li>
            <strong>Statistiques agrégées et anonymisées</strong> :
            observatoire des tendances du territoire. Aucune donnée
            individuelle n&apos;y est identifiable.
          </li>
        </ul>
        <p>
          Base légale : exécution du contrat d&apos;utilisation (fourniture du
          service) et intérêt légitime (sécurité, statistiques anonymes). Pas
          de prospection, pas de revente de données, pas de cookies
          publicitaires — uniquement des cookies techniques de session.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">Sous-traitants</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Supabase — base de données, hébergée en France (Paris, eu-west-3) ;</li>
          <li>Vercel Inc. (États-Unis) — hébergement du site ;</li>
          <li>
            Anthropic (États-Unis) — traitement IA des conversations, encadré
            par des clauses contractuelles types ; aucune donnée n&apos;est
            utilisée pour entraîner des modèles ;
          </li>
          <li>Brevo (France) — envoi des e-mails d&apos;alerte.</li>
        </ul>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          Conservation et suppression
        </h2>
        <p>
          Vos projets peuvent être <strong>supprimés définitivement</strong> par
          vous-même, à tout moment, depuis l&apos;application (suppression en
          cascade, y compris chez les prestataires sollicités). Le compte est
          supprimé sur simple demande. En phase pilote, l&apos;ensemble des
          données d&apos;un utilisateur est effaçable sous 72 h sur demande.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez des droits d&apos;accès, de
          rectification, d&apos;effacement, de portabilité, de limitation et
          d&apos;opposition. Écrivez à{" "}
          <a
            href="mailto:denis.oblin@memorandum-ai.com"
            className="text-amber-700 underline"
          >
            denis.oblin@memorandum-ai.com
          </a>
          . Vous pouvez également saisir la CNIL (cnil.fr).
        </p>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        Voir aussi : <Link href="/mentions-legales" className="underline">Mentions légales</Link> ·{" "}
        <Link href="/cgu" className="underline">Conditions générales d&apos;utilisation</Link>
      </p>
    </main>
  );
}
