/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/auth.js - Autenticação Real Supabase, Proteção de Rotas e Gerenciamento de Sessão
 */

window.AUTH = {
  // Retorna a sessão ativa atual
  async getSession() {
    const supabase = window.DB.getClient();
    if (!supabase) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Erro ao buscar sessão:", error);
      return null;
    }
    return session;
  },

  // Retorna o usuário autenticado
  async getUser() {
    const session = await this.getSession();
    return session ? session.user : null;
  },

  // Busca o perfil do usuário logado na tabela profiles
  async getCurrentProfile() {
    const user = await this.getUser();
    if (!user) return null;

    const supabase = window.DB.getClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao obter perfil:", error);
      return null;
    }
    return data;
  },

  // Busca o perfil da outra pessoa (o parceiro / amor)
  async getPartnerProfile() {
    const user = await this.getUser();
    if (!user) return null;

    const supabase = window.DB.getClient();

    // Emparelhamento automático dos pares oficiais
    if (user.email === "pedro@gmail.com") {
      const { data } = await supabase.from("profiles").select("*").eq("email", "emilly@gmail.com").maybeSingle();
      if (data) return data;
    }
    if (user.email === "emilly@gmail.com") {
      const { data } = await supabase.from("profiles").select("*").eq("email", "pedro@gmail.com").maybeSingle();
      if (data) return data;
    }
    if (user.email === "conta1@ourlittlecorner.com") {
      const { data } = await supabase.from("profiles").select("*").eq("email", "conta2@ourlittlecorner.com").maybeSingle();
      if (data) return data;
    }
    if (user.email === "conta2@ourlittlecorner.com") {
      const { data } = await supabase.from("profiles").select("*").eq("email", "conta1@ourlittlecorner.com").maybeSingle();
      if (data) return data;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao obter perfil do parceiro:", error);
      return null;
    }
    return data;
  },

  // Verifica se novos cadastros públicos são permitidos (Desativado: cantinho exclusivo)
  async isRegistrationAllowed() {
    return false;
  },

  // Login com E-mail e Senha pelo Supabase Authentication
  async login(email, password) {
    const supabase = window.DB.getClient();
    if (!supabase) throw new Error("Supabase não configurado.");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) throw error;
    return data;
  },

  // Cadastro de Novo Usuário (bloqueado para visitantes)
  async signup() {
    throw new Error("Cadastros públicos estão desativados. Este cantinho é de acesso exclusivo para as contas cadastradas.");
  },

  // Logout seguro (não apaga credenciais nem dados salvos)
  async logout() {
    const supabase = window.DB.getClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "login.html";
  },

  // Recuperação de senha segura via e-mail
  async resetPassword(email) {
    const supabase = window.DB.getClient();
    if (!supabase) throw new Error("Supabase não configurado.");

    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login.html?action=reset`
    });

    if (error) throw error;
    return data;
  },

  // Atualizar e-mail do próprio usuário
  async updateEmail(newEmail) {
    const supabase = window.DB.getClient();
    if (!supabase) throw new Error("Supabase não configurado.");

    const { data, error } = await supabase.auth.updateUser({
      email: newEmail.trim()
    });

    if (error) throw error;
    return data;
  },

  // Atualizar senha do próprio usuário
  async updatePassword(newPassword) {
    const supabase = window.DB.getClient();
    if (!supabase) throw new Error("Supabase não configurado.");

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    return data;
  },

  // Atualizar dados do perfil (display_name, bio, avatar_url, theme, sound settings)
  async updateProfile(updates) {
    const user = await this.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    const supabase = window.DB.getClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Guarda de Rota para páginas restritas: redireciona para login se não estiver logado
  async requireAuth() {
    const session = await this.getSession();
    if (!session) {
      window.location.href = "login.html";
      return null;
    }

    // Aplica o tema salvo do usuário
    const profile = await this.getCurrentProfile();
    if (profile && profile.theme) {
      document.documentElement.setAttribute("data-theme", profile.theme);
    }
    return profile;
  },

  // Guarda de Rota para a tela de login: redireciona para dashboard se já estiver autenticado
  async redirectIfAuthenticated() {
    const session = await this.getSession();
    if (session) {
      window.location.href = "dashboard.html";
    }
  }
};

