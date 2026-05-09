import { createFileRoute } from "@tanstack/react-router";
import { LayoutTemplate } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LandingCms } from "@/components/admin/LandingCms";

export const Route = createFileRoute("/admin/landing")({
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={LayoutTemplate}
        eyebrow="CMS"
        title="Landing Page"
        description="Edite textos e imagens da página inicial. As alterações são publicadas instantaneamente."
      />
      <LandingCms />
    </div>
  ),
});
