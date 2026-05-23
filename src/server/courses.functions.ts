import { createServerFn } from "@tanstack/react-start";

export const createCourseServer = createServerFn({ method: "POST" })
  .inputValidator((d: any) => d)
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

export const updateCourseServer = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; payload: any }) => d)
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

export const deleteCourseServer = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("courses")
      .delete()
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const toggleCoursePublishedServer = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; is_published: boolean }) => d)
  .handler(async ({ data: { id, is_published } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("courses")
      .update({ is_published })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });
