/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/nav.js - Injetor Dinâmico da Barra Lateral e Navegação Responsiva com Realtime
 */

window.NAV = {
  activePage: "",

  init(pageName) {
    this.activePage = pageName || "";
    this.render();
    this.loadProfilesAndBadges();
    this.subscribeRealtimeAlerts();
  },

  render() {
    let container = document.getElementById("olc-nav-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "olc-nav-container";
      document.body.prepend(container);
    }

    const pages = [
      { id: "dashboard", href: "dashboard.html", icon: "🏡", label: "Início" },
      { id: "cartas", href: "cartas.html", icon: "💌", label: "Cartas", badgeId: "nav-badge-cartas" },
      { id: "editor", href: "editor-carta.html", icon: "✍️", label: "Escrever Carta" },
      { id: "desenhos", href: "desenhos.html", icon: "🎨", label: "Estúdio de Desenho" },
      { id: "galeria", href: "galeria.html", icon: "🖼️", label: "Nossa Galeria" },
      { id: "presentes", href: "presentes.html", icon: "🎁", label: "Presentes & Vales" },
      { id: "mural", href: "mural.html", icon: "📌", label: "Mural de Recados" },
      { id: "calendario", href: "calendario.html", icon: "🗓️", label: "Nosso Calendário" },
      { id: "lembrancas", href: "lembrancas.html", icon: "⭐", label: "Lembranças Favoritas" },
      { id: "secreto", href: "secreto.html", icon: "🗝️", label: "Página Secreta" },
      { id: "perfil", href: "perfil.html", icon: "🧸", label: "Perfil & Ajustes" }
    ];

    // Sidebar Desktop
    const sidebarHtml = `
      <aside class="olc-sidebar">
        <a href="dashboard.html" class="olc-sidebar-brand">
          <span class="olc-brand-logo">🌸</span>
          <div class="olc-brand-text">
            <h2>OUR LITTLE CORNER</h2>
            <span>nosso cantinho particular ♡</span>
          </div>
        </a>

        <!-- Cartão dos Dois Usuários -->
        <div class="olc-couple-card" id="sidebar-couple-card">
          <div class="olc-couple-avatar" id="sidebar-user-avatar" title="Seu Perfil">
            👤
          </div>
          <span class="olc-couple-heart" title="Conectados com amor">♡</span>
          <div class="olc-couple-avatar" id="sidebar-partner-avatar" title="Seu Amor">
            💖
          </div>
        </div>

        <!-- Menu de Links -->
        <nav class="olc-nav-menu">
          ${pages.map(p => `
            <a href="${p.href}" class="olc-nav-link ${this.activePage === p.id ? 'active' : ''}">
              <span class="olc-nav-icon">${p.icon}</span>
              <span>${p.label}</span>
              ${p.badgeId ? `<span class="olc-nav-badge" id="${p.badgeId}" style="display:none;">0</span>` : ''}
            </a>
          `).join("")}
        </nav>

        <!-- Rodapé da Sidebar com Som e Logout -->
        <div class="olc-sidebar-footer">
          <button class="olc-btn olc-btn-icon olc-btn-outline" id="nav-sound-btn" title="Alternar Sons" onclick="window.NAV.toggleSound()">
            ${window.romanticAudio && window.romanticAudio.enabled ? '🔔' : '🔕'}
          </button>
          <button class="olc-btn olc-btn-outline" style="font-size: 0.82rem; padding: 6px 14px;" onclick="window.AUTH.logout()">
            <span>Sair</span> 🚪
          </button>
        </div>
      </aside>
    `;

    // Header Mobile
    const mobileHeaderHtml = `
      <header class="olc-mobile-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.4rem;">🌸</span>
          <h2 style="font-family: var(--font-title); font-size: 1rem; margin: 0; color: var(--color-text);">OUR LITTLE CORNER</h2>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="olc-btn olc-btn-icon olc-btn-outline" style="width: 34px; height: 34px;" onclick="window.NAV.toggleSound()" id="nav-sound-mobile-btn">
            ${window.romanticAudio && window.romanticAudio.enabled ? '🔔' : '🔕'}
          </button>
          <a href="perfil.html" class="olc-couple-avatar" id="mobile-user-avatar" style="width: 34px; height: 34px; text-decoration: none;">
            👤
          </a>
        </div>
      </header>
    `;

    // Bottom Navigation Bar Mobile (principais abas)
    const mobileNavHtml = `
      <nav class="olc-mobile-nav">
        <a href="dashboard.html" class="olc-mobile-tab ${this.activePage === 'dashboard' ? 'active' : ''}">
          <span class="olc-mobile-tab-icon">🏡</span>
          <span>Início</span>
        </a>
        <a href="cartas.html" class="olc-mobile-tab ${this.activePage === 'cartas' ? 'active' : ''}">
          <span class="olc-mobile-tab-icon">💌</span>
          <span>Cartas</span>
        </a>
        <a href="editor-carta.html" class="olc-mobile-tab ${this.activePage === 'editor' ? 'active' : ''}">
          <span class="olc-mobile-tab-icon">✍️</span>
          <span>Escrever</span>
        </a>
        <a href="desenhos.html" class="olc-mobile-tab ${this.activePage === 'desenhos' ? 'active' : ''}">
          <span class="olc-mobile-tab-icon">🎨</span>
          <span>Desenhar</span>
        </a>
        <a href="mural.html" class="olc-mobile-tab ${this.activePage === 'mural' ? 'active' : ''}">
          <span class="olc-mobile-tab-icon">📌</span>
          <span>Mural</span>
        </a>
        <a href="perfil.html" class="olc-mobile-tab ${this.activePage === 'perfil' ? 'active' : ''}">
          <span class="olc-mobile-tab-icon">⚙️</span>
          <span>Mais</span>
        </a>
      </nav>
    `;

    container.innerHTML = sidebarHtml + mobileHeaderHtml + mobileNavHtml;
  },

  async loadProfilesAndBadges() {
    try {
      const userProfile = await window.AUTH.getCurrentProfile();
      const partnerProfile = await window.AUTH.getPartnerProfile();

      if (userProfile) {
        const uAvatar = document.getElementById("sidebar-user-avatar");
        const mAvatar = document.getElementById("mobile-user-avatar");
        if (userProfile.avatar_url) {
          if (uAvatar) uAvatar.innerHTML = `<img src="${userProfile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          if (mAvatar) mAvatar.innerHTML = `<img src="${userProfile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
          const initial = (userProfile.display_name || "V")[0].toUpperCase();
          if (uAvatar) uAvatar.textContent = initial;
          if (mAvatar) mAvatar.textContent = initial;
        }
      }

      if (partnerProfile) {
        const pAvatar = document.getElementById("sidebar-partner-avatar");
        if (pAvatar) {
          if (partnerProfile.avatar_url) {
            pAvatar.innerHTML = `<img src="${partnerProfile.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          } else {
            pAvatar.textContent = (partnerProfile.display_name || "A")[0].toUpperCase();
          }
          pAvatar.title = partnerProfile.display_name || "Seu Amor";
        }
      } else {
        const pAvatar = document.getElementById("sidebar-partner-avatar");
        if (pAvatar) pAvatar.title = "Aguardando cadastro da 2ª conta...";
      }

      // Buscar cartas não lidas
      this.refreshUnreadLetterCount();
    } catch (err) {
      console.warn("Erro ao carregar dados da navegação:", err);
    }
  },

  async refreshUnreadLetterCount() {
    const supabase = window.DB.getClient();
    const user = await window.AUTH.getUser();
    if (!supabase || !user) return;

    const { count, error } = await supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("is_read", false)
      .eq("recipient_id", user.id);

    if (!error && count > 0) {
      const badge = document.getElementById("nav-badge-cartas");
      if (badge) {
        badge.textContent = count;
        badge.style.display = "inline-block";
      }
    }
  },

  // Inscrição em tempo real para notificações
  subscribeRealtimeAlerts() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    supabase
      .channel("public-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "letters" },
        (payload) => {
          if (payload.new && payload.new.status === "sent") {
            window.NAV.refreshUnreadLetterCount();
            window.UTILS.showToast("💌 Uma nova cartinha acabou de chegar para você!", "info");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.new) {
            window.UTILS.showToast(`✨ ${payload.new.title}`, "info");
          }
        }
      )
      .subscribe();
  },

  toggleSound() {
    if (!window.romanticAudio) return;
    const isEnabled = !window.romanticAudio.enabled;
    window.romanticAudio.setEnabled(isEnabled);
    
    const icon = isEnabled ? "🔔" : "🔕";
    const btn = document.getElementById("nav-sound-btn");
    const mBtn = document.getElementById("nav-sound-mobile-btn");
    if (btn) btn.textContent = icon;
    if (mBtn) mBtn.textContent = icon;

    if (isEnabled) {
      window.romanticAudio.playChime();
      window.UTILS.showToast("Sons românticos ativados ♡", "info", 2000);
    } else {
      window.UTILS.showToast("Sons desativados.", "info", 2000);
    }
  }
};

