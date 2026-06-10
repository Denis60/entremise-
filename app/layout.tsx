import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Entremise — l'IA qui fait mûrir les besoins du territoire",
  description:
    "Plateforme d'intermédiation économique régionale par IA. Ce n'est pas un annuaire : c'est une IA qui fait mûrir les besoins et révèle les solutions du territoire.",
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
