import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PlansAdmin } from "@/components/admin/PlansAdmin";

export const Route = createFileRoute("/admin/planos")({
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={CreditCard}
        eyebrow="Monetização"
        title="Planos"
        description="Editar valores e benefícios. As mudanças refletem automaticamente na página /planos."
      />
      <PlansAdmin />
    </div>
  ),
});
