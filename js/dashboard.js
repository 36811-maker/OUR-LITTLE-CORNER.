/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/dashboard.js - Lógica da Página Inicial (Painel do Casal)
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Guarda de autenticação
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  // 2. Inicializa barra de navegação
  window.NAV.init("dashboard");

  // 3. Saudação e Data
  const greetingEl = document.getElementById("dash-greeting");
  const dateEl = document.getElementById("dash-date");
  const quoteEl = document.getElementById("dash-quote-text");

  const hour = new Date().getHours();
  let timeGreeting = "Bom dia";
  if (hour >= 12 && hour < 18) timeGreeting = "Boa tarde";
  else if (hour >= 18 || hour < 5) timeGreeting = "Boa noite";

  greetingEl.textContent = `${timeGreeting}, ${profile.display_name || profile.username}! ♡`;
  dateEl.textContent = window.UTILS.formatDate(new Date().toISOString());
  quoteEl.textContent = window.UTILS.getRandomQuote();

  // 4. Contador de Dias Juntos
  const relationshipDate = profile.relationship_start_date || "2024-01-01";
  function updateCounter() {
    const { days, hours, minutes, seconds } = window.UTILS.calcDaysTogether(relationshipDate);
    const dEl = document.getElementById("count-days");
    const hEl = document.getElementById("count-hours");
    const mEl = document.getElementById("count-minutes");
    const sEl = document.getElementById("count-seconds");

    if (dEl) dEl.textContent = days;
    if (hEl) hEl.textContent = String(hours).padStart(2, "0");
    if (mEl) mEl.textContent = String(minutes).padStart(2, "0");
    if (sEl) sEl.textContent = String(seconds).padStart(2, "0");
  }
  updateCounter();
  setInterval(updateCounter, 1000);

  // 5. Carregar Métricas e Dados do Banco
  await loadDashboardStats(profile.id);
  await loadRecentLetters(profile.id);
  await loadRecentCreations();

  // 6. Envio de Recadinho Rápido
  const quickNoteForm = document.getElementById("quick-note-form");
  if (quickNoteForm) {
    quickNoteForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const textEl = document.getElementById("quick-note-text");
      const text = textEl.value.trim();
      if (!text) return;

      const submitBtn = quickNoteForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;

      try {
        const supabase = window.DB.getClient();
        const partner = await window.AUTH.getPartnerProfile();

        // Salva no mural de recados
        const { error } = await supabase.from("wall_posts").insert({
          author_id: profile.id,
          post_type: "note",
          content: text,
          color: "#FFF4E8",
          rotation: (Math.random() * 6 - 3)
        });

        if (error) throw error;

        // Se o parceiro existir, gera notificação direta
        if (partner) {
          await supabase.from("notifications").insert({
            user_id: partner.id,
            sender_id: profile.id,
            type: "wall",
            title: "Novo bilhetinho carinhoso! ♡",
            message: `${profile.display_name}: "${text.length > 50 ? text.substring(0, 50) + '...' : text}"`,
            link_url: "mural.html"
          });
        }

        textEl.value = "";
        window.UTILS.showToast("Bilhetinho enviado para o cantinho! ♡", "success");
        if (window.romanticAudio) window.romanticAudio.playChime();
      } catch (err) {
        console.error("Erro ao enviar bilhete:", err);
        window.UTILS.showToast("Não foi possível enviar o bilhete.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});

// Busca contadores de cartas, desenhos e presentes
async function loadDashboardStats(userId) {
  const supabase = window.DB.getClient();
  if (!supabase) return;

  try {
    // 1. Cartas recebidas
    const { count: recLetters } = await supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("recipient_id", userId);

    // 2. Cartas enviadas
    const { count: sentLetters } = await supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .eq("sender_id", userId);

    // 3. Desenhos
    const { count: totalDrawings } = await supabase
      .from("drawings")
      .select("id", { count: "exact", head: true });

    // 4. Presentes
    const { count: totalGifts } = await supabase
      .from("gifts")
      .select("id", { count: "exact", head: true });

    const elRec = document.getElementById("stat-letters-received");
    const elSent = document.getElementById("stat-letters-sent");
    const elDraw = document.getElementById("stat-drawings");
    const elGift = document.getElementById("stat-gifts");

    if (elRec) elRec.textContent = recLetters || 0;
    if (elSent) elSent.textContent = sentLetters || 0;
    if (elDraw) elDraw.textContent = totalDrawings || 0;
    if (elGift) elGift.textContent = totalGifts || 0;
  } catch (e) {
    console.warn("Erro ao buscar estatísticas do dashboard:", e);
  }
}

// Busca as últimas cartas recebidas
async function loadRecentLetters(userId) {
  const listEl = document.getElementById("dash-recent-letters");
  if (!listEl) return;

  const supabase = window.DB.getClient();
  if (!supabase) return;

  try {
    const { data: letters, error } = await supabase
      .from("letters")
      .select("id, title, is_read, sent_at, sender_id, profiles!letters_sender_id_fkey(display_name)")
      .eq("status", "sent")
      .eq("recipient_id", userId)
      .order("sent_at", { ascending: false })
      .limit(4);

    if (error || !letters || letters.length === 0) {
      listEl.innerHTML = `
        <div class="olc-empty-state" style="padding: 24px 10px;">
          <span class="olc-empty-icon" style="font-size: 2.2rem;">💌</span>
          <p class="olc-empty-title" style="font-size: 1.1rem;">Nenhuma carta nova ainda</p>
          <p class="olc-empty-desc" style="font-size: 0.85rem; margin-bottom: 0;">Que tal surpreender seu amor escrevendo uma cartinha agora?</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = letters.map(l => {
      const senderName = l.profiles ? l.profiles.display_name : "Seu Amor";
      return `
        <a href="cartas.html?id=${l.id}" class="recent-letter-card">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${!l.is_read ? '<div class="letter-status-dot" title="Não lida"></div>' : '<span style="font-size: 1.2rem;">✉️</span>'}
            <div>
              <strong style="color: var(--color-text); font-size: 0.95rem;">${window.UTILS.escapeHtml(l.title)}</strong>
              <div style="font-size: 0.78rem; color: var(--color-text-muted);">
                De ${window.UTILS.escapeHtml(senderName)} • ${window.UTILS.formatRelativeTime(l.sent_at)}
              </div>
            </div>
          </div>
          <span style="font-size: 0.82rem; font-weight: 700; color: #B54F70;">Abrir ♡</span>
        </a>
      `;
    }).join("");
  } catch (err) {
    console.error("Erro ao carregar cartas recentes:", err);
  }
}

// Busca últimas criações visuais (desenhos e fotos do mural)
async function loadRecentCreations() {
  const container = document.getElementById("dash-recent-creations");
  if (!container) return;

  const supabase = window.DB.getClient();
  if (!supabase) return;

  try {
    const { data: drawings, error } = await supabase
      .from("drawings")
      .select("id, title, image_url, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error || !drawings || drawings.length === 0) {
      container.innerHTML = `
        <div class="olc-empty-state" style="padding: 20px 10px;">
          <span class="olc-empty-icon" style="font-size: 2rem;">🎨</span>
          <p class="olc-empty-title" style="font-size: 1rem;">Nenhum desenho recente</p>
          <a href="desenhos.html" class="olc-btn olc-btn-outline" style="font-size: 0.8rem; padding: 6px 14px; margin-top: 8px;">
            Criar Desenho
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 14px;">
        ${drawings.map(d => `
          <a href="galeria.html" class="olc-polaroid" style="text-decoration: none;">
            <div class="olc-washi-tape"></div>
            <img src="${d.image_url}" alt="${window.UTILS.escapeHtml(d.title)}" class="olc-polaroid-img" style="aspect-ratio: 1/1;">
            <div class="olc-polaroid-caption" style="font-size: 1rem; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${window.UTILS.escapeHtml(d.title)}
            </div>
          </a>
        `).join("")}
      </div>
    `;
  } catch (e) {
    console.warn("Erro ao buscar criações recentes:", e);
  }
}

