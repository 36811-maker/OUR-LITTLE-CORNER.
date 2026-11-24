/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/login.js - Lógica da Página de Login Exclusiva para os Dois Parceiros
 */

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Redireciona para o dashboard se o usuário já estiver logado (sessão ativa mantida)
  await window.AUTH.redirectIfAuthenticated();

  // 2. Elementos do DOM
  const formLogin = document.getElementById("form-login");
  const formReset = document.getElementById("form-reset");
  const linkForgotPassword = document.getElementById("link-forgot-password");
  const linkBackToLogin = document.getElementById("link-back-to-login");
  const btnLoginSubmit = document.getElementById("btn-login-submit");
  const btnResetSubmit = document.getElementById("btn-reset-submit");

  // 3. Alternância suave entre Login e Recuperação de Senha
  function showView(view) {
    if (view === "reset") {
      formLogin.style.display = "none";
      formReset.style.display = "block";
      const resetEmailInput = document.getElementById("reset-email");
      if (resetEmailInput) {
        const loginEmail = document.getElementById("login-email")?.value.trim();
        if (loginEmail) resetEmailInput.value = loginEmail;
        resetEmailInput.focus();
      }
    } else {
      formReset.style.display = "none";
      formLogin.style.display = "block";
      document.getElementById("login-email")?.focus();
    }
    if (window.romanticAudio) window.romanticAudio.playPop();
  }

  if (linkForgotPassword) {
    linkForgotPassword.addEventListener("click", (e) => {
      e.preventDefault();
      showView("reset");
    });
  }

  if (linkBackToLogin) {
    linkBackToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      showView("login");
    });
  }

  // Se a URL contiver parâmetro ?action=reset, abre diretamente a tela de recuperação
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("action") === "reset") {
    showView("reset");
  }

  // 4. Mostrar / Ocultar Senha
  const togglePassBtns = document.querySelectorAll(".toggle-password-btn");
  togglePassBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === "password") {
          input.type = "text";
          btn.textContent = "🙈";
          btn.title = "Ocultar senha";
        } else {
          input.type = "password";
          btn.textContent = "👁️";
          btn.title = "Mostrar senha";
        }
      }
    });
  });

  // 5. Envio do Formulário de Login (Autenticação via Supabase Auth)
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      window.UTILS.showToast("Por favor, preencha seu e-mail e sua senha ♡", "info");
      return;
    }

    try {
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.innerHTML = `<span class="olc-spinner"></span> Entrando...`;

      await window.AUTH.login(email, password);

      window.UTILS.showToast("Bem-vindo(a) de volta ao nosso cantinho! ♡", "success");
      if (window.romanticAudio) window.romanticAudio.playChime();

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (err) {
      console.error("Erro na autenticação:", err);

      let delicateMessage = "E-mail ou senha incorretos. Verifique suas credenciais com carinho ♡";
      const errLower = (err.message || "").toLowerCase();

      if (errLower.includes("network") || errLower.includes("fetch") || errLower.includes("failed to fetch")) {
        delicateMessage = "Não foi possível conectar ao Cantinho. Verifique sua conexão com a internet.";
      } else if (errLower.includes("email not confirmed")) {
        delicateMessage = "E-mail ainda não confirmado no Supabase. Confirme no seu e-mail ou no painel do Supabase.";
      } else if (errLower.includes("invalid login credentials") || errLower.includes("invalid credentials")) {
        delicateMessage = "E-mail ou senha incorretos. Verifique suas credenciais com carinho ♡";
      }

      window.UTILS.showToast(delicateMessage, "error");
      btnLoginSubmit.disabled = false;
      btnLoginSubmit.innerHTML = `Entrar`;
    }
  });

  // 6. Envio do Formulário de Recuperação de Senha
  formReset.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("reset-email").value.trim();

    if (!email) {
      window.UTILS.showToast("Por favor, informe seu e-mail cadastrado.", "info");
      return;
    }

    try {
      btnResetSubmit.disabled = true;
      btnResetSubmit.innerHTML = `<span class="olc-spinner"></span> Enviando...`;

      await window.AUTH.resetPassword(email);

      window.UTILS.showToast("Instruções de recuperação enviadas com carinho para o seu e-mail! ♡", "success");
      btnResetSubmit.disabled = false;
      btnResetSubmit.innerHTML = `Enviar Link de Recuperação`;

      setTimeout(() => {
        showView("login");
      }, 2500);
    } catch (err) {
      console.error("Erro na recuperação:", err);
      let delicateMessage = "Não foi possível enviar o e-mail de recuperação. Verifique o endereço digitado.";
      const errLower = (err.message || "").toLowerCase();
      if (errLower.includes("network") || errLower.includes("fetch")) {
        delicateMessage = "Erro de conexão ao solicitar recuperação. Verifique sua internet.";
      }
      window.UTILS.showToast(delicateMessage, "error");
      btnResetSubmit.disabled = false;
      btnResetSubmit.innerHTML = `Enviar Link de Recuperação`;
    }
  });
});
