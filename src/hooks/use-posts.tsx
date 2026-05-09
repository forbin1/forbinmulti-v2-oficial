import { useSyncExternalStore } from "react";
import type { Post } from "@/data/mock";
import { POSTS } from "@/data/mock";

let userPosts: Post[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function addPost(post: Post) {
  userPosts = [post, ...userPosts];
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Post[] {
  return userPosts;
}

export function usePosts(): Post[] {
  const extra = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [...extra, ...POSTS];
}
