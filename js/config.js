/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/config.js - Configurações centrais do Supabase e do Cantinho
 */

const CONFIG = {
  // Substitua pelos dados do seu projeto no Supabase (Dashboard -> Settings -> API)
  // Ou preencha diretamente na tela de configuração que se abre caso não estejam definidos.
  SUPABASE_URL: "https://seu-projeto-aqui.supabase.co",
  SUPABASE_ANON_KEY: "sua-chave-publica-anon-aqui",

  // Cores do projeto
  COLORS: {
    primary: "#F4B8CC",
    lavender: "#E5D8F5",
    cream: "#FFF4E8",
    vintageRose: "#D9B5C7",
    sage: "#C8D9D5",
    softBlue: "#B7CDE0",
    textDark: "#765D6C",
    pearlWhite: "#FFFCFA"
  },

  // Retorna a URL ativa (prioriza configuração salva no navegador ou a fixa deste arquivo)
  getUrl() {
    const saved = localStorage.getItem("olc_supabase_url");
    if (saved && saved.trim() !== "") return saved.trim();
    return this.SUPABASE_URL;
  },

  // Retorna a Anon Key ativa
  getAnonKey() {
    const saved = localStorage.getItem("olc_supabase_anon_key");
    if (saved && saved.trim() !== "") return saved.trim();
    return this.SUPABASE_ANON_KEY;
  },

  // Salva credenciais locais fornecidas pelo usuário pela interface amigável
  saveCredentials(url, key) {
    if (url) localStorage.setItem("olc_supabase_url", url.trim());
    if (key) localStorage.setItem("olc_supabase_anon_key", key.trim());
  },

  // Limpa credenciais locais
  clearLocalCredentials() {
    localStorage.removeItem("olc_supabase_url");
    localStorage.removeItem("olc_supabase_anon_key");
  },

  // Verifica se o Supabase está configurado corretamente
  isConfigured() {
    const url = this.getUrl();
    const key = this.getAnonKey();
    const isUrlPlaceholder = !url || url.includes("seu-projeto-aqui") || !url.startsWith("http");
    const isKeyPlaceholder = !key || key.includes("sua-chave-publica") || key.length < 20;
    return !isUrlPlaceholder && !isKeyPlaceholder;
  }
};

window.CONFIG = CONFIG;

