"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewNeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");
    const { data, error } = await supabase
      .from("needs")
      .insert({ owner_id: user.id })
      .select("id")
      .single();
    setLoading(false);
    if (!error && data) router.push(`/needs/${data.id}`);
  }

  return (
    <button
      onClick={create}
      disabled={loading}
      className="rounded-xl bg-amber-600 px-5 py-2.5 font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
    >
      {loading ? "Création…" : "+ Nouveau besoin"}
    </button>
  );
}
