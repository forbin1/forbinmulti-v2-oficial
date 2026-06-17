import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { POSTS, COURSES } from "@/data/mock";
import { MentionText } from "@/components/MentionText";
import { toast } from "sonner";
import { usePosts, createPost, deletePost } from "@/hooks/use-posts";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { FeatureGate } from "@/components/SubscriptionGuard";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { computeLevel, LEVEL_META, ESCOLARIDADE_OPTIONS, type LevelTier } from "@/lib/professional-level";
import { LevelBadge } from "@/components/LevelBadge";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfessionalInfo } from "@/components/ProfessionalInfo";
import {
  ExperienceDialog, ExperienceList, AddExperienceButton, toMonthInput, toDbDate, type ExperienceDraft,
} from "@/components/ProfessionalExperiences";

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
  courses: string[] | null;
  specializations: string[] | null;
  escolaridade: string | null;
  has_cnv: boolean | null;
  cnv_number: string | null;
  altura: string | null;
  peso: string | null;
  data_nascimento: string | null;
  estado_civil: string | null;
  has_cnh: boolean | null;
  served_military: boolean | null;
  disponibilidade_viagem: boolean | null;
  username: string | null;
};

/** Mostra o cargo em PT; ignora o papel de sistema ("professional"/"company"). */
function displayRole(role: string | null | undefined): string {
  if (!role || role === "professional" || role === "company" || role === "admin") {
    return "Profissional de Segurança";
  }
  return role;
}

function PerfilProfissional() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "cover" | null>(null);
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const [userCourses, setUserCourses] = useState<{ title: string; source: 'profile' | 'certificate' | 'online' }[]>([]);
  const [experiences, setExperiences] = useState<ExperienceDraft[]>([]);
  const [expDialogOpen, setExpDialogOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceDraft | null>(null);
  const [savingExp, setSavingExp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const { posts: allPosts } = usePosts();

  const loadExperiences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("professional_experiences")
      .select("*")
      .eq("user_id", user.id)
      .order("is_current", { ascending: false })
      .order("start_date", { ascending: false });
    if (data) {
      setExperiences(
        data.map((e) => ({
          id: e.id,
          company: e.company,
          position: e.position,
          category: e.category,
          start_date: toMonthInput(e.start_date),
          end_date: toMonthInput(e.end_date),
          is_current: e.is_current,
          description: e.description,
        })),
      );
    }
  };

  const saveExperience = async (draft: ExperienceDraft) => {
    if (!user) return;
    setSavingExp(true);
    const payload = {
      user_id: user.id,
      company: draft.company,
      position: draft.position,
      category: draft.category,
      start_date: toDbDate(draft.start_date),
      end_date: draft.is_current ? null : toDbDate(draft.end_date),
      is_current: draft.is_current,
      description: draft.description || null,
    };
    const { error } = draft.id
      ? await supabase.from("professional_experiences").update(payload).eq("id", draft.id)
      : await supabase.from("professional_experiences").insert(payload);
    setSavingExp(false);
    if (error) return toast.error("Erro ao salvar experiência: " + error.message);
    toast.success("Experiência salva!");
    setExpDialogOpen(false);
    setEditingExp(null);
    loadExperiences();
  };

  const deleteExperience = async (draft: ExperienceDraft) => {
    if (!draft.id) return;
    const { error } = await supabase.from("professional_experiences").delete().eq("id", draft.id);
    if (error) return toast.error("Erro ao excluir: " + error.message);
    toast.success("Experiência removida");
    loadExperiences();
  };

  const loadCoursesCount = async () => {
    if (!user) return;
    try {
      // 1. Get courses from user profile
      const { data: profData } = await supabase
        .from("profiles")
        .select("courses")
        .eq("user_id", user.id)
        .maybeSingle();

      // 2. Get user certificates (issued by admin or loaded)
      const { data: certData } = await supabase
        .from("user_certificates")
        .select("name")
        .eq("user_id", user.id);

      // 3. Get completed online courses (completed_at is not null)
      const { data: enrollData } = await supabase
        .from("enrollments")
        .select("course_id, courses(title)")
        .eq("user_id", user.id)
        .not("completed_at", "is", null);

      const coursesMap = new Map<string, 'profile' | 'certificate' | 'online'>();

      // Add profile courses
      if (profData?.courses && Array.isArray(profData.courses)) {
        profData.courses.forEach((c: any) => {
          if (typeof c === "string" && c.trim()) {
            coursesMap.set(c.trim().toLowerCase(), 'profile');
          }
        });
      }

      // Add user certificates
      if (certData) {
        certData.forEach((c: any) => {
          if (c.name && typeof c.name === "string" && c.name.trim()) {
            coursesMap.set(c.name.trim().toLowerCase(), 'certificate');
          }
        });
      }

      // Add completed online courses
      if (enrollData) {
        enrollData.forEach((e: any) => {
          const title = e.courses?.title;
          if (title && typeof title === "string" && title.trim()) {
            coursesMap.set(title.trim().toLowerCase(), 'online');
          }
        });
      }

      const list = Array.from(coursesMap.entries()).map(([lowercased, source]) => {
        const original = COURSES.find(c => c.toLowerCase() === lowercased) || 
                         lowercased.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return {
          title: original,
          source
        };
      });

      setUserCourses(list);
      setCoursesCount(list.length);
    } catch (err) {
      console.error("Error loading courses count:", err);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data }] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      loadCoursesCount()
    ]);
    
    if (data) setProfile(data as Profile);
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    loadExperiences();
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

  const userPosts = allPosts.filter(p => p.user_id === user?.id);

  const level = computeLevel({
    courses: profile.courses,
    experienceYears: profile.experience_years,
    experiences,
  });

  return (
    <div>
      {/* Conteúdo principal */}
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">

        {/* Cabeçalho do perfil */}
        <ProfileHeader
          name={profile.full_name}
          initials={initials}
          eyebrow="Profissional"
          subtitle={`${displayRole(profile.role)}${profile.experience_years ? ` · ${profile.experience_years} anos de exp.` : ""}`}
          avatarUrl={profile.avatar_url}
          coverUrl={profile.cover_url}
          levelTier={level.tier}
          whatsapp={profile.whatsapp}
          isOwner
          uploading={uploading}
          onPickAvatar={(f) => handleUpload(f, "avatar")}
          onPickCover={(f) => handleUpload(f, "cover")}
          meta={[
            ...(profile.city ? [{ icon: MapPin, text: `${profile.city}, ${profile.state ?? ""}` }] : []),
            ...(user?.email ? [{ icon: Mail, text: user.email }] : []),
            ...(profile.phone ? [{ icon: Phone, text: profile.phone }] : []),
          ]}
          stats={[
            { label: "Cursos", value: String(coursesCount) },
            { label: "Experiência", value: profile.experience_years ? `${profile.experience_years}a` : "—" },
            { label: "Postos", value: profile.specializations?.[1] || "0" },
            { label: "Avaliação", value: "5.0 ★" },
          ]}
          actions={
            <Button onClick={() => setIsEditing(true)} variant="outline" className="h-11 rounded-full border-primary/40 bg-primary/5 px-5 font-bold hover:bg-primary/10">
              <Pencil className="mr-1.5 h-4 w-4" /> Editar Perfil
            </Button>
          }
        />

        {/* Grid de conteúdo */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Coluna principal */}
          <div className="min-w-0 space-y-6">
            <Tabs defaultValue="sobre">
              <TabsList className="flex h-auto w-full gap-1.5 rounded-2xl border border-border bg-surface p-1.5">
                <TabsTrigger value="sobre" className="flex-1 rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Sobre</TabsTrigger>
                <TabsTrigger value="experiencias" className="flex-1 rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Experiências</TabsTrigger>
                <TabsTrigger value="publicacoes" className="flex-1 rounded-xl py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Publicações</TabsTrigger>
              </TabsList>

              <TabsContent value="sobre" className="mt-5 space-y-5">
                {/* Nível do Profissional — acima do resumo */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 to-primary/5 p-5 sm:rounded-3xl sm:p-7">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold sm:text-xl">Nível do Profissional</h3>
                    <LevelBadge tier={level.tier} size="lg" />
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{LEVEL_META[level.tier].description}</p>
                  <div className="mt-4 grid gap-1.5 border-t border-white/5 pt-4 text-xs text-muted-foreground sm:grid-cols-2">
                    <LevelCriterion ok={level.facts.hasFormacao} label="Curso de Formação de Vigilante" />
                    <LevelCriterion ok={level.facts.experienceYears >= 1} label={`Experiência (${level.facts.experienceYears} ${level.facts.experienceYears === 1 ? "ano" : "anos"})`} />
                    <LevelCriterion ok={level.facts.experienceCount > 0} label={`Experiências cadastradas (${level.facts.experienceCount})`} />
                    <LevelCriterion ok={level.facts.hasSpecialty} label="Especialização (Escolta, SPP, CFTV...)" />
                  </div>
                </div>

                <Card title="Resumo profissional">
                  <p className="leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {profile.bio || "Nenhum resumo cadastrado."}
                  </p>
                </Card>

                <Card title="Informações do Profissional">
                  <ProfessionalInfo profile={profile} />
                </Card>

                <Card title="Cursos & Formações">
                  {userCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum curso cadastrado ou concluído ainda.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {userCourses.map((c) => (
                        <div key={c.title} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3.5 hover:border-primary/20 hover:bg-primary/5 transition-all duration-300">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <span className="font-semibold text-sm">{c.title}</span>
                          </div>
                          <div className="shrink-0">
                            {c.source === 'online' && (
                              <Badge className="rounded-full border-primary/40 bg-primary/20 text-primary px-2.5 py-0.5 text-[10px] font-bold shadow-gold">
                                <Star className="mr-1 h-2.5 w-2.5 fill-primary text-primary animate-pulse" /> Online
                              </Badge>
                            )}
                            {c.source === 'certificate' && (
                              <Badge className="rounded-full border-success/40 bg-success/20 text-success px-2.5 py-0.5 text-[10px] font-bold">
                                <ShieldCheck className="mr-1 h-2.5 w-2.5" /> Validado
                              </Badge>
                            )}
                            {c.source === 'profile' && (
                              <Badge variant="outline" className="rounded-full border-muted-foreground/30 bg-muted/5 text-muted-foreground px-2.5 py-0.5 text-[10px] font-medium">
                                Declarado
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="experiencias" className="mt-5 space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <Card title="Experiências Profissionais">
                  <div className="space-y-4">
                    <ExperienceList
                      items={experiences}
                      editable
                      emptyText="Nenhuma experiência cadastrada ainda. Adicione suas experiências para evoluir de nível."
                      onEdit={(e) => { setEditingExp(e); setExpDialogOpen(true); }}
                      onDelete={deleteExperience}
                    />
                    <AddExperienceButton onClick={() => { setEditingExp(null); setExpDialogOpen(true); }} />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="publicacoes" className="mt-5 space-y-5 animate-in fade-in slide-in-from-bottom-4">
                <ComposeBox />
                {userPosts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground bg-card/20">
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

          {/* Sidebar */}
          <aside className="space-y-5">
            <Card title="Disponibilidade">
              <div className="space-y-3 text-sm font-medium">
                <Row label="Função" value={profile.role || "Não informada"} />
                <Row label="Região" value={profile.city ? `${profile.city}, ${profile.state}` : "Não informada"} />
                <Row label="Escolaridade" value={profile.escolaridade || "Não informada"} />
                <Row label="Possui CNV" value={profile.has_cnv ? "Sim" : "Não"} />
                <Row label="Status" value={profile.specializations?.[0] || "Disponível para propostas"} />
                <div className="mt-4 pt-4 border-t border-white/5">
                   <Button variant="ghost" size="sm" className="w-full rounded-xl text-primary font-bold hover:bg-primary/10" onClick={() => setIsEditing(true)}>
                     <Pencil className="mr-2 h-3 w-3" /> Editar Disponibilidade
                   </Button>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>

      <EditProfileDialog
        open={isEditing}
        profile={profile}
        onClose={() => setIsEditing(false)}
        onSaved={loadProfile}
      />

      <ExperienceDialog
        open={expDialogOpen}
        initial={editingExp}
        saving={savingExp}
        onClose={() => { setExpDialogOpen(false); setEditingExp(null); }}
        onSave={saveExperience}
      />
    </div>
  );
}

function EditProfileDialog({ open, profile, onClose, onSaved }: { open: boolean; profile: Profile; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Partial<Profile>>(profile);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("Disponível para propostas");
  const [postos, setPostos] = useState<string>("0");
  const [saving, setSaving] = useState(false);
  const [customCourse, setCustomCourse] = useState("");

  useEffect(() => {
    setForm(profile);
    setSelectedCourses(profile.courses || []);
    setStatus(profile.specializations?.[0] || "Disponível para propostas");
    setPostos(profile.specializations?.[1] || "0");
  }, [profile, open]);

  const addCustomCourse = () => {
    const trimmed = customCourse.trim();
    if (!trimmed) return;
    
    // Case-insensitive match in selectedCourses
    if (selectedCourses.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Este curso já está adicionado.");
      return;
    }
    
    // Find case-insensitive match in standard COURSES
    const matchStandard = COURSES.find(c => c.toLowerCase() === trimmed.toLowerCase());
    const finalName = matchStandard || trimmed;
    
    setSelectedCourses(prev => [...prev, finalName]);
    setCustomCourse("");
    toast.success(`Curso "${finalName}" adicionado!`);
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        username: form.username ? form.username.toLowerCase().replace(/[^a-z0-9._]/g, "") || null : null,
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
        escolaridade: form.escolaridade || null,
        has_cnv: form.has_cnv ?? false,
        cnv_number: form.cnv_number || null,
        altura: form.altura || null,
        peso: form.peso || null,
        data_nascimento: form.data_nascimento || null,
        estado_civil: form.estado_civil || null,
        has_cnh: form.has_cnh ?? false,
        disponibilidade_viagem: form.disponibilidade_viagem ?? false,
        courses: selectedCourses,
        specializations: [status, postos],
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
          <div className="sm:col-span-2">
            <Label>Nome de usuário (@)</Label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">@</span>
              <Input
                value={form.username ?? ""}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "") })}
                placeholder="seu_usuario"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Aparece como @{form.username || "seu_usuario"} no seu perfil. Use letras minúsculas, números, ponto e _.</p>
          </div>
          <div>
            <Label>Cargo / Especialidade (Função)</Label>
            <Input value={form.role ?? ""} onChange={(e) => setForm({...form, role: e.target.value})} placeholder="Ex: Vigilante Líder" />
          </div>
          <div>
            <Label>Anos de Experiência</Label>
            <Input type="number" value={form.experience_years ?? 0} onChange={(e) => setForm({...form, experience_years: Number(e.target.value)})} />
          </div>
          <div>
            <Label>Cidade (Região)</Label>
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
          <div>
            <Label>Escolaridade</Label>
            <select
              value={form.escolaridade ?? ""}
              onChange={(e) => setForm({ ...form, escolaridade: e.target.value || null })}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione</option>
              {ESCOLARIDADE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Possui CNV? (Carteira Nacional de Vigilante)</Label>
            <div className="flex gap-3">
              <Button type="button" variant={form.has_cnv === true ? "default" : "outline"} className="h-10 flex-1 rounded-xl" onClick={() => setForm({ ...form, has_cnv: true })}>Sim</Button>
              <Button type="button" variant={form.has_cnv === false ? "default" : "outline"} className="h-10 flex-1 rounded-xl" onClick={() => setForm({ ...form, has_cnv: false })}>Não</Button>
            </div>
          </div>
          <div>
            <Label>Número da CNV</Label>
            <Input value={form.cnv_number ?? ""} onChange={(e) => setForm({ ...form, cnv_number: e.target.value })} placeholder="Opcional" />
          </div>
          <div>
            <Label>Data de nascimento</Label>
            <Input type="date" value={form.data_nascimento ?? ""} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value || null })} />
          </div>
          <div>
            <Label>Estado civil</Label>
            <select
              value={form.estado_civil ?? ""}
              onChange={(e) => setForm({ ...form, estado_civil: e.target.value || null })}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Selecione</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="União Estável">União Estável</option>
            </select>
          </div>
          <div>
            <Label>Altura (cm)</Label>
            <Input value={form.altura ?? ""} onChange={(e) => setForm({ ...form, altura: e.target.value })} placeholder="Ex: 180" />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input value={form.peso ?? ""} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="Ex: 80" />
          </div>
          <div>
            <Label>Possui CNH? (Habilitação)</Label>
            <div className="flex gap-3">
              <Button type="button" variant={form.has_cnh === true ? "default" : "outline"} className="h-10 flex-1 rounded-xl" onClick={() => setForm({ ...form, has_cnh: true })}>Sim</Button>
              <Button type="button" variant={form.has_cnh === false ? "default" : "outline"} className="h-10 flex-1 rounded-xl" onClick={() => setForm({ ...form, has_cnh: false })}>Não</Button>
            </div>
          </div>
          <div>
            <Label>Disponível para viagem?</Label>
            <div className="flex gap-3">
              <Button type="button" variant={form.disponibilidade_viagem === true ? "default" : "outline"} className="h-10 flex-1 rounded-xl" onClick={() => setForm({ ...form, disponibilidade_viagem: true })}>Sim</Button>
              <Button type="button" variant={form.disponibilidade_viagem === false ? "default" : "outline"} className="h-10 flex-1 rounded-xl" onClick={() => setForm({ ...form, disponibilidade_viagem: false })}>Não</Button>
            </div>
          </div>
          <div>
            <Label>Status de Disponibilidade</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="Disponível para propostas">Disponível para propostas</option>
              <option value="Contratado">Contratado</option>
              <option value="Em treinamento">Em treinamento</option>
              <option value="Indisponível">Indisponível</option>
            </select>
          </div>
          <div>
            <Label>Quantidade de Postos Atendidos</Label>
            <Input
              type="number"
              value={postos}
              onChange={(e) => setPostos(e.target.value)}
              placeholder="Ex: 5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio / Resumo Profissional</Label>
            <Textarea rows={4} value={form.bio ?? ""} onChange={(e) => setForm({...form, bio: e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-2 block text-sm font-semibold text-primary">Meus Cursos & Formações</Label>
            <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto border border-border/60 rounded-xl p-3 bg-surface/50">
              {[...COURSES, ...selectedCourses.filter(c => !COURSES.includes(c as any))].map((c) => {
                const active = selectedCourses.includes(c);
                return (
                  <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors py-1">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => {
                        setSelectedCourses(prev =>
                          prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
                        );
                      }}
                      className="rounded border-border bg-surface text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="truncate">{c}</span>
                  </label>
                );
              })}
            </div>
            
            {/* Adicionar curso personalizado */}
            <div className="mt-3 flex gap-2">
              <Input
                value={customCourse}
                onChange={(e) => setCustomCourse(e.target.value)}
                placeholder="Adicionar outro curso (Ex: Primeiros Socorros Avançado)"
                className="h-10 text-sm rounded-xl bg-surface"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomCourse();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addCustomCourse}
                className="h-10 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary font-bold px-4 shrink-0"
              >
                Adicionar
              </Button>
            </div>
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
    <div className="flex flex-col items-center">
      <p className="font-display text-2xl font-black text-primary tracking-tighter sm:text-3xl">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:rounded-3xl sm:p-7">
      <h3 className="mb-4 font-display text-lg font-bold tracking-tight sm:mb-5 sm:text-xl">{title}</h3>
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

function LevelCriterion({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? "text-success" : "text-muted-foreground/50"}>{ok ? "✓" : "○"}</span>
      <span className={ok ? "text-foreground/80" : ""}>{label}</span>
    </div>
  );
}

export function ComposeBox() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `posts/${user?.id}/img-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("certificates").upload(path, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from("certificates").getPublicUrl(path);
      setImage(data.publicUrl);
      setVideo(null);
      toast.success("Foto carregada!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const onPickVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `posts/${user?.id}/vid-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("certificates").upload(path, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from("certificates").getPublicUrl(path);
      setVideo(data.publicUrl);
      setImage(null);
      toast.success("Vídeo carregado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setText("");
    setImage(null);
    setVideo(null);
    if (imgInput.current) imgInput.current.value = "";
    if (vidInput.current) vidInput.current.value = "";
  };

  const [loading, setLoading] = useState(false);
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      if (role === "company") {
        supabase
          .from("companies")
          .select("company_name, logo_url")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setProfile({
                full_name: data.company_name,
                avatar_url: data.logo_url,
                role: "Empresa",
              });
            }
          });
      } else {
        supabase
          .from("profiles")
          .select("full_name, avatar_url, role")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) setProfile(data);
          });
      }
    }
  }, [user, role]);

  const userName = profile?.full_name || user?.user_metadata?.full_name || "Membro FORBIN";
  const userRole = profile?.role || user?.user_metadata?.role || "Profissional";
  const initials = userName.split(" ").map((n: any) => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const publish = async () => {
    if (!user || loading) return;
    if (!text.trim() && !image && !video) {
      toast.error("Adicione um texto, foto ou vídeo");
      return;
    }

    setLoading(true);
    try {
      await createPost({
        user_id: user.id,
        author_name: userName,
        author_role: userRole,
        author_avatar: avatarUrl || null,
        content: text.trim(),
        image_url: image ?? null,
        video_url: video ?? null,
      });
      toast.success("Experiência publicada!");
      reset();
    } catch (err: any) {
      toast.error("Erro ao publicar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FeatureGate feature="publicar experiências">
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
        <Button onClick={publish} disabled={loading} className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-gold min-w-[100px]">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
        </Button>
      </div>
      </div>
    </FeatureGate>
  );
}

export function PostCard({ post, owned = false, authorTier }: { post: any; owned?: boolean; authorTier?: LevelTier }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState(post.content);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.content);
  const [deleted, setDeleted] = useState(false);
  const [likes_count, setLikesCount] = useState(post.likes_count || 0);
  const [liked, setLiked] = useState(false);

  const handleAuthorClick = async () => {
    if (!post.user_id) return;
    try {
      // Define o tipo do autor pela existência de um registro em companies.
      const { data: comp } = await supabase
        .from("companies")
        .select("username")
        .eq("user_id", post.user_id)
        .maybeSingle();

      if (comp) {
        // Empresa → perfil individual da empresa.
        if (comp.username) {
          navigate({ to: "/perfil/$username", params: { username: comp.username } });
        } else {
          toast.info("Este perfil de empresa ainda não está disponível publicamente.");
        }
      } else {
        // Profissional → perfil individual do profissional.
        navigate({ to: "/u/$handle", params: { handle: post.user_id } });
      }
    } catch (err) {
      console.error("Error navigating to author profile:", err);
    }
  };

  useEffect(() => {
    if (user) {
      supabase.from("post_likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle().then(({ data }) => {
        setLiked(!!data);
      });
    }
  }, [user, post.id]);

  const toggleLike = async () => {
    if (!user) return toast.error("Faça login para curtir");
    
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      await supabase.from("posts").update({ likes_count: Math.max(0, likes_count - 1) }).eq("id", post.id);
      setLikesCount(prev => Math.max(0, prev - 1));
      setLiked(false);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      await supabase.from("posts").update({ likes_count: likes_count + 1 }).eq("id", post.id);
      setLikesCount(prev => prev + 1);
      setLiked(true);
    }
  };

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: string; author: string; text: string; avatar?: string; handle?: string }[]>([]);
  const [commentDraft, setCommentDraft] = useState("");

  if (deleted) return null;

  const totalComments = (post.comments_count || 0) + comments.length;
  const isSelf = user?.id === post.user_id;

  const addComment = async () => {
    const text = commentDraft.trim();
    if (!text || !user) return;

    // Fetch the latest profile data just for this comment submission
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, handle")
      .eq("user_id", user.id)
      .maybeSingle();

    const authorName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.company_name || "Usuário";
    const authorAvatar = profile?.avatar_url || user.user_metadata?.avatar_url;
    const authorHandle = profile?.handle || user.user_metadata?.handle || user.email?.split("@")[0] || "user";
    
    setComments((c) => [...c, { id: `${Date.now()}`, author: authorName, text, avatar: authorAvatar, handle: authorHandle }]);
    setCommentDraft("");
  };

  const authorName = post.profiles?.full_name || post.author_name;
  const authorAvatar = post.profiles?.avatar_url || post.author_avatar;
  const authorRole = post.profiles?.role || post.author_role;

  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <div 
          onClick={handleAuthorClick}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-gold font-bold text-primary-foreground cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-300"
        >
          {authorAvatar ? (
            <img src={authorAvatar} alt={authorName} className="h-full w-full object-cover" />
          ) : (
            authorName.charAt(0).toUpperCase()
          )}
        </div>
        <div 
          onClick={handleAuthorClick}
          className="min-w-0 flex-1 cursor-pointer group"
        >
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold group-hover:text-primary transition-colors">{authorName}</p>
            {authorTier && authorTier !== "none" && <LevelBadge tier={authorTier} size="sm" showLabel={false} />}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {authorRole} · {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR }) : "Agora"}
          </p>
        </div>
        {isSelf && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full"><MoreHorizontal className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setDraft(content); setEditing(true); }}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={async () => { 
                try {
                  await deletePost(post.id);
                  setDeleted(true);
                  toast.success("Postagem removida");
                } catch (err) {
                  toast.error("Erro ao remover");
                }
              }}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
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
      {post.image_url && <img src={post.image_url} alt="" className="mt-4 w-full rounded-xl border border-border/60 object-cover" />}
      {post.video_url && <video src={post.video_url} controls playsInline className="mt-4 w-full rounded-xl border border-border/60 bg-black" />}
      
      <FeatureGate feature="interagir no feed">
        <footer className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" onClick={toggleLike} className={`rounded-full ${liked ? "text-primary" : ""}`}>
            <Heart className={`mr-2 h-4 w-4 ${liked ? "fill-primary" : ""}`} /> {likes_count}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowComments((s) => !s)} className="rounded-full">
            <MessageCircle className="mr-2 h-4 w-4" /> {totalComments}
          </Button>
        </footer>
      </FeatureGate>

      {showComments && (
        <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 rounded-xl bg-surface px-3 py-3 text-sm">
              <Link to="/u/$handle" params={{ handle: c.handle || "user" }} className="shrink-0">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-gold font-bold text-primary-foreground">
                  {c.avatar ? (
                    <img src={c.avatar} alt={c.author} className="h-full w-full object-cover" />
                  ) : (
                    c.author.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/u/$handle" params={{ handle: c.handle || "user" }} className="font-semibold hover:underline">
                  {c.author}
                </Link>
                <p className="mt-0.5 text-foreground/90">{c.text}</p>
              </div>
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
