/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/presentes.js - Lógica de Presentes Digitais, Vales e Caixas de Surpresa
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("presentes");

  let currentTab = "todos";
  let giftsList = [];

  const gridEl = document.getElementById("presentes-grid");
  const tabBtns = document.querySelectorAll(".presentes-tab-btn");
  const openModalBtn = document.getElementById("btn-open-new-gift");
  const modal = document.getElementById("new-gift-modal");
  const modalCloseBtn = document.getElementById("new-gift-modal-close");
  const giftForm = document.getElementById("new-gift-form");

  // Abas
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.getAttribute("data-tab");
      if (window.romanticAudio) window.romanticAudio.playPop();
      renderGifts();
    });
  });

  // Busca presentes
  async function fetchGifts() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("gifts")
        .select(`
          *,
          sender:profiles!gifts_sender_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      giftsList = data || [];
      renderGifts();
    } catch (err) {
      console.error("Erro ao carregar presentes:", err);
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">💔</span>
          <p class="olc-empty-title">Erro ao carregar presentes</p>
          <p class="olc-empty-desc">${err.message}</p>
        </div>
      `;
    }
  }

  function renderGifts() {
    let filtered = giftsList.filter(g => {
      if (currentTab === "vales") return g.gift_type === "coupon";
      if (currentTab === "surpresas") return g.gift_type === "surprise";
      if (currentTab === "cartoes") return g.gift_type === "card";
      if (currentTab === "memes") return g.gift_type === "meme";
      return true;
    });

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">🎁</span>
          <p class="olc-empty-title">Nenhum presente nesta seção</p>
          <p class="olc-empty-desc">Crie um vale do amor ou envie uma caixinha de surpresa para seu par!</p>
          <button type="button" class="olc-btn olc-btn-primary" onclick="document.getElementById('new-gift-modal').classList.add('active')">
            Criar Presente ou Vale ♡
          </button>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = filtered.map(g => {
      const isSender = g.sender_id === profile.id;
      const senderName = g.sender ? g.sender.display_name : "Seu Amor";

      // 1. Vale do Amor (Cupom)
      if (g.gift_type === "coupon") {
        return `
          <div class="love-coupon-card ${g.is_redeemed ? 'redeemed' : ''}" style="border-color: ${g.color || '#E28AA4'};">
            ${g.is_redeemed ? '<div class="coupon-stamp-used">UTILIZADO</div>' : ''}
            
            <div class="coupon-header">
              <span class="olc-badge" style="background: ${g.color || '#F4B8CC'}; color: #5E3D52;">VALE DO AMOR ♡</span>
              <span style="font-size: 1.5rem;">🎟️</span>
            </div>

            <h3 class="coupon-title">${window.UTILS.escapeHtml(g.title)}</h3>
            <p class="coupon-desc">${window.UTILS.escapeHtml(g.message || "Válido para um momento inesquecível a dois.")}</p>

            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--border-color); font-size: 0.8rem; color: var(--color-text-muted);">
              <span>Dado por <strong>${window.UTILS.escapeHtml(senderName)}</strong></span>
              ${!g.is_redeemed && !isSender ? `
                <button type="button" class="olc-btn olc-btn-primary" style="font-size: 0.8rem; padding: 6px 14px;" onclick="window.redeemCoupon('${g.id}')">
                  Resgatar Vale! ♡
                </button>
              ` : `
                <span>${g.is_redeemed ? 'Resgatado em ' + window.UTILS.formatDate(g.redeemed_at) : 'Disponível'}</span>
              `}
            </div>
          </div>
        `;
      }

      // 2. Caixa de Surpresa Interativa
      if (g.gift_type === "surprise") {
        const isOpened = g.is_opened;
        return `
          <div class="surprise-box-card" onclick="window.openSurprise('${g.id}', ${isOpened})">
            <div class="surprise-gift-icon">${isOpened ? '🎉' : '🎁'}</div>
            <h3 style="font-family: var(--font-title); font-size: 1.3rem; margin-bottom: 4px; color: var(--color-text);">
              ${window.UTILS.escapeHtml(g.title)}
            </h3>
            <p style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 0;">
              De: ${window.UTILS.escapeHtml(senderName)} • ${window.UTILS.formatRelativeTime(g.created_at)}
            </p>

            ${isOpened ? `
              <div class="surprise-revealed-content">
                <p style="margin: 0;">"${window.UTILS.escapeHtml(g.message)}"</p>
                ${g.image_url ? `<img src="${g.image_url}" style="max-width:100%; border-radius:8px; margin-top:10px;">` : ''}
              </div>
            ` : `
              <div style="margin-top: 14px;">
                <span class="olc-badge olc-badge-primary">Toque para Abrir a Surpresa! ♡</span>
              </div>
            `}
          </div>
        `;
      }

      // 3. Cartão ou Meme
      return `
        <div class="olc-card olc-card-interactive" style="border-top: 4px solid ${g.color || '#F4B8CC'};">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
            <span class="olc-badge olc-badge-lavender">${g.gift_type === 'meme' ? 'Meme Romântico' : 'Cartão de Afeto'}</span>
            <span style="font-size: 0.8rem; color: var(--color-text-muted);">${window.UTILS.formatRelativeTime(g.created_at)}</span>
          </div>

          <h3 style="font-family: var(--font-title); font-size: 1.25rem; margin-bottom: 8px; color: var(--color-text);">
            ${window.UTILS.escapeHtml(g.title)}
          </h3>

          ${g.image_url ? `
            <img src="${g.image_url}" style="width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">
          ` : ''}

          <p class="font-handwriting" style="font-size: 1.25rem; color: var(--color-text); line-height: 1.4; margin-bottom: 14px;">
            ${window.UTILS.escapeHtml(g.message || "")}
          </p>

          <div style="border-top: 1px dashed var(--border-color); padding-top: 8px; font-size: 0.78rem; color: var(--color-text-muted);">
            Enviado por <strong>${window.UTILS.escapeHtml(senderName)}</strong>
          </div>
        </div>
      `;
    }).join("");
  }

  // Resgatar Cupom
  window.redeemCoupon = async function(id) {
    if (!confirm("Tem certeza que deseja resgatar este vale agora com seu amor? ♡")) return;

    try {
      const supabase = window.DB.getClient();
      await supabase.from("gifts").update({
        is_redeemed: true,
        redeemed_at: new Date().toISOString()
      }).eq("id", id);

      window.UTILS.triggerConfetti();
      window.UTILS.showToast("Vale resgatado com sucesso! Aproveitem o momento ♡", "success");
      await fetchGifts();
    } catch (e) {
      console.error(e);
      window.UTILS.showToast("Erro ao resgatar o vale.", "error");
    }
  };

  // Abrir Caixa de Surpresa
  window.openSurprise = async function(id, alreadyOpened) {
    if (!alreadyOpened) {
      try {
        const supabase = window.DB.getClient();
        await supabase.from("gifts").update({
          is_opened: true,
          opened_at: new Date().toISOString()
        }).eq("id", id);

        window.UTILS.triggerConfetti();
        if (window.romanticAudio) window.romanticAudio.playCelebration();
        window.UTILS.showToast("Surpresa revelada com muito amor! ♡", "success");
        await fetchGifts();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Modal de Criação de Presentes
  if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
      modal.classList.add("active");
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  // Troca de tipo no formulário
  const giftTypeSelect = document.getElementById("gift-type-select");
  const giftImageGroup = document.getElementById("gift-image-group");
  if (giftTypeSelect && giftImageGroup) {
    giftTypeSelect.addEventListener("change", (e) => {
      if (e.target.value === "meme" || e.target.value === "card") {
        giftImageGroup.style.display = "block";
      } else {
        giftImageGroup.style.display = "none";
      }
    });
  }

  // Submissão do Formulário de Presente
  if (giftForm) {
    giftForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const type = giftTypeSelect.value;
      const title = document.getElementById("gift-title").value.trim();
      const message = document.getElementById("gift-message").value.trim();
      const color = document.getElementById("gift-color").value;
      const fileInput = document.getElementById("gift-file");
      const submitBtn = giftForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="olc-spinner"></span> Enviando presente...`;

      try {
        let imageUrl = "";
        if (fileInput && fileInput.files[0]) {
          const file = fileInput.files[0];
          const fileExt = file.name.split(".").pop();
          const fileName = `gift-${Date.now()}.${fileExt}`;
          imageUrl = await window.DB.uploadFile("photos", fileName, file);
        }

        const supabase = window.DB.getClient();
        const partner = await window.AUTH.getPartnerProfile();

        const { error } = await supabase.from("gifts").insert({
          sender_id: profile.id,
          recipient_id: partner ? partner.id : null,
          gift_type: type,
          title: title,
          message: message,
          color: color,
          image_url: imageUrl
        });

        if (error) throw error;

        if (partner) {
          await supabase.from("notifications").insert({
            user_id: partner.id,
            sender_id: profile.id,
            type: "gift",
            title: "Você ganhou um presente novo! 🎁",
            message: `${profile.display_name} preparou um(a) ${type === 'coupon' ? 'Vale do Amor' : 'Surpresa'}: "${title}"`,
            link_url: "presentes.html"
          });
        }

        window.UTILS.triggerConfetti();
        window.UTILS.showToast("Presente embalado e enviado com muito amor! ♡", "success");
        modal.classList.remove("active");
        giftForm.reset();
        await fetchGifts();
      } catch (err) {
        console.error("Erro ao enviar presente:", err);
        window.UTILS.showToast("Erro ao criar presente.", "error");
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Enviar Presente com Amor ♡`;
      }
    });
  }

  fetchGifts();
});

