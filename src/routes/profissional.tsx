import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useRef } from "react";
import {
  MapPin, Phone, Mail, ShieldCheck, Briefcase, Heart, MessageCircle, MoreHorizontal,
  Pencil, Trash2, Languages, Star, GraduationCap, Car, Target, Share2, Linkedin,
  Instagram, Globe, Download, PlayCircle, Clock, TrendingUp, Camera, Save, X, Loader2
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { POSTS } from "@/data/mock";
import { MentionText } from "@/components/MentionText";
import { toast } from "sonner";
import { usePosts, addPost } from "@/hooks/use-posts";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profissional")({
  head: () => ({
    meta: [
      { title: "Meu Perfil Profissional · FORBIN" },
    ],
  }),
  component: PerfilProfissional,
});

type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  role: string | null;
  experience_years: number | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  whatsapp: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  website_url: string | null;
  is_verified: boolean;
};

function PerfilProfissional() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const allPosts = usePosts();

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (data) setProfile(data as Profile);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleUpload = async (file: File, type: "avatar" | "cover") => {
    if (!user) return;
    setUploading(type);
    const ext = file.name.split(".").pop();
    const filePath = `profiles/${user.id}/${type}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(filePath, file);

    if (uploadError) {
      toast.error("Erro no upload: " + uploadError.message);
      setUploading(null);
      return;
    }

    const { data } = supabase.storage.from("certificates").getPublicUrl(filePath);
    const url = data.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [type === "avatar" ? "avatar_url" : "cover_url"]: url })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error("Erro ao atualizar perfil");
    } else {
      toast.success(type === "avatar" ? "Foto de perfil atualizada!" : "Capa atualizada!");
      loadProfile();
    }
    setUploading(null);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="p-20 text-center">Perfil não encontrado.</div>;

  const initials = profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const userPosts = allPosts.filter(p => p.author === profile.full_name);

  return (
    <div>
      <div className="group relative h-64 overflow-hidden border-b border-border/60 sm:h-80 lg:h-96">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-neutral-900">
             <div className="absolute inset-0 bg-gradient-gold opacity-10" />
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <Button variant="secondary" className="rounded-full shadow-lg" onClick={() => coverInputRef.current?.click()} disabled={!!uploading}>
            {uploading === "cover" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            Alterar Capa
          </Button>
        </div>
        <input ref={coverInputRef} type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "cover")} />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-32 relative z-10 rounded-3xl border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 sm:p-10">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:text-left text-center">
            <div className="group relative -mt-10 sm:mt-0">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-8 border-card bg-gradient-gold font-display text-6xl font-extrabold text-primary-foreground shadow-2xl">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : initials}
              </div>
              <button 
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition group-hover:opacity-100"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!uploading}
              >
                {uploading === "avatar" ? <Loader2 className="h-8 w-8 animate-spin text-white" /> : <Camera className="h-10 w-10 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "avatar")} />
            </div>

            <div className="flex-1 pb-2">
              <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
                <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">{profile.full_name}</h1>
                {profile.is_verified && (
                  <Badge className="rounded-full border-success/40 bg-success/20 text-success px-4 py-1.5 font-bold animate-pulse">
                    <ShieldCheck className="mr-1.5 h-4 w-4" /> Verificado FORBIN
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xl font-medium text-muted-foreground/80">
                {profile.role || "Profissional de Segurança"} {profile.experience_years ? `· ${profile.experience_years} anos de experiência` : ""}
              </p>
              <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground/70">
                {profile.city && <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {profile.city}, {profile.state}</span>}
                <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {user?.email}</span>
                {profile.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {profile.phone}</span>}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => setIsEditing(true)} variant="outline" className="h-12 rounded-full border-primary/40 bg-primary/5 px-8 font-bold hover:bg-primary/10 transition-all">
                <Pencil className="mr-2 h-5 w-5" /> Editar Perfil
              </Button>
              {profile.whatsapp && (
                <Button asChild className="h-12 rounded-full bg-[#25D366] px-8 font-bold text-white shadow-lg shadow-[#25D366]/20 hover:bg-[#1ebe5a] hover:scale-105 transition-all">
                  <a href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                    <WhatsAppIcon className="mr-2 h-5 w-5" /> WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {profile.linkedin_url && <SocialChip icon={Linkedin} label="LinkedIn" />}
            {profile.instagram_url && <SocialChip icon={Instagram} label="Instagram" />}
            {profile.website_url && <SocialChip icon={Globe} label="Site" />}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-6 sm:grid-cols-4 text-center sm:text-left">
            <Stat label="Cursos" value="—" />
            <Stat label="Experiência" value={profile.experience_years ? `${profile.experience_years}a` : "—"} />
            <Stat label="Postos" value="—" />
            <Stat label="Avaliação" value="5.0 ★" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Tabs defaultValue="sobre">
              <TabsList className="flex h-auto w-full gap-2 rounded-2xl bg-card/50 p-1.5 backdrop-blur-md">
                <TabsTrigger value="sobre" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Sobre</TabsTrigger>
                <TabsTrigger value="experiencia" className="flex-1 rounded-xl py-3 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Experiências</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre" className="mt-6 space-y-6">
                <Card title="Resumo profissional">
                  <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {profile.bio || "Nenhum resumo cadastrado."}
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="experiencia" className="mt-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <ComposeBox />
                {userPosts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 p-12 text-center text-muted-foreground bg-card/20">
                    Nenhuma experiência compartilhada ainda.
                  </div>
                ) : (
                  userPosts.map((p) => (
                    <PostCard key={p.id} post={p} owned={true} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-8">
            <Card title="Disponibilidade">
              <div className="space-y-4 text-sm font-medium">
                <Row label="Função Atual" value={profile.role || "Não informada"} />
                <Row label="Região" value={profile.city ? `${profile.city}, ${profile.state}` : "Não informada"} />
                <Row label="Status" value="Disponível para propostas" />
                <div className="mt-6 pt-6 border-t border-white/5">
                   <Button variant="ghost" size="sm" className="w-full rounded-xl text-primary font-bold hover:bg-primary/10" onClick={() => setIsEditing(true)}>
                     <Pencil className="mr-2 h-3 w-3" /> Editar Disponibilidade
                   </Button>
                </div>
              </div>
            </Card>

            <div className="rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 p-8 border border-primary/20">
              <ShieldCheck className="h-10 w-10 text-primary mb-4" />
              <h3 className="font-display text-xl font-bold mb-2">Selo de Qualidade</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este profissional possui certificações validadas pela plataforma FORBIN MultiEmpresas.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <EditProfileDialog
        open={isEditing}
        profile={profile}
        onClose={() => setIsEditing(false)}
        onSaved={loadProfile}
      />
    </div>
  );
}

function EditProfileDialog({ open, profile, onClose, onSaved }: { open: boolean; profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Profile>>(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(profile); }, [profile, open]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        role: form.role,
        experience_years: form.experience_years,
        city: form.city,
        state: form.state,
        phone: form.phone,
        whatsapp: form.whatsapp,
        bio: form.bio,
        linkedin_url: form.linkedin_url,
        instagram_url: form.instagram_url,
        website_url: form.website_url,
      })
      .eq("user_id", profile.user_id);

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado!");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Editar Informações do Perfil</DialogTitle></DialogHeader>
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nome Completo</Label>
            <Input value={form.full_name ?? ""} onChange={(e) => setForm({...form, full_name: e.target.value})} />
          </div>
          <div>
            <Label>Cargo / Especialidade</Label>
            <Input value={form.role ?? ""} onChange={(e) => setForm({...form, role: e.target.value})} placeholder="Ex: Vigilante Líder" />
          </div>
          <div>
            <Label>Anos de Experiência</Label>
            <Input type="number" value={form.experience_years ?? 0} onChange={(e) => setForm({...form, experience_years: Number(e.target.value)})} />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.city ?? ""} onChange={(e) => setForm({...form, city: e.target.value})} />
          </div>
          <div>
            <Label>Estado (UF)</Label>
            <Input maxLength={2} value={form.state ?? ""} onChange={(e) => setForm({...form, state: e.target.value.toUpperCase()})} />
          </div>
          <div>
            <Label>WhatsApp (Somente números)</Label>
            <Input value={form.whatsapp ?? ""} onChange={(e) => setForm({...form, whatsapp: e.target.value})} />
          </div>
          <div>
            <Label>LinkedIn (URL)</Label>
            <Input value={form.linkedin_url ?? ""} onChange={(e) => setForm({...form, linkedin_url: e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio / Resumo Profissional</Label>
            <Textarea rows={4} value={form.bio ?? ""} onChange={(e) => setForm({...form, bio: e.target.value})} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SocialChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-default">
      <Icon className="h-4 w-4" /> {label}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center sm:items-start">
      <p className="font-display text-3xl font-black text-primary tracking-tighter">{value}</p>
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-card/40 p-8 backdrop-blur-sm">
      <h3 className="mb-6 font-display text-xl font-bold tracking-tight">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground/80 font-medium">{label}</span>
      <span className="font-bold text-right">{value}</span>
    </div>
  );
}

export function ComposeBox() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setVideo(null);
  };

  const onPickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideo(url);
    setImage(null);
  };

  const reset = () => {
    setText("");
    setImage(null);
    setVideo(null);
    if (imgInput.current) imgInput.current.value = "";
    if (vidInput.current) vidInput.current.value = "";
  };

  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || "Membro FORBIN";
  const initials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  const publish = () => {
    if (!text.trim() && !image && !video) {
      toast.error("Adicione um texto, foto ou vídeo");
      return;
    }
    addPost({
      id: `u-${Date.now()}`,
      author: userName,
      role: user?.user_metadata?.role || "Profissional",
      avatar: initials,
      avatarUrl: avatarUrl,
      time: "Agora",
      content: text.trim(),
      image: image ?? undefined,
      video: video ?? undefined,
      likes: 0,
      comments: 0,
      type: video ? "video" : image ? "image" : "text",
    });
    toast.success("Experiência publicada!");
    reset();
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-gold font-bold text-primary-foreground sm:h-12 sm:w-12">
          {avatarUrl ? (
            <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Compartilhe uma experiência…"
          className="h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:h-12 sm:px-5"
        />
      </div>
      {image && (
        <div className="relative mt-4">
          <img src={image} alt="" className="w-full rounded-xl border border-border/60 object-cover" />
          <Button size="sm" variant="secondary" className="absolute right-2 top-2 rounded-full" onClick={() => setImage(null)}>Remover</Button>
        </div>
      )}
      {video && (
        <div className="relative mt-4">
          <video src={video} controls playsInline className="w-full rounded-xl border border-border/60 bg-black" />
          <Button size="sm" variant="secondary" className="absolute right-2 top-2 rounded-full" onClick={() => setVideo(null)}>Remover</Button>
        </div>
      )}
      <input ref={imgInput} type="file" accept="image/*" hidden onChange={onPickImage} />
      <input ref={vidInput} type="file" accept="video/*" hidden onChange={onPickVideo} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
        <div className="flex flex-wrap gap-1">
          <Button variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground" onClick={() => { setImage(null); setVideo(null); }}>Texto</Button>
          <Button variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground" onClick={() => imgInput.current?.click()}>Foto</Button>
          <Button variant="ghost" size="sm" className="rounded-full text-xs text-muted-foreground" onClick={() => vidInput.current?.click()}>Vídeo</Button>
        </div>
        <Button onClick={publish} className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold">Publicar</Button>
      </div>
    </div>
  );
}

export function PostCard({ post, owned = false }: { post: any; owned?: boolean }) {
  const { user } = useAuth();
  const [content, setContent] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [deleted, setDeleted] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; author: string; text: string }[]>([]);
  const [commentDraft, setCommentDraft] = useState("");

  if (deleted) return null;

  const handle = post.handle || post.author.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".");
  const totalComments = post.comments + comments.length;
  const isSelf = owned || (user?.user_metadata?.full_name === post.author);

  const toggleLike = () => {
    setLiked((prev) => {
      setLikes((l) => l + (prev ? -1 : 1));
      return !prev;
    });
  };

  const addComment = () => {
    const text = commentDraft.trim();
    if (!text) return;
    const authorName = user?.user_metadata?.full_name || "Você";
    setComments((c) => [...c, { id: `${Date.now()}`, author: authorName, text }]);
    setCommentDraft("");
  };

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-gold font-bold text-primary-foreground">
          {post.avatarUrl ? (
            <img src={post.avatarUrl} alt={post.author} className="h-full w-full object-cover" />
          ) : (
            post.avatar
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{post.author}</p>
          <p className="truncate text-xs text-muted-foreground">{post.role} · {post.time}</p>
        </div>
        {owned && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setDraft(content); setEditing(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => { setDeleted(true); }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {editing ? (
        <div className="mt-4 space-y-3">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => { setContent(draft); setEditing(false); }}>Salvar</Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 break-words text-base leading-relaxed"><MentionText>{content}</MentionText></p>
      )}
      {post.image && <img src={post.image} alt="" className="mt-4 w-full rounded-xl border border-border/60 object-cover" />}
      {post.video && <video src={post.video} controls playsInline className="mt-4 w-full rounded-xl border border-border/60 bg-black" />}
      <footer className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={toggleLike} className={`rounded-full ${liked ? "text-primary" : ""}`}>
          <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-primary" : ""}`} /> {likes}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((s) => !s)} className="rounded-full">
          <MessageCircle className="mr-2 h-4 w-4" /> {totalComments}
        </Button>
      </footer>
      {showComments && (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
          {comments.map((c) => (
            <div key={c.id} className="rounded-xl bg-surface px-3 py-2 text-sm">
              <p className="font-semibold">{c.author}</p>
              <p className="text-muted-foreground">{c.text}</p>
            </div>
          ))}
          <div className="flex gap-2">
            <Textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Escreva um comentário..."
              rows={1}
              className="min-h-[40px]"
            />
            <Button size="sm" onClick={addComment}>Enviar</Button>
          </div>
        </div>
      )}
    </article>
  );
}
