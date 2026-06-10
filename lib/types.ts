export type Profile = {
  id: string;
  siret: string;
  company_name: string;
  activity_description: string;
  revenue_band: string | null;
  department: string | null;
  city: string | null;
  certifications: string[];
  reference_missions: string | null;
  is_solicitable: boolean;
};

export type Need = {
  id: string;
  owner_id: string;
  title: string;
  status:
    | "maturing"
    | "disclosure_pending"
    | "soliciting"
    | "open_consultation"
    | "contact_requested"
    | "resolved"
    | "closed"
    | "abandoned";
  theme: string | null;
  need_summary: string | null;
  disclosed_version: string | null;
  disclosure_approved_at: string | null;
  filters: {
    department?: string;
    min_revenue_band?: string;
    certifications?: string[];
  };
  solicited_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  scope: "need" | "solicitation";
  role: "user" | "assistant" | "system" | "market";
  content: string;
  meta: { anon_label?: string; kind?: string; contribution_id?: string };
  created_at: string;
};

export type Solicitation = {
  id: string;
  need_id: string;
  provider_id: string;
  anon_label: string;
  status:
    | "pending"
    | "engaged"
    | "declined"
    | "contact_offered"
    | "contact_paid"
    | "closed";
  relevance_score: number | null;
  relevance_reason: string | null;
  is_best_contributor: boolean;
  identity_revealed_at: string | null;
  created_at: string;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export const REVENUE_BANDS = ["<100k", "100k-500k", "500k-2M", "2M-10M", ">10M"];

export const NEED_STATUS_LABELS: Record<string, string> = {
  maturing: "Maturation",
  disclosure_pending: "Divulgation à valider",
  soliciting: "Marché sollicité",
  open_consultation: "Consultation ouverte",
  contact_requested: "Mise en contact demandée",
  resolved: "Mise en relation réalisée",
  closed: "Clos",
  abandoned: "Abandonné",
};

export const SOL_STATUS_LABELS: Record<string, string> = {
  pending: "Nouvelle sollicitation",
  engaged: "En discussion",
  declined: "Déclinée",
  contact_offered: "Mise en relation proposée",
  contact_paid: "Mise en relation réalisée",
  closed: "Close",
};
