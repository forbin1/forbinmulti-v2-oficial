import { createFileRoute } from "@tanstack/react-router";
import { JobsAdmin } from "@/components/admin/JobsAdmin";

export const Route = createFileRoute("/admin/vagas")({
  component: JobsAdmin,
});
