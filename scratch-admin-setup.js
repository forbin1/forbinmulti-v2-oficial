import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env variables SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupAdmin() {
  console.log("=== INICIANDO CONFIGURAÇÃO DO USUÁRIO ADMIN ===");
  
  // 1. Localizar o usuário por e-mail no Auth
  console.log("Buscando usuário admin@gmail.com na base do Supabase...");
  const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers();
  
  if (usersErr) {
    console.error("Erro ao listar usuários:", usersErr.message);
    process.exit(1);
  }
  
  const adminUser = users.find(u => u.email === "admin@gmail.com");
  
  if (!adminUser) {
    console.error("ERRO CRÍTICO: Usuário admin@gmail.com não foi encontrado no sistema de autenticação!");
    console.log("Por favor, crie a conta admin@gmail.com primeiro através da página de cadastro/login.");
    process.exit(1);
  }
  
  const userId = adminUser.id;
  console.log(`Usuário encontrado! ID: ${userId}`);
  
  // 2. Garantir registro na tabela 'user_roles' como 'admin'
  console.log("Verificando papel em 'user_roles'...");
  const { data: currentRole, error: roleGetErr } = await supabase
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
    
  if (roleGetErr) {
    console.error("Erro ao buscar papel existente:", roleGetErr.message);
  }
  
  if (!currentRole) {
    console.log("Nenhum papel encontrado. Inserindo papel 'admin'...");
    const { error: roleInsertErr } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleInsertErr) {
      console.error("Erro ao inserir papel 'admin':", roleInsertErr.message);
    } else {
      console.log("Papel 'admin' inserido com sucesso em 'user_roles'!");
    }
  } else {
    console.log(`Papel atual em 'user_roles': ${currentRole.role}`);
    if (currentRole.role !== "admin") {
      console.log("Atualizando papel para 'admin'...");
      const { error: roleUpdateErr } = await supabase
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", userId);
      if (roleUpdateErr) {
        console.error("Erro ao atualizar papel:", roleUpdateErr.message);
      } else {
        console.log("Papel atualizado para 'admin' com sucesso!");
      }
    }
  }
  
  // 3. Garantir registro na tabela 'profiles' como 'admin'
  console.log("Verificando perfil em 'profiles'...");
  const { data: currentProfile, error: profileGetErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
    
  if (profileGetErr) {
    console.error("Erro ao buscar perfil existente:", profileGetErr.message);
  }
  
  if (!currentProfile) {
    console.log("Criando perfil para o administrador...");
    const { error: profileInsertErr } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        full_name: "Administrador FORBIN",
        role: "admin",
        handle: "admin-forbin"
      });
    if (profileInsertErr) {
      console.error("Erro ao criar perfil:", profileInsertErr.message);
    } else {
      console.log("Perfil do administrador criado com sucesso!");
    }
  } else {
    console.log("Perfil encontrado. Atualizando papel para 'admin'...");
    const { error: profileUpdateErr } = await supabase
      .from("profiles")
      .update({ role: "admin", full_name: "Administrador FORBIN" })
      .eq("user_id", userId);
    if (profileUpdateErr) {
      console.error("Erro ao atualizar perfil:", profileUpdateErr.message);
    } else {
      console.log("Perfil do administrador atualizado com sucesso!");
    }
  }
  
  // 4. Garantir registro na tabela 'companies' para poder criar vagas, etc.
  console.log("Verificando perfil corporativo em 'companies'...");
  const { data: currentCompany, error: companyGetErr } = await supabase
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
    
  if (companyGetErr) {
    console.error("Erro ao buscar perfil de empresa:", companyGetErr.message);
  }
  
  if (!currentCompany) {
    console.log("Criando registro em 'companies' para o admin para liberar recursos corporativos...");
    const { error: companyInsertErr } = await supabase
      .from("companies")
      .insert({
        user_id: userId,
        company_name: "FORBIN",
        city: "Rio de Janeiro",
        state: "RJ",
        username: "admin-forbin"
      });
    if (companyInsertErr) {
      console.error("Erro ao criar registro em 'companies':", companyInsertErr.message);
    } else {
      console.log("Perfil corporativo ('companies') do administrador criado com sucesso!");
    }
  } else {
    console.log("Perfil corporativo ('companies') já existe para o administrador.");
  }
  
  console.log("=== CONFIGURAÇÃO DO ADMINISTRADOR CONCLUÍDA COM SUCESSO ===");
}

setupAdmin();
