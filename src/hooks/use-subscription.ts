import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "professional" | "company" | null;
export type SubscriptionStatus = "active" | "expired" | "free" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  role: UserRole;
  plan: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  isExpired: boolean;
  isFree: boolean;        // registered but no plan ever purchased
  daysRemaining: number | null;  // null if no active plan
  loading: boolean;
  refresh: () => void;
}

export function useSubscription(): SubscriptionInfo {
  const { user } = useAuth();
  const [data, setData] = useState<Omit<SubscriptionInfo, "loading" | "refresh">>({
    status: "none",
    role: null,
    plan: null,
    expiresAt: null,
    isActive: false,
    isExpired: false,
    isFree: false,
    daysRemaining: null,
  });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, subscription_status, subscription_plan, subscription_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      const expiresAt = profile.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : null;
      const now = new Date();
      const pastExpiry = expiresAt ? expiresAt < now : false;
      const raw = (profile.subscription_status as SubscriptionStatus) || "none";
      const role = (profile.role as UserRole) ?? null;

      let status: SubscriptionStatus;
      if (raw === "active" && pastExpiry) status = "expired";
      else if (raw === "none" && role) status = "free";  // has role but no plan
      else status = raw;

      const isActive = status === "active";
      const isExpired = status === "expired";
      const isFree = status === "free" || status === "none";

      let daysRemaining: number | null = null;
      if (isActive && expiresAt) {
        daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      setData({ status, role, plan: profile.subscription_plan ?? null, expiresAt, isActive, isExpired, isFree, daysRemaining });
    } else {
      // No profile yet
      setData({ status: "none", role: null, plan: null, expiresAt: null, isActive: false, isExpired: false, isFree: false, daysRemaining: null });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, refresh: fetch };
}

/** Activate subscription after payment. Call this after simulated (or real) payment success. */
export async function activateSubscription(
  userId: string,
  role: UserRole,
  period: "month" | "year",
  planSlug: string,
) {
  const expiresAt = new Date();
  if (period === "year") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      role,
      subscription_status: "active",
      subscription_plan: planSlug,
      subscription_expires_at: expiresAt.toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Create success notification
  if (!error) {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Plano ativado com sucesso! 🎉",
      message: `Seu plano ${planSlug.replace(/-/g, " ")} está ativo até ${expiresAt.toLocaleDateString("pt-BR")}.`,
      type: "success",
    }).then(() => {}); // fire-and-forget, non-critical
  }

  return error;
}
