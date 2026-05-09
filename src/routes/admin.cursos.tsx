import { createFileRoute } from "@tanstack/react-router";
import { CoursesAdmin } from "@/components/admin/CoursesAdmin";

export const Route = createFileRoute("/admin/cursos")({
  component: CoursesAdmin,
});
