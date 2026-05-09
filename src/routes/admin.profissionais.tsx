import { createFileRoute } from "@tanstack/react-router";
import { ProfessionalsAdmin } from "@/components/admin/ProfessionalsAdmin";

export const Route = createFileRoute("/admin/profissionais")({
  component: ProfessionalsAdmin,
});
