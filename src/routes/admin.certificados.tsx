import { createFileRoute } from "@tanstack/react-router";
import { Award } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CertificatesAdmin } from "@/components/admin/CertificatesAdmin";

export const Route = createFileRoute("/admin/certificados")({
  component: () => (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Award}
        eyebrow="Conquistas"
        title="Certificados"
        description="Modelos de certificados exibidos para profissionais que concluíram cursos."
      />
      <CertificatesAdmin />
    </div>
  ),
});
