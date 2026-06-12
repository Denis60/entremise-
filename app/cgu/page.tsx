import Link from "next/link";

export const metadata = { title: "Conditions générales d'utilisation — Entremise" };

export default function CGU() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-stone-500 hover:text-stone-900">
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Conditions générales d&apos;utilisation
      </h1>
      <p className="mt-4 text-sm text-stone-500">
        Version pilote — 12 juin 2026
      </p>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">1. Objet</h2>
        <p>
          Entremise est une place de marché B2B intermédiée par une IA, qui
          aide les entreprises à faire mûrir leurs besoins et les met en
          relation avec les prestataires pertinents du territoire. Le service
          est édité par Memorandum SARL (voir{" "}
          <Link href="/mentions-legales" className="underline">
            mentions légales
          </Link>
          ).
        </p>
        <p>
          <strong>Le service est en phase pilote</strong> : il est fourni
          gratuitement, à des fins d&apos;expérimentation. Les montants
          affichés (mise en relation, besoins payants) sont{" "}
          <strong>simulés</strong> et n&apos;entraînent aucun paiement réel.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          2. Inscription
        </h2>
        <p>
          L&apos;inscription est réservée aux professionnels (entreprises,
          collectivités, associations) disposant d&apos;un SIRET. L&apos;utilisateur
          garantit l&apos;exactitude des informations de son profil. Être
          « sollicitable » comme prestataire est un choix explicite et
          réversible.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          3. Engagement de confidentialité d&apos;Entremise
        </h2>
        <p>
          Entremise s&apos;engage à ne jamais divulguer, exploiter
          commercialement ou utiliser les contenus de vos projets à
          d&apos;autres fins que le service lui-même. Aucun besoin n&apos;est
          diffusé au marché sans votre validation explicite de la version
          anonymisée. La mise en contact n&apos;a lieu qu&apos;avec le
          consentement des deux parties. Seules des statistiques agrégées et
          anonymisées alimentent l&apos;observatoire territorial.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          4. Règles d&apos;usage
        </h2>
        <p>
          L&apos;utilisateur s&apos;engage à un usage loyal : besoins sincères,
          contributions professionnelles, pas de collecte d&apos;informations
          sur les autres utilisateurs, pas de contournement de
          l&apos;anonymisation. Entremise peut suspendre un compte en cas
          d&apos;abus.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          5. Responsabilité
        </h2>
        <p>
          Service expérimental fourni « en l&apos;état », sans garantie de
          disponibilité ni de résultat. Les suggestions de l&apos;IA sont des
          aides à la décision, pas des conseils professionnels ; les
          informations échangées entre utilisateurs relèvent de leur seule
          responsabilité. Entremise n&apos;est pas partie aux contrats conclus
          entre utilisateurs.
        </p>
      </section>

      <section className="mt-10 space-y-2 text-stone-700">
        <h2 className="text-xl font-semibold text-stone-900">
          6. Droit applicable
        </h2>
        <p>
          Les présentes CGU sont soumises au droit français. À défaut de
          résolution amiable, les tribunaux du ressort d&apos;Angoulême sont
          compétents.
        </p>
      </section>

      <p className="mt-10 text-sm text-stone-500">
        Voir aussi : <Link href="/mentions-legales" className="underline">Mentions légales</Link> ·{" "}
        <Link href="/confidentialite" className="underline">Politique de confidentialité</Link>
      </p>
    </main>
  );
}
