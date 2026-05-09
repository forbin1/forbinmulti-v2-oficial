import { createFileRoute } from "@tanstack/react-router";
import { ExperiencesAdmin } from "@/components/admin/ExperiencesAdmin";

export const Route = createFileRoute("/admin/experiencias")({
  component: ExperiencesAdmin,
});
