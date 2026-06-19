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

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  webp: "image/webp", gif: "image/gif", pdf: "application/pdf",
};

/** Upload de imagem/material via service role (bypassa RLS do storage). */
const uploadCourseImageServer = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { base64, ext, folder } = data as { base64: string; ext: string; folder: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const raw = base64.includes(",") ? base64.split(",").pop()! : base64;
    const buffer = Buffer.from(raw, "base64");
    const safeExt = (ext || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const rand = Math.random().toString(36).substring(2, 14);
    const path = `${folder}/${rand}.${safeExt}`;
    const { error } = await supabaseAdmin.storage
      .from("certificates")
      .upload(path, buffer, { contentType: CONTENT_TYPES[safeExt] || "application/octet-stream", upsert: false });
    if (error) throw new Error(error.message);
    const { data: pub } = supabaseAdmin.storage.from("certificates").getPublicUrl(path);
    return { url: pub.publicUrl };
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
      uploadImage={uploadCourseImageServer}
    />
  ),
});
