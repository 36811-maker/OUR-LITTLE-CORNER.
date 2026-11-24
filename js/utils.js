/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/utils.js - Utilitários, Formatações, Toasts, Confetes e Catálogos Decorativos
 */

window.UTILS = {
  // Escapa HTML para prevenir XSS
  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  // Formatação de data por extenso em Português
  formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  },

  // Formatação curta com hora
  formatShortDateTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  },

  // Tempo relativo amigável
  formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return "agora mesmo";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "ontem";
    if (diffDays < 30) return `há ${diffDays} dias`;
    return this.formatDate(dateStr);
  },

  // Contador de dias juntos
  calcDaysTogether(startDateStr) {
    if (!startDateStr) startDateStr = "2024-01-01";
    const start = new Date(startDateStr);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - start.getTime());
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffTime / (1000 * 60)) % 60);
    const seconds = Math.floor((diffTime / 1000) % 60);
    return { days, hours, minutes, seconds };
  },

  // Sistema de Notificações Toast no canto superior/inferior
  showToast(message, type = "info", duration = 3500) {
    let container = document.getElementById("olc-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "olc-toast-container";
      container.className = "olc-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `olc-toast olc-toast-${type}`;

    let icon = "🌸";
    if (type === "success") icon = "✨";
    if (type === "warning") icon = "⚠️";
    if (type === "error") icon = "💔";

    toast.innerHTML = `
      <span class="olc-toast-icon">${icon}</span>
      <span class="olc-toast-msg">${this.escapeHtml(message)}</span>
      <button class="olc-toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Efeito sonoro suave
    if (window.romanticAudio) {
      if (type === "error") {
        window.romanticAudio.playPop();
      } else {
        window.romanticAudio.playChime();
      }
    }

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400);
    }, duration);
  },

  // Efeito de confetes leves em Canvas (sem dependência de lib externa)
  triggerConfetti() {
    if (window.romanticAudio) window.romanticAudio.playCelebration();

    const canvas = document.createElement("canvas");
    canvas.id = "olc-confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "999999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ["#F4B8CC", "#E5D8F5", "#D9B5C7", "#FFF4E8", "#B7CDE0", "#FF85A1", "#FDE24F"];
    const particles = [];
    const count = 90;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width * 0.5 + (Math.random() * 200 - 100),
        y: canvas.height * 0.5 + (Math.random() * 100 - 50),
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1,
        shape: Math.random() > 0.4 ? "heart" : "rect"
      });
    }

    let start = null;
    function render(time) {
      if (!start) start = time;
      const progress = time - start;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravidade
        p.vx *= 0.98; // arrasto
        p.rotation += p.rotSpeed;
        p.alpha -= 0.009;

        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;

          if (p.shape === "heart") {
            // Desenha pequeno coração
            const s = p.size * 0.6;
            ctx.beginPath();
            ctx.moveTo(0, s * 0.3);
            ctx.bezierCurveTo(-s, -s * 0.5, -s * 1.2, s * 0.6, 0, s * 1.3);
            ctx.bezierCurveTo(s * 1.2, s * 0.6, s, -s * 0.5, 0, s * 0.3);
            ctx.fill();
          } else {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          }
          ctx.restore();
        }
      }

      if (alive && progress < 3000) {
        requestAnimationFrame(render);
      } else {
        canvas.remove();
      }
    }

    requestAnimationFrame(render);
  },

  // Catálogo de papéis de carta
  PAPERS: [
    { id: "cream", name: "Creme Clássico", preview: "#FFF8F0", class: "paper-cream" },
    { id: "floral", name: "Floral Delicado", preview: "#FFF0F4", class: "paper-floral" },
    { id: "lavender", name: "Lavanda Romântica", preview: "#F6F0FC", class: "paper-lavender" },
    { id: "hearts", name: "Chuva de Corações", preview: "#FFF2F5", class: "paper-hearts" },
    { id: "stars", name: "Céu Estrelado", preview: "#F0F4FA", class: "paper-stars" },
    { id: "minimalist", name: "Papiro Minimalista", preview: "#FCFCFB", class: "paper-minimalist" },
    { id: "vintage", name: "Vintage Nostálgico", preview: "#F7EFE4", class: "paper-vintage" },
    { id: "illustrated", name: "Borboletas & Jardim", preview: "#F9F6F0", class: "paper-illustrated" }
  ],

  // Catálogo de adesivos (stickers)
  STICKERS: [
    { id: "s_heart_pink", icon: "💖", label: "Coração com Brilho" },
    { id: "s_letter", icon: "💌", label: "Cartinha" },
    { id: "s_cherry", icon: "🌸", label: "Flor de Cerejeira" },
    { id: "s_tulip", icon: "🌷", label: "Tulipa" },
    { id: "s_rose", icon: "🌹", label: "Rosa Vermelha" },
    { id: "s_sparkles", icon: "✨", label: "Brilhinhos" },
    { id: "s_bow", icon: "🎀", label: "Lacinho" },
    { id: "s_bear", icon: "🧸", label: "Ursinho" },
    { id: "s_coffee", icon: "☕", label: "Cafézinho" },
    { id: "s_strawberry", icon: "🍓", label: "Morango" },
    { id: "s_ring", icon: "💍", label: "Aliança" },
    { id: "s_dove", icon: "🕊️", label: "Pombinha" },
    { id: "s_herb", icon: "🌿", label: "Raminho" },
    { id: "s_cake", icon: "🍰", label: "Bolo" },
    { id: "s_moon", icon: "🌙", label: "Lua" },
    { id: "s_candle", icon: "🕯️", label: "Velinha" },
    { id: "s_cat", icon: "🐱", label: "Gatinho" },
    { id: "s_sunflower", icon: "🌻", label: "Girassol" }
  ],

  // Catálogo de carimbos e selos de cera
  STAMPS: [
    { id: "stamp_wax_red", label: "Lacre Cera Rubi", color: "#B83A4B", text: "COM AMOR" },
    { id: "stamp_wax_rose", label: "Lacre Rosa Delicado", color: "#C96D87", text: "NOSSO CORNER" },
    { id: "stamp_wax_lavender", label: "Lacre Lavanda Real", color: "#8B6B9E", text: "SEMPRE TE AMO" },
    { id: "stamp_wax_gold", label: "Lacre Ouro Vintage", color: "#C59B27", text: "PRA SEMPRE" }
  ],

  // Frases de amor aleatórias para o topo do Dashboard
  LOVE_QUOTES: [
    "No meio de todo o barulho do mundo, você é meu lugar de paz preferido. ♡",
    "Cada dia ao seu lado é uma nova página da história mais bonita que já vivi.",
    "O amor mora nas pequenas coisas: nas cartas bobas, nos sorrisos e nos desenhos compartilhados.",
    "Com você, todo cantinho vira um castelo e qualquer dia comum vira poesia. ✨",
    "Obrigado por ser meu porto seguro, meu riso fácil e o amor da minha vida.",
    "Dois corações, um só cantinho para guardar todas as nossas memórias mais doces. 🌸",
    "Você é a resposta mais linda que o universo deu aos meus sonhos."
  ],

  getRandomQuote() {
    return this.LOVE_QUOTES[Math.floor(Math.random() * this.LOVE_QUOTES.length)];
  }
};

