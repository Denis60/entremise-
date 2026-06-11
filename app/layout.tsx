import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entremise — l'IA qui fait mûrir les besoins du territoire",
  description:
    "Plateforme d'intermédiation économique régionale. Ceci n'est pas un annuaire ou une vitrine d'entreprises : c'est une place de marché intermédiée par une IA, qui aide à mûrir les besoins et révèle les solutions du territoire.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
