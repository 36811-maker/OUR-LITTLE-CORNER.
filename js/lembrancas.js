/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/lembrancas.js - Álbum de Lembranças e Conteúdos Favoritados
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("lembrancas");

  let currentTab = "todas";
  let favItems = [];

  const gridEl = document.getElementById("lembrancas-grid");
  const tabBtns = document.querySelectorAll(".lembranca-tab-btn");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.getAttribute("data-tab");
      if (window.romanticAudio) window.romanticAudio.playPop();
      renderFavorites();
    });
  });

  async function fetchFavorites() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      // 1. Cartas favoritas
      const { data: favLetters } = await supabase
        .from("letters")
        .select("id, title, content, created_at, sent_at, paper_style, sender:profiles!letters_sender_id_fkey(display_name)")
        .eq("is_favorite", true);

      // 2. Desenhos favoritos
      const { data: favDrawings } = await supabase
        .from("drawings")
        .select("id, title, image_url, created_at, author:profiles!drawings_author_id_fkey(display_name)")
        .eq("is_favorite", true);

      // 3. Fotos favoritas do mural
      const { data: favWall } = await supabase
        .from("wall_posts")
        .select("id, content, image_url, created_at, author:profiles!wall_posts_author_id_fkey(display_name)")
        .eq("is_favorite", true)
        .not("image_url", "eq", "");

      // 4. Presentes favoritos
      const { data: favGifts } = await supabase
        .from("gifts")
        .select("id, title, message, gift_type, color, created_at, sender:profiles!gifts_sender_id_fkey(display_name)")
        .eq("is_favorite", true);

      const unified = [];

      (favLetters || []).forEach(l => {
        unified.push({
          id: l.id,
          category: "carta",
          title: l.title,
          subtitle: l.content ? l.content.substring(0, 100) + "..." : "",
          date: l.sent_at || l.created_at,
          author: l.sender ? l.sender.display_name : "Amor",
          link: `cartas.html?id=${l.id}`,
          badge: "Carta de Amor 💌"
        });
      });

      (favDrawings || []).forEach(d => {
        unified.push({
          id: d.id,
          category: "imagem",
          title: d.title,
          image_url: d.image_url,
          date: d.created_at,
          author: d.author ? d.author.display_name : "Amor",
          link: "galeria.html",
          badge: "Desenho 🎨"
        });
      });

      (favWall || []).forEach(w => {
        unified.push({
          id: w.id,
          category: "imagem",
          title: w.content || "Nossa Memória",
          image_url: w.image_url,
          date: w.created_at,
          author: w.author ? w.author.display_name : "Amor",
          link: "galeria.html",
          badge: "Fotografia 📷"
        });
      });

      (favGifts || []).forEach(g => {
        unified.push({
          id: g.id,
          category: "presente",
          title: g.title,
          subtitle: g.message,
          date: g.created_at,
          author: g.sender ? g.sender.display_name : "Amor",
          link: "presentes.html",
          badge: "Presente 🎁"
        });
      });

      unified.sort((a, b) => new Date(b.date) - new Date(a.date));
      favItems = unified;
      renderFavorites();
    } catch (err) {
      console.error("Erro ao carregar lembranças:", err);
    }
  }

  function renderFavorites() {
    let filtered = favItems.filter(f => {
      if (currentTab === "cartas") return f.category === "carta";
      if (currentTab === "imagens") return f.category === "imagem";
      if (currentTab === "presentes") return f.category === "presente";
      return true;
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">⭐</span>
          <p class="olc-empty-title">Nenhuma lembrança favoritada ainda</p>
          <p class="olc-empty-desc">Conforme você favoritar cartas, fotos, desenhos e presentes no cantinho, eles ficarão guardados para sempre aqui! ♡</p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filtered.map(f => {
      if (f.image_url) {
        return `
          <a href="${f.link}" class="olc-polaroid" style="text-decoration: none;">
            <div class="olc-washi-tape"></div>
            <img src="${f.image_url}" class="olc-polaroid-img" alt="${window.UTILS.escapeHtml(f.title)}">
            <div class="olc-polaroid-caption" style="font-size: 1.15rem; margin-top: 10px;">
              ${window.UTILS.escapeHtml(f.title)}
            </div>
            <div class="polaroid-author-row">
              <span>Por <strong>${window.UTILS.escapeHtml(f.author)}</strong></span>
              <span>⭐ ${window.UTILS.formatDate(f.date)}</span>
            </div>
          </a>
        `;
      }

      return `
        <a href="${f.link}" class="olc-card olc-card-interactive" style="text-decoration: none; display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="olc-badge olc-badge-primary">${f.badge}</span>
            <span style="font-size: 1.1rem;">❤️</span>
          </div>
          <h3 style="font-family: var(--font-title); font-size: 1.25rem; color: var(--color-text); margin-bottom: 8px;">
            ${window.UTILS.escapeHtml(f.title)}
          </h3>
          <p class="font-handwriting" style="font-size: 1.2rem; color: var(--color-text-muted); line-height: 1.35; flex: 1;">
            ${window.UTILS.escapeHtml(f.subtitle || "")}
          </p>
          <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; font-size: 0.8rem; color: var(--color-text-muted); display: flex; justify-content: space-between;">
            <span>De <strong>${window.UTILS.escapeHtml(f.author)}</strong></span>
            <span>${window.UTILS.formatRelativeTime(f.date)}</span>
          </div>
        </a>
      `;
    }).join("");
  }

  fetchFavorites();
});

