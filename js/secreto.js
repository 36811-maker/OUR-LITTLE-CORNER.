/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/secreto.js - Lógica do Cofre Secreto, Promessas e Cadeado do Amor
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("secreto");

  const padlock = document.getElementById("love-padlock");
  const vaultGrid = document.getElementById("secret-vault-grid");
  const openModalBtn = document.getElementById("btn-add-vow");
  const modal = document.getElementById("new-vow-modal");
  const modalClose = document.getElementById("new-vow-modal-close");
  const vowForm = document.getElementById("new-vow-form");

  let secretItems = [];

  // Clique no cadeado
  if (padlock) {
    padlock.addEventListener("click", () => {
      window.UTILS.triggerConfetti();
      if (window.romanticAudio) window.romanticAudio.playCelebration();
      window.UTILS.showToast("Nosso amor está trancado para sempre neste cantinho! ♡", "success");
    });
  }

  // Busca votos e promessas do cofre
  async function fetchSecretItems() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("secret_vault")
        .select(`
          *,
          author:profiles!secret_vault_author_id_fkey(display_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      secretItems = data || [];
      renderVault();
    } catch (err) {
      console.error("Erro ao abrir cofre:", err);
      vaultGrid.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon">🗝️</span>
          <p class="olc-empty-title" style="color: #FFF;">Erro ao carregar o cofre</p>
          <p class="olc-empty-desc">${err.message}</p>
        </div>
      `;
    }
  }

  function renderVault() {
    if (secretItems.length === 0) {
      vaultGrid.innerHTML = `
        <div class="olc-empty-state" style="grid-column: 1/-1;">
          <span class="olc-empty-icon" style="font-size: 3rem;">🗝️</span>
          <p class="olc-empty-title" style="color: #FFE6EE; font-size: 1.25rem;">Nosso cofre de segredos está pronto</p>
          <p class="olc-empty-desc" style="color: #CBB2C5;">Guarde aqui promessas que nunca serão esquecidas, votos do coração e sonhos para o nosso futuro a dois. ♡</p>
          <button type="button" class="olc-btn olc-btn-primary" onclick="document.getElementById('new-vow-modal').classList.add('active')">
            Guardar Nosso Primeiro Voto 🗝️
          </button>
        </div>
      `;
      return;
    }

    vaultGrid.innerHTML = secretItems.map(item => {
      const isOwner = item.author_id === profile.id;
      const authorName = item.author ? item.author.display_name : "Amor";

      const badgeMap = {
        vow: "Voto de Amor 💍",
        promise: "Promessa Eterna 🕊️",
        letter: "Carta Secreta 🗝️",
        dream: "Sonho a Dois ✨"
      };

      return `
        <div class="secret-vow-card">
          <div class="secret-vow-header">
            <span class="olc-badge" style="background: rgba(244, 184, 204, 0.25); color: #FFDEEB; border: 1px solid #E586A5;">
              ${badgeMap[item.category] || 'Segredo do Coração ♡'}
            </span>
            <span style="font-size: 0.8rem; color: #CBB2C5;">${window.UTILS.formatRelativeTime(item.created_at)}</span>
          </div>

          <h3 class="secret-vow-title">${window.UTILS.escapeHtml(item.title)}</h3>
          
          <div class="secret-vow-body">
            "${window.UTILS.escapeHtml(item.secret_content)}"
          </div>

          <div style="border-top: 1px dashed rgba(244, 184, 204, 0.2); padding-top: 10px; display: flex; align-items: center; justify-content: space-between; font-size: 0.8rem; color: #CBB2C5;">
            <span>Escrito por <strong>${window.UTILS.escapeHtml(authorName)}</strong></span>
            ${isOwner ? `<button type="button" style="background:none; border:none; color:#FF99AA; cursor:pointer;" onclick="window.deleteSecretItem('${item.id}')" title="Excluir">🗑️</button>` : ''}
          </div>
        </div>
      `;
    }).join("");
  }

  window.deleteSecretItem = async function(id) {
    if (!confirm("Tem certeza que deseja apagar esta memória do cofre?")) return;

    try {
      const supabase = window.DB.getClient();
      await supabase.from("secret_vault").delete().eq("id", id);
      window.UTILS.showToast("Memória removida do cofre.", "info");
      await fetchSecretItems();
    } catch (e) {
      console.error(e);
      window.UTILS.showToast("Erro ao remover do cofre.", "error");
    }
  };

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

  if (vowForm) {
    vowForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("vow-title").value.trim();
      const category = document.getElementById("vow-category").value;
      const content = document.getElementById("vow-content").value.trim();
      const submitBtn = vowForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;

      try {
        const supabase = window.DB.getClient();
        const { error } = await supabase.from("secret_vault").insert({
          author_id: profile.id,
          title: title,
          category: category,
          secret_content: content
        });

        if (error) throw error;

        window.UTILS.triggerConfetti();
        window.UTILS.showToast("Voto guardado para sempre no nosso baú secreto! ♡", "success");
        modal.classList.remove("active");
        vowForm.reset();
        await fetchSecretItems();
      } catch (err) {
        console.error("Erro ao guardar voto:", err);
        window.UTILS.showToast("Erro ao guardar segredo.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  fetchSecretItems();
});

