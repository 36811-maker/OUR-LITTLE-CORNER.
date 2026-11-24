/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/galeria.js - Galeria Visual Compartilhada (Fotografias e Desenhos)
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("galeria");

  let currentTab = "todas";
  let searchQuery = "";
  let items = [];
  let activeItem = null;

  const gridEl = document.getElementById("galeria-grid");
  const searchInput = document.getElementById("search-gallery-input");
  const tabBtns = document.querySelectorAll(".galeria-tab-btn");

  // Abas
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.getAttribute("data-tab");
      if (window.romanticAudio) window.romanticAudio.playPop();
      renderGallery();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderGallery();
    });
  }

  // Busca dados de Desenhos e Fotos
  async function fetchGalleryItems() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      // 1. Desenhos
      const { data: drawings, error: drawErr } = await supabase
        .from("drawings")
        .select(`
          id, title, description, image_url, created_at, is_favorite, author_id,
          author:profiles!drawings_author_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (drawErr) throw drawErr;

      // 2. Fotos do Mural que possuem imagem
      const { data: wallPhotos, error: wallErr } = await supabase
        .from("wall_posts")
        .select(`
          id, content, image_url, created_at, is_favorite, author_id,
          author:profiles!wall_posts_author_id_fkey(display_name)
        `)
        .not("image_url", "eq", "")
        .not("image_url", "is", null)
        .order("created_at", { ascending: false });

      const unified = [];

      (drawings || []).forEach(d => {
        unified.push({
          id: d.id,
          type: "drawing",
          title: d.title || "Nosso Desenho ♡",
          description: d.description || "",
          image_url: d.image_url,
          created_at: d.created_at,
          is_favorite: !!d.is_favorite,
          author_id: d.author_id,
          author_name: d.author ? d.author.display_name : "Amor"
        });
      });

      (wallPhotos || []).forEach(w => {
        unified.push({
          id: w.id,
          type: "photo",
          title: w.content || "Nossa Fotografia ♡",
          description: w.content || "",
          image_url: w.image_url,
          created_at: w.created_at,
          is_favorite: !!w.is_favorite,
          author_id: w.author_id,
          author_name: w.author ? w.author.display_name : "Amor"
        });
      });

      // Ordena por data decrescente
      unified.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      items = unified;
      renderGallery();
    } catch (err) {
      console.error("Erro ao carregar galeria:", err);
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">💔</span>
          <p class="olc-empty-title">Erro ao carregar a galeria</p>
          <p class="olc-empty-desc">${err.message}</p>
        </div>
      `;
    }
  }

  function renderGallery() {
    let filtered = items.filter(it => {
      if (currentTab === "desenhos") return it.type === "drawing";
      if (currentTab === "fotos") return it.type === "photo";
      if (currentTab === "favoritas") return it.is_favorite;
      return true;
    });

    if (searchQuery) {
      filtered = filtered.filter(it => 
        (it.title && it.title.toLowerCase().includes(searchQuery)) ||
        (it.author_name && it.author_name.toLowerCase().includes(searchQuery))
      );
    }

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">🖼️</span>
          <p class="olc-empty-title">Nenhuma lembrança visual encontrada</p>
          <p class="olc-empty-desc">Adicione uma fotografia ou faça um desenho no estúdio para enriquecer nossa galeria!</p>
          <div style="display: flex; gap: 10px;">
            <button class="olc-btn olc-btn-primary" onclick="document.getElementById('upload-photo-modal').classList.add('active')">
              Subir Foto 📷
            </button>
            <a href="desenhos.html" class="olc-btn olc-btn-secondary">Estúdio de Arte 🎨</a>
          </div>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filtered.map((it, idx) => {
      const tapes = ["", "lavender", "sage"];
      const tapeClass = tapes[idx % tapes.length];
      const isFav = it.is_favorite;

      return `
        <div class="olc-polaroid polaroid-item" onclick="window.openLightbox('${it.id}')">
          <div class="olc-washi-tape ${tapeClass}"></div>
          <img src="${it.image_url}" alt="${window.UTILS.escapeHtml(it.title)}" class="olc-polaroid-img" loading="lazy">
          
          <div class="olc-polaroid-caption">
            ${window.UTILS.escapeHtml(it.title)}
          </div>

          <div class="polaroid-author-row">
            <span>Por <strong>${window.UTILS.escapeHtml(it.author_name)}</strong></span>
            <span>${isFav ? '❤️' : ''} ${window.UTILS.formatRelativeTime(it.created_at)}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // Lightbox Modal
  window.openLightbox = function(id) {
    const item = items.find(it => it.id === id);
    if (!item) return;
    activeItem = item;

    const modal = document.getElementById("lightbox-modal");
    const imgEl = document.getElementById("lightbox-img");
    const titleEl = document.getElementById("lightbox-title");
    const authorEl = document.getElementById("lightbox-author");
    const favBtn = document.getElementById("lightbox-fav-btn");
    const downloadBtn = document.getElementById("lightbox-download-btn");

    imgEl.src = item.image_url;
    titleEl.textContent = item.title;
    authorEl.textContent = `Guardado por ${item.author_name} em ${window.UTILS.formatDate(item.created_at)}`;
    favBtn.innerHTML = item.is_favorite ? "❤️ Favoritada" : "🤍 Favoritar";

    downloadBtn.onclick = () => {
      window.open(item.image_url, "_blank");
    };

    modal.classList.add("active");
    if (window.romanticAudio) window.romanticAudio.playPaperRustle();
  };

  // Favoritar item na lightbox
  const favBtn = document.getElementById("lightbox-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", async () => {
      if (!activeItem) return;
      activeItem.is_favorite = !activeItem.is_favorite;
      favBtn.innerHTML = activeItem.is_favorite ? "❤️ Favoritada" : "🤍 Favoritar";

      const supabase = window.DB.getClient();
      const table = activeItem.type === "drawing" ? "drawings" : "wall_posts";
      await supabase.from(table).update({
        is_favorite: activeItem.is_favorite
      }).eq("id", activeItem.id);

      if (activeItem.is_favorite && window.romanticAudio) {
        window.romanticAudio.playChime();
        window.UTILS.showToast("Adicionado às Lembranças Favoritas! ♡", "success");
      }
      renderGallery();
    });
  }

  // Fechar lightbox
  document.getElementById("lightbox-close-btn").addEventListener("click", () => {
    document.getElementById("lightbox-modal").classList.remove("active");
  });

  // Upload de Foto direto na Galeria
  const openUploadBtn = document.getElementById("btn-open-upload");
  const uploadModal = document.getElementById("upload-photo-modal");
  const uploadForm = document.getElementById("upload-photo-form");
  const uploadCloseBtn = document.getElementById("upload-modal-close");

  if (openUploadBtn) {
    openUploadBtn.addEventListener("click", () => {
      uploadModal.classList.add("active");
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  }

  if (uploadCloseBtn) {
    uploadCloseBtn.addEventListener("click", () => {
      uploadModal.classList.remove("active");
    });
  }

  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById("modal-photo-file");
      const captionInput = document.getElementById("modal-photo-caption");
      const submitBtn = uploadForm.querySelector("button[type='submit']");

      const file = fileInput.files[0];
      if (!file) {
        window.UTILS.showToast("Selecione uma imagem para enviar.", "warning");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="olc-spinner"></span> Guardando fotografia...`;

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `gallery-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const photoUrl = await window.DB.uploadFile("photos", fileName, file);

        const supabase = window.DB.getClient();
        const caption = captionInput.value.trim() || "Nossa Fotografia ♡";

        // Salva como post no mural/galeria
        await supabase.from("wall_posts").insert({
          author_id: profile.id,
          post_type: "polaroid",
          content: caption,
          image_url: photoUrl,
          rotation: (Math.random() * 4 - 2)
        });

        const partner = await window.AUTH.getPartnerProfile();
        if (partner) {
          await supabase.from("notifications").insert({
            user_id: partner.id,
            sender_id: profile.id,
            type: "wall",
            title: "Nova foto na nossa galeria! 📷",
            message: `${profile.display_name} adicionou uma nova fotografia: "${caption}"`,
            link_url: "galeria.html"
          });
        }

        window.UTILS.triggerConfetti();
        window.UTILS.showToast("Fotografia guardada com carinho na galeria! ♡", "success");
        uploadModal.classList.remove("active");
        uploadForm.reset();
        await fetchGalleryItems();
      } catch (err) {
        console.error("Erro no upload:", err);
        window.UTILS.showToast("Erro ao enviar fotografia.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Guardar na Galeria ♡`;
      }
    });
  }

  fetchGalleryItems();
});

