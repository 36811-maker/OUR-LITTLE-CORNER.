/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/mural.js - Mural Compartilhado com Realtime
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("mural");

  const boardEl = document.getElementById("mural-board");
  const openModalBtn = document.getElementById("btn-add-post");
  const modal = document.getElementById("new-post-modal");
  const modalClose = document.getElementById("new-post-modal-close");
  const postForm = document.getElementById("new-post-form");

  let posts = [];

  // Busca posts do mural
  async function fetchWallPosts() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("wall_posts")
        .select(`
          *,
          author:profiles!wall_posts_author_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      posts = data || [];
      renderBoard();
    } catch (err) {
      console.error("Erro ao carregar mural:", err);
      boardEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">💔</span>
          <p class="olc-empty-title">Erro ao carregar o mural</p>
          <p class="olc-empty-desc">${err.message}</p>
        </div>
      `;
    }
  }

  function renderBoard() {
    if (posts.length === 0) {
      boardEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">📌</span>
          <p class="olc-empty-title">Nosso mural está limpinho!</p>
          <p class="olc-empty-desc">Cole um bilhetinho carinhoso, uma foto ou um adesivo para começar nosso mural de amor ♡</p>
          <button class="olc-btn olc-btn-primary" onclick="document.getElementById('new-post-modal').classList.add('active')">
            Fixar Primeiro Recado 📌
          </button>
        </div>
      `;
      return;
    }

    boardEl.innerHTML = posts.map(p => {
      const isOwner = p.author_id === profile.id;
      const authorName = p.author ? p.author.display_name : "Amor";
      const rot = p.rotation || 0;

      // Polaroid
      if (p.post_type === "polaroid" && p.image_url) {
        return `
          <div class="olc-polaroid" style="transform: rotate(${rot}deg);">
            <div class="olc-washi-tape"></div>
            <img src="${p.image_url}" alt="Foto fixada" class="olc-polaroid-img">
            <div class="olc-polaroid-caption">${window.UTILS.escapeHtml(p.content || "")}</div>
            <div class="polaroid-author-row">
              <span>Por <strong>${window.UTILS.escapeHtml(authorName)}</strong></span>
              ${isOwner ? `<button type="button" class="olc-btn olc-btn-outline" style="padding: 2px 8px; font-size: 0.72rem;" onclick="window.deleteWallPost('${p.id}')">Excluir</button>` : ''}
            </div>
          </div>
        `;
      }

      // Post-it comum
      return `
        <div class="mural-note-card" style="background-color: ${p.color || '#FFF4E8'}; transform: rotate(${rot}deg);">
          <div class="mural-pin"></div>
          <div class="mural-note-content">${window.UTILS.escapeHtml(p.content || "")}</div>
          <div class="mural-note-footer">
            <span>De <strong>${window.UTILS.escapeHtml(authorName)}</strong></span>
            <div>
              ${isOwner ? `<button type="button" style="background:none; border:none; color:#C0392B; cursor:pointer; font-size:0.8rem;" onclick="window.deleteWallPost('${p.id}')" title="Excluir bilhete">🗑️</button>` : ''}
              <span style="margin-left: 6px;">${window.UTILS.formatRelativeTime(p.created_at)}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Excluir post
  window.deleteWallPost = async function(id) {
    if (!confirm("Deseja remover este bilhete do mural?")) return;

    try {
      const supabase = window.DB.getClient();
      await supabase.from("wall_posts").delete().eq("id", id);
      window.UTILS.showToast("Recado retirado do mural.", "info");
      await fetchWallPosts();
    } catch (e) {
      console.error(e);
      window.UTILS.showToast("Erro ao excluir.", "error");
    }
  };

  // Abrir Modal
  if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.add("active");
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  // Submit do Recado
  if (postForm) {
    postForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = document.getElementById("post-content").value.trim();
      const color = document.getElementById("post-color").value;
      const fileInput = document.getElementById("post-file");
      const submitBtn = postForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="olc-spinner"></span> Fixando no mural...`;

      try {
        let imageUrl = "";
        let postType = "note";

        if (fileInput && fileInput.files[0]) {
          const file = fileInput.files[0];
          const fileExt = file.name.split(".").pop();
          const fileName = `wall-${Date.now()}.${fileExt}`;
          imageUrl = await window.DB.uploadFile("photos", fileName, file);
          postType = "polaroid";
        }

        const supabase = window.DB.getClient();
        const rot = (Math.random() * 6 - 3).toFixed(1);

        const { error } = await supabase.from("wall_posts").insert({
          author_id: profile.id,
          post_type: postType,
          content: content,
          color: color,
          image_url: imageUrl,
          rotation: parseFloat(rot)
        });

        if (error) throw error;

        // Notifica parceiro
        const partner = await window.AUTH.getPartnerProfile();
        if (partner) {
          await supabase.from("notifications").insert({
            user_id: partner.id,
            sender_id: profile.id,
            type: "wall",
            title: "Novo recado no mural! 📌",
            message: `${profile.display_name} fixou um novo recadinho no mural.`,
            link_url: "mural.html"
          });
        }

        window.UTILS.triggerConfetti();
        window.UTILS.showToast("Recado fixado no nosso mural! ♡", "success");
        modal.classList.remove("active");
        postForm.reset();
        await fetchWallPosts();
      } catch (err) {
        console.error("Erro ao fixar post:", err);
        window.UTILS.showToast("Erro ao fixar recado.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Fixar no Mural ♡`;
      }
    });
  }

  // Realtime
  function subscribeRealtime() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    supabase
      .channel("mural-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wall_posts" },
        () => {
          fetchWallPosts();
        }
      )
      .subscribe();
  }

  fetchWallPosts();
  subscribeRealtime();
});

