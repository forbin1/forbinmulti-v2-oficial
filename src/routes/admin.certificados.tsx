import { createFileRoute } from "@tanstack/react-router";
import { Award, UserCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CertificatesAdmin } from "@/components/admin/CertificatesAdmin";
import { UserCertificatesAdmin } from "@/components/admin/UserCertificatesAdmin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/certificados")({
  component: () => (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <AdminPageHeader
        icon={Award}
        eyebrow="Conquistas"
        title="Certificados"
        description="Gerencie modelos globais e certificados individuais dos profissionais."
      />

      <Tabs defaultValue="templates" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 max-w-md rounded-full bg-card p-1">
          <TabsTrigger value="templates" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Award className="mr-2 h-4 w-4" /> Modelos
          </TabsTrigger>
          <TabsTrigger value="individual" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <UserCheck className="mr-2 h-4 w-4" /> Individuais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="mt-8">
          <CertificatesAdmin />
        </TabsContent>

        <TabsContent value="individual" className="mt-8">
          <UserCertificatesAdmin />
        </TabsContent>
      </Tabs>
    </div>
  ),
});
