import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DbPost = {
  id: string;
  user_id: string;
  author_name: string;
  author_role: string | null;
  author_avatar: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string | null;
    role: string | null;
  };
};

export function usePosts() {
  const [posts, setPosts] = useState<DbPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles(full_name, avatar_url, role)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPosts(data as DbPost[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();

    // Real-time updates
    const channel = supabase
      .channel("public:posts")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { posts, loading, refresh: loadPosts };
}

export async function createPost(postData: Partial<DbPost>) {
  const { data, error } = await supabase
    .from("posts")
    .insert([postData])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw error;
}
