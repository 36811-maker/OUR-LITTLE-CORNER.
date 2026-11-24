/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/perfil.js - Perfil, Personalização Visual, Efeitos Sonoros e Gestão Segura de Credenciais
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("perfil");

  // Elementos do DOM
  const avatarBigEl = document.getElementById("profile-avatar-big");
  const displayNameEl = document.getElementById("profile-display-name-text");
  const usernameEl = document.getElementById("profile-username-text");
  const emailEl = document.getElementById("profile-email-text");
  const partnerStatusEl = document.getElementById("partner-card-status");

  // Formulário de Perfil
  const formProfile = document.getElementById("form-update-profile");
  const inputDisplayName = document.getElementById("input-display-name");
  const inputBio = document.getElementById("input-bio");
  const inputStartDate = document.getElementById("input-start-date");
  const inputAvatarFile = document.getElementById("input-avatar-file");

  // Formulários de Segurança (Supabase Auth)
  const formEmail = document.getElementById("form-update-email");
  const formPassword = document.getElementById("form-update-password");
  const inputNewEmail = document.getElementById("input-new-email");
  const inputNewPassword = document.getElementById("input-new-password");
  const inputConfirmNewPassword = document.getElementById("input-confirm-new-password");

  // Sons
  const toggleSoundCheck = document.getElementById("check-sound-enabled");
  const sliderVolume = document.getElementById("slider-sound-volume");

  // 1. Preenche Dados do Perfil
  function populateProfileUI() {
    displayNameEl.textContent = profile.display_name || profile.username;
    usernameEl.textContent = `@${profile.username}`;
    emailEl.textContent = profile.email;

    inputDisplayName.value = profile.display_name || "";
    inputBio.value = profile.bio || "";
    inputStartDate.value = profile.relationship_start_date || "2024-01-01";

    if (profile.avatar_url) {
      avatarBigEl.innerHTML = `<img src="${profile.avatar_url}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
    } else {
      avatarBigEl.textContent = (profile.display_name || "A")[0].toUpperCase();
    }

    // Configurações de som salvas
    if (toggleSoundCheck) {
      toggleSoundCheck.checked = window.romanticAudio ? window.romanticAudio.enabled : true;
    }
    if (sliderVolume) {
      sliderVolume.value = window.romanticAudio ? window.romanticAudio.volume : 0.6;
    }

    // Marca o tema ativo
    const currentTheme = profile.theme || "light";
    document.querySelectorAll(".theme-card-option").forEach(card => {
      if (card.getAttribute("data-theme") === currentTheme) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
  }

  // 2. Carrega Dados do Parceiro
  async function loadPartnerStatus() {
    try {
      const partner = await window.AUTH.getPartnerProfile();
      if (partner) {
        partnerStatusEl.innerHTML = `
          <div style="display: flex; align-items: center; gap: 14px; margin-top: 10px;">
            <div class="olc-couple-avatar" style="width: 52px; height: 52px; font-size: 1.6rem;">
              ${partner.avatar_url ? `<img src="${partner.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (partner.display_name || "A")[0].toUpperCase()}
            </div>
            <div>
              <h4 style="margin: 0; color: var(--color-text); font-family: var(--font-title); font-size: 1.15rem;">
                ${window.UTILS.escapeHtml(partner.display_name)}
              </h4>
              <p style="margin: 2px 0 0 0; font-size: 0.8rem; color: var(--color-text-muted);">
                @${window.UTILS.escapeHtml(partner.username)} • Conectado(a) com você ♡
              </p>
            </div>
          </div>
        `;
      } else {
        partnerStatusEl.innerHTML = `
          <p style="font-size: 0.88rem; color: var(--color-text-muted); margin: 8px 0 0 0;">
            A segunda metade do cantinho ainda não se cadastrou. Convide seu amor para criar a 2ª conta! ♡
          </p>
        `;
      }
    } catch (e) {
      console.warn("Erro ao buscar parceiro:", e);
    }
  }

  // 3. Atualizar Dados Pessoais do Perfil
  formProfile.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = formProfile.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    try {
      let avatarUrl = profile.avatar_url;

      // Se enviou novo arquivo de foto
      if (inputAvatarFile.files && inputAvatarFile.files[0]) {
        const file = inputAvatarFile.files[0];
        const fileExt = file.name.split(".").pop();
        const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`;
        avatarUrl = await window.DB.uploadFile("avatars", fileName, file);
      }

      const updates = {
        display_name: inputDisplayName.value.trim(),
        bio: inputBio.value.trim(),
        relationship_start_date: inputStartDate.value,
        avatar_url: avatarUrl
      };

      await window.AUTH.updateProfile(updates);
      window.UTILS.showToast("Perfil atualizado com sucesso! ♡", "success");
      if (window.romanticAudio) window.romanticAudio.playChime();
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      window.UTILS.showToast("Erro ao atualizar perfil.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // 4. Seleção de Tema
  document.querySelectorAll(".theme-card-option").forEach(card => {
    card.addEventListener("click", async () => {
      document.querySelectorAll(".theme-card-option").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const selectedTheme = card.getAttribute("data-theme");

      // Aplica imediatamente na DOM
      document.documentElement.setAttribute("data-theme", selectedTheme);

      // Persiste no Supabase
      try {
        await window.AUTH.updateProfile({ theme: selectedTheme });
        window.UTILS.showToast("Tema visual atualizado! ✨", "info", 2000);
        if (window.romanticAudio) window.romanticAudio.playPop();
      } catch (err) {
        console.warn("Erro ao salvar tema:", err);
      }
    });
  });

  // 5. Configuração de Sons
  if (toggleSoundCheck) {
    toggleSoundCheck.addEventListener("change", (e) => {
      const isEnabled = e.target.checked;
      window.romanticAudio.setEnabled(isEnabled);
      if (isEnabled) {
        window.romanticAudio.playChime();
        window.UTILS.showToast("Efeitos sonoros ativados ♡", "info", 1800);
      }
    });
  }

  if (sliderVolume) {
    sliderVolume.addEventListener("input", (e) => {
      const vol = parseFloat(e.target.value);
      window.romanticAudio.setVolume(vol);
    });

    sliderVolume.addEventListener("change", () => {
      window.romanticAudio.playChime();
    });
  }

  // 6. Atualização Segura de E-mail (Supabase Auth)
  formEmail.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newEmail = inputNewEmail.value.trim();
    if (!newEmail) return;

    if (!confirm(`Deseja alterar seu e-mail para ${newEmail}? Você precisará confirmar no link de verificação.`)) {
      return;
    }

    const submitBtn = formEmail.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    try {
      await window.AUTH.updateEmail(newEmail);
      window.UTILS.showToast("E-mail atualizado! Verifique sua caixa de entrada para confirmar.", "success");
      formEmail.reset();
    } catch (err) {
      console.error("Erro ao alterar e-mail:", err);
      window.UTILS.showToast(err.message || "Não foi possível alterar o e-mail.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // 7. Atualização Segura de Senha (Supabase Auth)
  formPassword.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPass = inputNewPassword.value;
    const confirmPass = inputConfirmNewPassword.value;

    if (newPass !== confirmPass) {
      window.UTILS.showToast("A confirmação de senha não coincide!", "error");
      return;
    }

    if (newPass.length < 6) {
      window.UTILS.showToast("A nova senha precisa ter no mínimo 6 caracteres.", "error");
      return;
    }

    const submitBtn = formPassword.querySelector("button[type='submit']");
    submitBtn.disabled = true;

    try {
      await window.AUTH.updatePassword(newPass);
      window.UTILS.showToast("Senha alterada com sucesso no Supabase Auth! ♡", "success");
      if (window.romanticAudio) window.romanticAudio.playChime();
      formPassword.reset();
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      window.UTILS.showToast(err.message || "Erro ao atualizar senha.", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Inicialização
  populateProfileUI();
  loadPartnerStatus();
});

