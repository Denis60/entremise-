"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/lib/types";

export default function Nav() {
  const router = useRouter();
  const supabase = createClient();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    setNotifs((data as Notification[]) ?? []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = notifs.filter((n) => !n.read_at).length;

  async function markRead() {
    setOpen(!open);
    if (!open && unread > 0) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      load();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/dashboard" className="text-lg font-bold">
          entre<span className="text-amber-600">mise</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-stone-100">
            Mes projets
          </Link>
          <Link href="/observatory" className="rounded-lg px-3 py-2 hover:bg-stone-100">
            Observatoire
          </Link>
          <Link href="/onboarding" className="rounded-lg px-3 py-2 hover:bg-stone-100">
            Profil
          </Link>
          <div className="relative">
            <button
              onClick={markRead}
              className="relative rounded-lg px-3 py-2 hover:bg-stone-100"
              aria-label="Notifications"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                  {unread}
                </span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
                {notifs.length === 0 && (
                  <p className="p-3 text-sm text-stone-500">
                    Aucune notification.
                  </p>
                )}
                {notifs.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? "#"}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg p-3 hover:bg-stone-50"
                  >
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">
                      {n.body}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className="rounded-lg px-3 py-2 text-stone-500 hover:bg-stone-100"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  );
}
