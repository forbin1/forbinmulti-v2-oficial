import { createFileRoute } from "@tanstack/react-router";
import { CoursesAdmin } from "@/components/admin/CoursesAdmin";
import { createServerFn } from "@tanstack/react-start";

const createCourseServer = createServerFn({ method: "POST" })
  .handler(async ({ data: payload }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("courses")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

const updateCourseServer = createServerFn({ method: "POST" })
  .handler(async ({ data: { id, payload } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("courses")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

const deleteCourseServer = createServerFn({ method: "POST" })
  .handler(async ({ data: id }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const toggleCoursePublishedServer = createServerFn({ method: "POST" })
  .handler(async ({ data: { id, is_published } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("courses")
      .update({ is_published })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

const saveBannerServer = createServerFn({ method: "POST" })
  .handler(async ({ data: payload }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert({ 
        key: "courses_banner", 
        value: JSON.stringify(payload), 
        updated_at: new Date().toISOString() 
      });
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const Route = createFileRoute("/admin/cursos")({
  component: () => (
    <CoursesAdmin
      createCourse={createCourseServer}
      updateCourse={updateCourseServer}
      deleteCourse={deleteCourseServer}
      toggleCoursePublished={toggleCoursePublishedServer}
      saveBanner={saveBannerServer}
    />
  ),
});
