/**
 * OUR LITTLE CORNER ♡
 * Supabase Edge Function: init-accounts
 * 
 * Criação automática e segura das duas contas autorizadas no Supabase Authentication,
 * sem necessidade de cadastro manual via Dashboard e sem expor credenciais no frontend.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Gera uma senha forte e aleatória (18 caracteres com letras maiúsculas, minúsculas, números e símbolos)
function generateStrongPassword(length = 18): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*_-+=";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join("");
}

Deno.serve(async (req: Request) => {
  // 1. Tratamento de requisição preflight (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Permite apenas método POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método não permitido. Utilize POST para inicializar as contas." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const adminSecret = Deno.env.get("ADMIN_INIT_SECRET");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ 
          error: "Variáveis de ambiente do Supabase não configuradas.",
          detail: "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar presentes nas variáveis de ambiente da Edge Function."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Proteção de Segurança para Execução Administrativa
    // Se a variável ADMIN_INIT_SECRET estiver definida no Supabase Secrets, exige a chave
    if (adminSecret) {
      const headerSecret = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
      if (headerSecret !== adminSecret) {
        return new Response(
          JSON.stringify({ error: "Acesso não autorizado. Apenas o administrador pode executar esta função." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Cliente Supabase Administrativo com Service Role (apenas no servidor)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 4. Consulta os usuários já existentes no Supabase Auth
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      throw listError;
    }

    const existingUsers = usersData?.users || [];

    // Definição das duas contas oficiais do cantinho
    const accountsConfig = [
      {
        email: Deno.env.get("CONTA1_EMAIL") || "conta1@ourlittlecorner.com",
        displayName: "Meu Amor 1",
        username: "conta1",
        envPassword: Deno.env.get("CONTA1_PASSWORD"),
      },
      {
        email: Deno.env.get("CONTA2_EMAIL") || "conta2@ourlittlecorner.com",
        displayName: "Meu Amor 2",
        username: "conta2",
        envPassword: Deno.env.get("CONTA2_PASSWORD"),
      },
    ];

    const results = [];
    let newlyCreated = 0;

    for (const acc of accountsConfig) {
      const existingUser = existingUsers.find(
        (u) => u.email?.toLowerCase() === acc.email.toLowerCase()
      );

      if (existingUser) {
        // A conta já existe: PRESERVA A SENHA sem recriar ou sobrescrever
        results.push({
          email: acc.email,
          status: "already_exists",
          userId: existingUser.id,
          message: "Conta já existente no Supabase Auth. Senha preservada com segurança.",
        });

        // Garante que o perfil correspondente existe na tabela profiles
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", existingUser.id)
          .maybeSingle();

        if (!profile) {
          await supabaseAdmin.from("profiles").insert({
            id: existingUser.id,
            email: acc.email,
            username: acc.username,
            display_name: acc.displayName,
            bio: "No nosso cantinho especial ♡",
            theme: "light",
          });
        }
      } else {
        // Verifica se o limite estrito de 2 contas seria ultrapassado
        if (existingUsers.length + newlyCreated >= 2) {
          results.push({
            email: acc.email,
            status: "blocked",
            message: "O limite de 2 contas do cantinho já foi atingido. Criação bloqueada.",
          });
          continue;
        }

        // Gera senha forte aleatória ou utiliza segredo do ambiente
        const initialPassword = acc.envPassword || generateStrongPassword(18);

        // Criação atômica no Supabase Auth com email já confirmado
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: acc.email,
          password: initialPassword,
          email_confirm: true, // Garante que a conta já pode logar imediatamente sem confirmação por e-mail
          user_metadata: {
            display_name: acc.displayName,
            username: acc.username,
          },
        });

        if (createError) {
          results.push({
            email: acc.email,
            status: "error",
            error: createError.message,
          });
        } else {
          newlyCreated++;
          
          // Cria o perfil correspondente na tabela profiles
          await supabaseAdmin.from("profiles").upsert({
            id: newUser.user.id,
            email: acc.email,
            username: acc.username,
            display_name: acc.displayName,
            bio: "No nosso cantinho especial ♡",
            theme: "light",
          });

          results.push({
            email: acc.email,
            status: "created",
            userId: newUser.user.id,
            initialPassword: initialPassword, // Retornado uma única vez para o administrador salvar
            message: "Conta criada e confirmada com sucesso!",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        createdCount: newlyCreated,
        accounts: results,
        notice: newlyCreated > 0 
          ? "Guarde as senhas geradas acima em um local seguro. Elas não serão exibidas novamente."
          : "Todas as contas já estavam inicializadas. Nenhuma senha foi alterada."
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao executar inicialização." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

