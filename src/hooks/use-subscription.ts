import { useEffect, useState, useCallback } from "react";
import { useAuth } from "./use-auth";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "professional" | "company" | null;
export type SubscriptionStatus = "active" | "expired" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  role: UserRole;
  plan: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  isExpired: boolean;
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
      const status: SubscriptionStatus =
        raw === "active" && pastExpiry ? "expired" : raw;
      setData({
        status,
        role: (profile.role as UserRole) ?? null,
        plan: profile.subscription_plan ?? null,
        expiresAt,
        isActive: status === "active",
        isExpired: status === "expired",
      });
    } else {
      setData({ status: "none", role: null, plan: null, expiresAt: null, isActive: false, isExpired: false });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...data, loading, refresh: fetch };
}

/** Call after a successful simulated/real payment to activate the subscription */
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
  return error;
}
