/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/cartas.js - Gerenciamento da Caixa de Cartas e Leitor de Envelopes
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("cartas");

  let currentCategory = "todas";
  let searchQuery = "";
  let allLetters = [];
  let currentLetter = null;

  const gridEl = document.getElementById("cartas-grid");
  const searchInput = document.getElementById("search-letters-input");
  const tabBtns = document.querySelectorAll(".carta-tab-btn");

  // Abas de filtro
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentCategory = btn.getAttribute("data-tab");
      if (window.romanticAudio) window.romanticAudio.playPop();
      renderLetters();
    });
  });

  // Busca textual
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderLetters();
    });
  }

  // Carrega cartas do Supabase
  async function fetchLetters() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("letters")
        .select(`
          *,
          sender:profiles!letters_sender_id_fkey(id, display_name, username, avatar_url),
          recipient:profiles!letters_recipient_id_fkey(id, display_name, username, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      allLetters = data || [];
      renderLetters();

      // Checa se há ID na URL para abrir diretamente
      const urlParams = new URLSearchParams(window.location.search);
      const letterId = urlParams.get("id");
      if (letterId) {
        const target = allLetters.find(l => l.id === letterId);
        if (target) openLetterReader(target);
      }
    } catch (err) {
      console.error("Erro ao buscar cartas:", err);
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">💔</span>
          <p class="olc-empty-title">Erro ao carregar cartas</p>
          <p class="olc-empty-desc">${err.message}</p>
        </div>
      `;
    }
  }

  // Renderiza as cartas filtradas
  function renderLetters() {
    let filtered = allLetters.filter(l => {
      // Filtro de categoria
      if (currentCategory === "recebidas") {
        return l.status === "sent" && l.recipient_id === profile.id;
      }
      if (currentCategory === "enviadas") {
        return l.status === "sent" && l.sender_id === profile.id;
      }
      if (currentCategory === "rascunhos") {
        return l.status === "draft" && l.sender_id === profile.id;
      }
      if (currentCategory === "favoritas") {
        return !!l.is_favorite;
      }
      if (currentCategory === "arquivadas") {
        return l.status === "archived";
      }
      return true; // 'todas'
    });

    // Filtro de pesquisa
    if (searchQuery) {
      filtered = filtered.filter(l => 
        (l.title && l.title.toLowerCase().includes(searchQuery)) ||
        (l.content && l.content.toLowerCase().includes(searchQuery))
      );
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">💌</span>
          <p class="olc-empty-title">Nenhuma carta encontrada</p>
          <p class="olc-empty-desc">Não há cartas nesta categoria no momento. Que tal escrever uma nova?</p>
          <a href="editor-carta.html" class="olc-btn olc-btn-primary">Escrever Nova Carta ♡</a>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filtered.map(l => {
      const isSender = l.sender_id === profile.id;
      const isUnread = !isSender && l.status === "sent" && !l.is_read;
      const otherPersonName = isSender 
        ? (l.recipient ? l.recipient.display_name : "Seu Amor")
        : (l.sender ? l.sender.display_name : "Seu Amor");

      const paperInfo = window.UTILS.PAPERS.find(p => p.id === l.paper_style) || window.UTILS.PAPERS[0];

      return `
        <div class="letter-item-card ${isUnread ? 'unread' : ''}" onclick="window.openLetter('${l.id}')">
          <div class="letter-stamp-decor" title="Papel: ${paperInfo.name}">
            💌
          </div>

          <div class="letter-card-header">
            ${isUnread ? '<span class="olc-badge olc-badge-primary">Não Lida</span>' : ''}
            ${l.status === 'draft' ? '<span class="olc-badge olc-badge-cream">Rascunho</span>' : ''}
            ${l.is_favorite ? '<span title="Favoritada">❤️</span>' : ''}
          </div>

          <h3 class="letter-card-title">${window.UTILS.escapeHtml(l.title || "Carta sem título")}</h3>
          
          <div class="letter-card-snippet font-handwriting">
            ${window.UTILS.escapeHtml(l.content || "(Sem conteúdo escrito)")}
          </div>

          <div class="letter-card-footer">
            <span>${isSender ? 'Para: ' : 'De: '} <strong>${window.UTILS.escapeHtml(otherPersonName)}</strong></span>
            <span>${window.UTILS.formatRelativeTime(l.sent_at || l.created_at)}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // Abre o leitor de carta
  window.openLetter = function(letterId) {
    const letter = allLetters.find(l => l.id === letterId);
    if (!letter) return;
    openLetterReader(letter);
  };

  async function openLetterReader(letter) {
    currentLetter = letter;
    const isRecipient = letter.recipient_id === profile.id;
    const isUnread = isRecipient && !letter.is_read;

    // Efeito sonoro romântico de abertura
    if (window.romanticAudio) {
      if (isUnread) {
        window.romanticAudio.playEnvelopeOpen();
      } else {
        window.romanticAudio.playPaperRustle();
      }
    }

    // Se for não lida, atualiza no banco
    if (isUnread) {
      letter.is_read = true;
      letter.read_at = new Date().toISOString();
      const supabase = window.DB.getClient();
      await supabase.from("letters").update({
        is_read: true,
        read_at: letter.read_at
      }).eq("id", letter.id);
      window.NAV.refreshUnreadLetterCount();
      renderLetters();
    }

    const modal = document.getElementById("letter-reader-modal");
    const paperContainer = document.getElementById("reader-paper-container");
    const senderNameEl = document.getElementById("reader-sender-name");
    const sentDateEl = document.getElementById("reader-sent-date");
    const favBtn = document.getElementById("reader-fav-btn");
    const replyBtn = document.getElementById("reader-reply-btn");
    const editBtn = document.getElementById("reader-edit-btn");
    const versionsBtn = document.getElementById("reader-versions-btn");

    const senderName = letter.sender ? letter.sender.display_name : "Seu Amor";
    senderNameEl.textContent = `De: ${senderName}`;
    sentDateEl.textContent = `${window.UTILS.formatDate(letter.sent_at || letter.created_at)}${letter.is_read && letter.read_at ? ' • Lida em ' + window.UTILS.formatShortDateTime(letter.read_at) : ''}`;

    // Estilo do Papel
    paperContainer.className = `olc-letter-paper paper-${letter.paper_style || 'cream'}`;

    // Conteúdo da carta
    const fontClass = `font-${letter.font_family || 'handwriting'}`;
    const textAlign = letter.text_align || 'left';
    const textColor = letter.text_color || '#765D6C';

    // Adesivos decorativos
    let stickersHtml = "";
    if (Array.isArray(letter.decorations) && letter.decorations.length > 0) {
      stickersHtml = `<div style="display:flex; gap:10px; margin-bottom:15px; font-size:1.8rem;">
        ${letter.decorations.map(d => `<span>${d.icon || d}</span>`).join("")}
      </div>`;
    }

    // Fotos anexadas
    let attachmentsHtml = "";
    if (Array.isArray(letter.attachments) && letter.attachments.length > 0) {
      attachmentsHtml = `
        <div style="display:flex; flex-wrap:wrap; gap:14px; margin-top:24px;">
          ${letter.attachments.map(url => `
            <div class="olc-polaroid" style="max-width:200px;">
              <div class="olc-washi-tape"></div>
              <img src="${url}" class="olc-polaroid-img" style="aspect-ratio:1/1;">
            </div>
          `).join("")}
        </div>
      `;
    }

    paperContainer.innerHTML = `
      ${stickersHtml}
      <h2 style="font-family: var(--font-title); font-size: 1.8rem; margin-bottom: 20px; color: ${textColor}; text-align: ${textAlign};">
        ${window.UTILS.escapeHtml(letter.title)}
      </h2>
      <div class="${fontClass}" style="font-size: 1.45rem; line-height: 1.7; color: ${textColor}; text-align: ${textAlign}; white-space: pre-wrap;">
        ${window.UTILS.escapeHtml(letter.content)}
      </div>
      ${attachmentsHtml}
    `;

    // Atualiza botão de favoritar
    favBtn.innerHTML = letter.is_favorite ? "❤️ Favoritada" : "🤍 Favoritar";

    // Mostra/oculta botão de editar (somente autor pode editar)
    if (letter.sender_id === profile.id) {
      editBtn.style.display = "inline-flex";
      editBtn.onclick = () => window.location.href = `editor-carta.html?id=${letter.id}`;
    } else {
      editBtn.style.display = "none";
    }

    // Botão responder
    replyBtn.onclick = () => {
      window.location.href = `editor-carta.html?replyTo=${letter.id}&title=${encodeURIComponent('Re: ' + letter.title)}`;
    };

    // Histórico de versões
    versionsBtn.onclick = () => showVersionHistory(letter.id);

    modal.classList.add("active");
  }

  // Toggle Favoritar
  const favBtn = document.getElementById("reader-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      if (!currentLetter) return;
      currentLetter.is_favorite = !currentLetter.is_favorite;
      favBtn.innerHTML = currentLetter.is_favorite ? "❤️ Favoritada" : "🤍 Favoritar";

      const supabase = window.DB.getClient();
      await supabase.from("letters").update({
        is_favorite: currentLetter.is_favorite
      }).eq("id", currentLetter.id);

      if (currentLetter.is_favorite && window.romanticAudio) {
        window.romanticAudio.playChime();
        window.UTILS.showToast("Carta adicionada às suas lembranças favoritas! ♡", "success");
      }
      renderLetters();
    });
  }

  // Fechar Modal Leitor
  const closeBtn = document.getElementById("reader-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("letter-reader-modal").classList.remove("active");
    });
  }

  // Histórico de Versões
  async function showVersionHistory(letterId) {
    const supabase = window.DB.getClient();
    const { data: versions } = await supabase
      .from("letter_versions")
      .select("*")
      .eq("letter_id", letterId)
      .order("version_number", { ascending: false });

    let content = "";
    if (!versions || versions.length === 0) {
      content = "<p>Nenhuma versão anterior registrada desta carta.</p>";
    } else {
      content = versions.map(v => `
        <div style="background:var(--color-cream); padding:12px; border-radius:8px; margin-bottom:10px; border:1px dashed var(--border-color);">
          <strong>Versão ${v.version_number}</strong> — <small>${window.UTILS.formatShortDateTime(v.saved_at)}</small>
          <div style="font-family:var(--font-handwriting); font-size:1.15rem; margin-top:6px; color:var(--color-text);">
            ${window.UTILS.escapeHtml(v.content.substring(0, 140))}...
          </div>
        </div>
      `).join("");
    }

    const vModal = document.getElementById("version-history-modal");
    document.getElementById("version-history-content").innerHTML = content;
    vModal.classList.add("active");
  }

  const vCloseBtn = document.getElementById("version-close-btn");
  if (vCloseBtn) {
    vCloseBtn.addEventListener("click", () => {
      document.getElementById("version-history-modal").classList.remove("active");
    });
  }

  // Inicia busca
  fetchLetters();
});

