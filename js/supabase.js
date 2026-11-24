/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/supabase.js - Cliente Supabase com Suporte Automático a Modo Local / Nuvem
 * Permite acesso imediato sem bloqueios, e integração transparente com Supabase quando configurado.
 */

(function () {
  let client = null;

  // =========================================================================
  // BANCO DE DADOS LOCAL E PERSISTENTE (LOCALSTORAGE ENGINE)
  // Usado automaticamente quando o Supabase em nuvem não foi configurado.
  // =========================================================================

  class LocalStore {
    constructor() {
      this.initDefaultData();
    }

    get(table) {
      const data = localStorage.getItem(`olc_tbl_${table}`);
      return data ? JSON.parse(data) : [];
    }

    set(table, rows) {
      localStorage.setItem(`olc_tbl_${table}`, JSON.stringify(rows));
      // Dispara evento para sincronizar entre abas
      window.dispatchEvent(new CustomEvent("olc-db-change", { detail: { table } }));
    }

    initDefaultData() {
      // 1. Inicializa contas autorizadas no motor local para testes e modo offline
      const localUsers = JSON.parse(localStorage.getItem("olc_local_users") || "[]");
      const defaultAccounts = [
        { id: "user-conta1", email: "conta1@ourlittlecorner.com", password: "123456@LoveCorner", displayName: "Meu Amor 1", username: "conta1" },
        { id: "user-conta2", email: "conta2@ourlittlecorner.com", password: "123456@LoveCorner", displayName: "Meu Amor 2", username: "conta2" },
        { id: "user-pedro", email: "pedro@gmail.com", password: "13052009", displayName: "Pedro", username: "pedro" },
        { id: "user-emilly", email: "emilly@gmail.com", password: "11042011", displayName: "Emilly", username: "emilly" }
      ];

      let usersUpdated = false;
      defaultAccounts.forEach(acc => {
        const existing = localUsers.find(u => u.email.toLowerCase() === acc.email.toLowerCase());
        if (!existing) {
          localUsers.push({
            id: acc.id,
            email: acc.email,
            password: acc.password,
            user_metadata: { display_name: acc.displayName, username: acc.username }
          });
          usersUpdated = true;
        } else if (existing.password !== acc.password) {
          existing.password = acc.password;
          usersUpdated = true;
        }
      });
      if (usersUpdated || !localStorage.getItem("olc_local_users")) {
        localStorage.setItem("olc_local_users", JSON.stringify(localUsers));
      }

      // 2. Inicializa perfis correspondentes
      let profiles = this.get("profiles");
      if (!profiles || profiles.length === 0) {
        profiles = defaultAccounts.map(acc => ({
          id: acc.id,
          email: acc.email,
          username: acc.username,
          display_name: acc.displayName,
          avatar_url: "",
          bio: "No nosso cantinho especial ♡",
          theme: "light",
          sound_enabled: true,
          sound_volume: 0.7,
          relationship_start_date: "2024-01-01",
          created_at: new Date().toISOString()
        }));
        this.set("profiles", profiles);
      } else {
        let profilesChanged = false;
        defaultAccounts.forEach(acc => {
          if (!profiles.some(p => p.email.toLowerCase() === acc.email.toLowerCase())) {
            profiles.push({
              id: acc.id,
              email: acc.email,
              username: acc.username,
              display_name: acc.displayName,
              avatar_url: "",
              bio: "No nosso cantinho especial ♡",
              theme: "light",
              sound_enabled: true,
              sound_volume: 0.7,
              relationship_start_date: "2024-01-01",
              created_at: new Date().toISOString()
            });
            profilesChanged = true;
          }
        });
        if (profilesChanged) this.set("profiles", profiles);
      }

      if (!localStorage.getItem("olc_tbl_letters")) {
        this.set("letters", [
          {
            id: "letter-demo-1",
            sender_id: "demo-user-1",
            recipient_id: "demo-user-2",
            title: "Bem-vindo(a) ao Nosso Cantinho! ♡",
            content: "Meu amor,\n\nEste é o nosso pequeno refúgio digital. Um espaço feito só para nós dois, onde nenhuma pressa do mundo lá fora tem vez.\n\nAqui nós podemos escrever cartas longas, rabiscar desenhos bobos, mandar recadinhos no mural e guardar todas as nossas memórias mais doces.\n\nEspero que cada vez que você abrir este cantinho, sinta todo o meu carinho te abraçando.\n\nCom todo o meu amor para sempre,\nSeu Dengo ♡",
            paper_style: "floral",
            font_family: "handwriting",
            font_size: "medium",
            text_color: "#765D6C",
            text_align: "left",
            decorations: ["🌸", "💌", "💖"],
            attachments: [],
            status: "sent",
            is_favorite: true,
            is_read: false,
            created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            sent_at: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ]);
      }

      if (!localStorage.getItem("olc_tbl_gifts")) {
        this.set("gifts", [
          {
            id: "gift-demo-1",
            sender_id: "demo-user-1",
            recipient_id: "demo-user-2",
            gift_type: "coupon",
            title: "Vale Cafuné Sem Hora pra Acabar",
            message: "Válido para um cafuné bem gostoso no sofá ouvindo nossa música favorita.",
            color: "#F4B8CC",
            is_redeemed: false,
            is_opened: true,
            is_favorite: true,
            created_at: new Date(Date.now() - 3600000 * 5).toISOString()
          },
          {
            id: "gift-demo-2",
            sender_id: "demo-user-1",
            recipient_id: "demo-user-2",
            gift_type: "surprise",
            title: "Uma Pequena Surpresa Para Você",
            message: "Você é o motivo do meu sorriso mais sincero todos os dias. Te amo infinito! ♡",
            color: "#E5D8F5",
            is_redeemed: false,
            is_opened: false,
            is_favorite: false,
            created_at: new Date(Date.now() - 3600000 * 12).toISOString()
          }
        ]);
      }

      if (!localStorage.getItem("olc_tbl_wall_posts")) {
        this.set("wall_posts", [
          {
            id: "wall-demo-1",
            author_id: "demo-user-1",
            post_type: "note",
            content: "Lembrete do dia: você é incrível, doce e a melhor parte de mim! ♡",
            color: "#FFF4E8",
            rotation: -2,
            is_favorite: false,
            created_at: new Date(Date.now() - 3600000 * 8).toISOString()
          }
        ]);
      }

      if (!localStorage.getItem("olc_tbl_calendar_events")) {
        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 7);
        const dateStr = nextMonth.toISOString().split("T")[0];

        this.set("calendar_events", [
          {
            id: "cal-demo-1",
            created_by: "demo-user-1",
            title: "Nosso Jantar Romântico & Cinema em Casa",
            event_date: dateStr,
            category: "date",
            description: "Noite especial com pizza caseira, vinho e nosso filme favorito.",
            created_at: new Date().toISOString()
          }
        ]);
      }

      if (!localStorage.getItem("olc_tbl_secret_vault")) {
        this.set("secret_vault", [
          {
            id: "vow-demo-1",
            author_id: "demo-user-1",
            title: "Minha Promessa Eterna",
            category: "vow",
            secret_content: "Prometo segurar a sua mão em todos os dias de sol e também nos dias de tempestade. Estarei sempre aqui.",
            is_favorite: true,
            created_at: new Date().toISOString()
          }
        ]);
      }
    }
  }

  const localStore = new LocalStore();

  // Query Builder Simulado compatível com Supabase
  class LocalQueryBuilder {
    constructor(table) {
      this.table = table;
      this.filters = [];
      this.orderConfig = null;
      this.limitCount = null;
      this.isSingle = false;
      this.isMaybeSingle = false;
      this.action = "select";
      this.payload = null;
      this.withCount = false;
      this.countOnly = false;
    }

    select(fields = "*", opts = {}) {
      if (opts && opts.count === "exact") {
        this.withCount = true;
        if (opts.head) this.countOnly = true;
      }
      return this;
    }

    eq(col, val) {
      this.filters.push(item => item[col] === val);
      return this;
    }

    neq(col, val) {
      this.filters.push(item => item[col] !== val);
      return this;
    }

    not(col, op, val) {
      if (op === "eq") {
        this.filters.push(item => item[col] !== val);
      } else if (op === "is") {
        this.filters.push(item => item[col] !== null && item[col] !== undefined);
      }
      return this;
    }

    order(col, { ascending = true } = {}) {
      this.orderConfig = { col, ascending };
      return this;
    }

    limit(n) {
      this.limitCount = n;
      return this;
    }

    single() {
      this.isSingle = true;
      return this.exec();
    }

    maybeSingle() {
      this.isMaybeSingle = true;
      return this.exec();
    }

    insert(data) {
      this.action = "insert";
      this.payload = data;
      return this;
    }

    update(data) {
      this.action = "update";
      this.payload = data;
      return this;
    }

    delete() {
      this.action = "delete";
      return this;
    }

    then(resolve, reject) {
      return this.exec().then(resolve, reject);
    }

    async exec() {
      let rows = localStore.get(this.table);

      // INSERT
      if (this.action === "insert") {
        const item = {
          id: (this.payload && this.payload.id) ? this.payload.id : `${this.table}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          created_at: new Date().toISOString(),
          ...this.payload
        };
        rows.unshift(item);
        localStore.set(this.table, rows);
        return { data: item, error: null };
      }

      // UPDATE
      if (this.action === "update") {
        let updated = null;
        rows = rows.map(r => {
          let match = true;
          for (const f of this.filters) {
            if (!f(r)) { match = false; break; }
          }
          if (match) {
            updated = { ...r, ...this.payload, updated_at: new Date().toISOString() };
            return updated;
          }
          return r;
        });
        localStore.set(this.table, rows);
        return { data: updated, error: null };
      }

      // DELETE
      if (this.action === "delete") {
        const beforeLen = rows.length;
        rows = rows.filter(r => {
          for (const f of this.filters) {
            if (f(r)) return false;
          }
          return true;
        });
        localStore.set(this.table, rows);
        return { data: null, error: null };
      }

      // SELECT
      let result = rows.filter(r => {
        for (const f of this.filters) {
          if (!f(r)) return false;
        }
        return true;
      });

      const count = result.length;
      if (this.countOnly) {
        return { data: null, count, error: null };
      }

      // Ordenação
      if (this.orderConfig) {
        const { col, ascending } = this.orderConfig;
        result.sort((a, b) => {
          if (a[col] < b[col]) return ascending ? -1 : 1;
          if (a[col] > b[col]) return ascending ? 1 : -1;
          return 0;
        });
      }

      // Limite
      if (this.limitCount) {
        result = result.slice(0, this.limitCount);
      }

      // Preenche joins relacionais automáticos (sender, recipient, author)
      const profiles = localStore.get("profiles");
      result = result.map(item => {
        const copy = { ...item };
        if (copy.sender_id) {
          copy.sender = profiles.find(p => p.id === copy.sender_id) || { display_name: "Amor" };
          copy.profiles = copy.sender;
        }
        if (copy.recipient_id) {
          copy.recipient = profiles.find(p => p.id === copy.recipient_id) || { display_name: "Amor" };
        }
        if (copy.author_id) {
          copy.author = profiles.find(p => p.id === copy.author_id) || { display_name: "Amor" };
        }
        return copy;
      });

      if (this.isSingle) {
        return { data: result[0] || null, error: result[0] ? null : new Error("Item não encontrado") };
      }
      if (this.isMaybeSingle) {
        return { data: result[0] || null, error: null };
      }

      return { data: result, count, error: null };
    }
  }

  // Cliente Local Simulado
  const localClient = {
    isLocal: true,

    from(table) {
      return new LocalQueryBuilder(table);
    },

    async rpc(fnName) {
      if (fnName === "is_registration_open") {
        const profiles = localStore.get("profiles");
        return { data: profiles.length < 2, error: null };
      }
      return { data: true, error: null };
    },

    auth: {
      async getSession() {
        const session = localStorage.getItem("olc_local_session");
        return { data: { session: session ? JSON.parse(session) : null }, error: null };
      },

      async getUser() {
        const session = localStorage.getItem("olc_local_session");
        return { data: { user: session ? JSON.parse(session).user : null }, error: null };
      },

      async signInWithPassword({ email, password }) {
        const users = JSON.parse(localStorage.getItem("olc_local_users") || "[]");
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!found || found.password !== password) {
          throw new Error("E-mail ou senha incorretos.");
        }

        const session = {
          user: { id: found.id, email: found.email, user_metadata: found.user_metadata }
        };
        localStorage.setItem("olc_local_session", JSON.stringify(session));
        return { data: { session, user: session.user }, error: null };
      },

      async signUp({ email, password, options }) {
        const users = JSON.parse(localStorage.getItem("olc_local_users") || "[]");

        if (users.length >= 2) {
          throw new Error("Limite de 2 contas atingido. Novos cadastros estão bloqueados.");
        }

        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          throw new Error("Este e-mail já está cadastrado.");
        }

        const id = `user-${Date.now()}`;
        const meta = (options && options.data) ? options.data : {};
        const newUser = {
          id,
          email,
          password,
          user_metadata: meta
        };

        users.push(newUser);
        localStorage.setItem("olc_local_users", JSON.stringify(users));

        // Cria perfil correspondente
        const profiles = localStore.get("profiles");
        profiles.push({
          id,
          email,
          username: meta.username || email.split("@")[0],
          display_name: meta.display_name || email.split("@")[0],
          avatar_url: meta.avatar_url || "",
          bio: "No nosso cantinho especial ♡",
          theme: "light",
          sound_enabled: true,
          sound_volume: 0.7,
          relationship_start_date: "2024-01-01",
          created_at: new Date().toISOString()
        });
        localStore.set("profiles", profiles);

        const session = { user: { id, email, user_metadata: meta } };
        localStorage.setItem("olc_local_session", JSON.stringify(session));
        return { data: { session, user: session.user }, error: null };
      },

      async signOut() {
        localStorage.removeItem("olc_local_session");
        return { error: null };
      },

      async updateUser(updates) {
        const session = JSON.parse(localStorage.getItem("olc_local_session") || "null");
        if (!session) throw new Error("Não autenticado.");

        const users = JSON.parse(localStorage.getItem("olc_local_users") || "[]");
        const idx = users.findIndex(u => u.id === session.user.id);
        if (idx !== -1) {
          if (updates.email) {
            users[idx].email = updates.email;
            session.user.email = updates.email;
          }
          if (updates.password) {
            users[idx].password = updates.password;
          }
          localStorage.setItem("olc_local_users", JSON.stringify(users));
          localStorage.setItem("olc_local_session", JSON.stringify(session));

          // Atualiza email no profiles
          if (updates.email) {
            const profiles = localStore.get("profiles");
            const pIdx = profiles.findIndex(p => p.id === session.user.id);
            if (pIdx !== -1) {
              profiles[pIdx].email = updates.email;
              localStore.set("profiles", profiles);
            }
          }
        }
        return { data: { user: session.user }, error: null };
      },

      async resetPasswordForEmail(email) {
        return { data: true, error: null };
      }
    },

    channel(name) {
      let broadcastChannel = null;
      try {
        if (typeof BroadcastChannel !== "undefined") {
          broadcastChannel = new BroadcastChannel(`olc_${name}`);
        }
      } catch (e) {}

      const callbacks = {};

      if (broadcastChannel) {
        broadcastChannel.onmessage = (e) => {
          const { event, payload } = e.data || {};
          if (callbacks[event]) {
            callbacks[event].forEach(cb => cb({ payload }));
          }
        };
      }

      const channelObj = {
        on(type, filter, handler) {
          let eventKey = "*";
          if (typeof filter === "string") eventKey = filter;
          else if (filter && filter.event) eventKey = filter.event;

          if (!callbacks[eventKey]) callbacks[eventKey] = [];
          callbacks[eventKey].push(handler);
          return channelObj;
        },
        subscribe(cb) {
          if (cb) cb("SUBSCRIBED");
          return channelObj;
        },
        send(msg) {
          if (broadcastChannel && msg && msg.payload) {
            try {
              broadcastChannel.postMessage({
                event: msg.event,
                payload: msg.payload
              });
            } catch (e) {}
          }
        }
      };

      return channelObj;
    }
  };

  function initSupabase() {
    if (!window.CONFIG) return localClient;

    // Se estiver configurado com credenciais válidas e SDK disponível
    if (window.CONFIG.isConfigured() && window.supabase) {
      const url = window.CONFIG.getUrl();
      const key = window.CONFIG.getAnonKey();

      try {
        client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: "our_little_corner_auth_token"
          },
          realtime: {
            params: { eventsPerSecond: 20 }
          }
        });
        return client;
      } catch (err) {
        console.warn("Erro ao instanciar Supabase em nuvem, usando modo local:", err);
      }
    }

    // Fallback gracioso: modo local 100% funcional sem bloquear o usuário!
    return localClient;
  }

  // Objeto global de integração
  window.DB = {
    getClient() {
      if (!client) {
        client = initSupabase();
      }
      return client;
    },

    isReady() {
      return true;
    },

    // Upload seguro compatível tanto com Supabase Storage quanto com Modo Local (Base64)
    async uploadFile(bucket, path, fileOrBlob) {
      const supabase = this.getClient();

      // Se for cliente Supabase real
      if (supabase && !supabase.isLocal && supabase.storage) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, fileOrBlob, { cacheControl: "3600", upsert: true });

          if (!error) {
            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path);
            return publicData.publicUrl;
          }
        } catch (e) {
          console.warn("Fallback de storage para local:", e);
        }
      }

      // Modo Local: converte para dataURL diretamente
      return new Promise((resolve, reject) => {
        if (typeof fileOrBlob === "string") {
          resolve(fileOrBlob);
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(fileOrBlob);
      });
    },

    async uploadDataUrl(bucket, fileName, dataUrl) {
      const supabase = this.getClient();
      if (supabase && !supabase.isLocal && supabase.storage) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return await this.uploadFile(bucket, fileName, blob);
      }
      return dataUrl;
    },

    // Modal opcional de conexão ao Supabase (abre somente se o usuário clicar para conectar)
    showSetupNotice() {
      if (document.getElementById("supabase-setup-modal")) return;

      const modal = document.createElement("div");
      modal.id = "supabase-setup-modal";
      modal.className = "olc-modal-overlay active";
      modal.innerHTML = `
        <div class="olc-modal-card" style="max-width: 560px;">
          <div class="olc-modal-header">
            <span class="olc-modal-icon">☁️</span>
            <h3 style="font-family: 'Playfair Display', serif; color: var(--color-text); margin: 0;">Conectar Supabase em Nuvem</h3>
            <button type="button" class="olc-modal-close" onclick="document.getElementById('supabase-setup-modal').remove()">✕</button>
          </div>
          <div class="olc-modal-body" style="font-size: 0.95rem; line-height: 1.6; color: var(--color-text);">
            <p>Se quiser sincronizar automaticamente entre diferentes celulares e computadores pela internet, informe as chaves do seu projeto <strong>Supabase</strong> (opcional):</p>
            
            <form id="olc-setup-form" style="display: flex; flex-direction: column; gap: 12px; margin-top: 15px;">
              <div>
                <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Supabase Project URL:</label>
                <input type="url" id="setup-supabase-url" required placeholder="https://exemplo.supabase.co" class="olc-input" style="width: 100%;">
              </div>
              <div>
                <label style="display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 4px;">Supabase Anon / Public Key:</label>
                <input type="password" id="setup-supabase-key" required placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." class="olc-input" style="width: 100%;">
              </div>
              <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
                <button type="button" class="olc-btn olc-btn-outline" onclick="document.getElementById('supabase-setup-modal').remove()">
                  Continuar no Modo Local
                </button>
                <button type="submit" class="olc-btn olc-btn-primary">
                  Salvar e Conectar ♡
                </button>
              </div>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const form = document.getElementById("olc-setup-form");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const url = document.getElementById("setup-supabase-url").value.trim();
        const key = document.getElementById("setup-supabase-key").value.trim();

        if (url && key) {
          window.CONFIG.saveCredentials(url, key);
          if (window.romanticAudio) window.romanticAudio.playChime();
          alert("✨ Credenciais salvas com sucesso! Recarregando...");
          window.location.reload();
        }
      });
    }
  };

  if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      initSupabase();
    });
  }
})();
