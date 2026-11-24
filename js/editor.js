/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/editor.js - Editor Rico de Cartas com Salvamento Automático e Estilos
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("editor");

  // Estado da Carta
  let letterState = {
    id: null,
    title: "",
    content: "",
    paper_style: "cream",
    font_family: "caveat",
    font_size: "medium",
    text_color: "#765D6C",
    text_align: "left",
    decorations: [],
    attachments: [],
    status: "draft"
  };

  let autoSaveTimeout = null;
  let isSaving = false;

  // Elementos do DOM
  const titleInput = document.getElementById("editor-title-input");
  const contentTextarea = document.getElementById("editor-content-textarea");
  const sheetContainer = document.getElementById("editor-sheet-container");
  const savePill = document.getElementById("save-status-pill");
  const sendBtn = document.getElementById("editor-send-btn");
  const previewBtn = document.getElementById("editor-preview-btn");
  const appliedDecorationsEl = document.getElementById("editor-applied-decorations");
  const attachmentsPreviewEl = document.getElementById("editor-attachments-preview");
  const photoFileInput = document.getElementById("editor-photo-file");

  // Paleta de papéis
  const paperGrid = document.getElementById("paper-swatch-grid");
  if (paperGrid) {
    paperGrid.innerHTML = window.UTILS.PAPERS.map(p => `
      <button type="button" class="paper-swatch-btn ${p.id === letterState.paper_style ? 'active' : ''}" 
              data-paper="${p.id}" style="background-color: ${p.preview};" title="${p.name}">
        ${p.id === 'cream' ? '📜' : p.id === 'floral' ? '🌸' : p.id === 'hearts' ? '💖' : p.id === 'lavender' ? '💜' : p.id === 'stars' ? '✨' : p.id === 'minimalist' ? '📝' : p.id === 'vintage' ? '🏺' : '🌿'}
      </button>
    `).join("");

    paperGrid.querySelectorAll(".paper-swatch-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        paperGrid.querySelectorAll(".paper-swatch-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        letterState.paper_style = btn.getAttribute("data-paper");
        applyPaperStyle();
        triggerAutoSave();
        if (window.romanticAudio) window.romanticAudio.playPaperRustle();
      });
    });
  }

  // Paleta de Fontes
  document.querySelectorAll(".font-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".font-choice-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      letterState.font_family = btn.getAttribute("data-font");
      applyFontFamily();
      triggerAutoSave();
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  });

  // Alinhamento
  document.querySelectorAll(".align-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".align-choice-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      letterState.text_align = btn.getAttribute("data-align");
      applyTextAlign();
      triggerAutoSave();
    });
  });

  // Paleta de Cores
  document.querySelectorAll(".color-dot-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".color-dot-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      letterState.text_color = btn.getAttribute("data-color");
      applyTextColor();
      triggerAutoSave();
    });
  });

  // Catálogo de Adesivos
  const stickersGrid = document.getElementById("editor-stickers-grid");
  if (stickersGrid) {
    stickersGrid.innerHTML = window.UTILS.STICKERS.map(s => `
      <button type="button" class="sticker-pick-btn" data-sticker="${s.icon}" title="${s.label}">
        ${s.icon}
      </button>
    `).join("");

    stickersGrid.querySelectorAll(".sticker-pick-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const icon = btn.getAttribute("data-sticker");
        if (letterState.decorations.length >= 8) {
          window.UTILS.showToast("Máximo de 8 adesivos por carta para não sobrecarregar ♡", "warning");
          return;
        }
        letterState.decorations.push(icon);
        renderDecorations();
        triggerAutoSave();
        if (window.romanticAudio) window.romanticAudio.playPop();
      });
    });
  }

  // Carrega parâmetros da URL (edição de rascunho ou resposta)
  const urlParams = new URLSearchParams(window.location.search);
  const letterIdParam = urlParams.get("id");
  const replyTitleParam = urlParams.get("title");

  if (replyTitleParam) {
    titleInput.value = decodeURIComponent(replyTitleParam);
    letterState.title = titleInput.value;
  }

  if (letterIdParam) {
    loadExistingLetter(letterIdParam);
  }

  // Monitora alterações de texto com Auto-save debounced
  titleInput.addEventListener("input", (e) => {
    letterState.title = e.target.value;
    triggerAutoSave();
  });

  contentTextarea.addEventListener("input", (e) => {
    letterState.content = e.target.value;
    triggerAutoSave();
  });

  // Aplicação visual das propriedades
  function applyPaperStyle() {
    sheetContainer.className = `editor-sheet-container olc-letter-paper paper-${letterState.paper_style}`;
  }

  function applyFontFamily() {
    contentTextarea.className = `editor-letter-content-textarea font-${letterState.font_family}`;
  }

  function applyTextAlign() {
    contentTextarea.style.textAlign = letterState.text_align;
  }

  function applyTextColor() {
    contentTextarea.style.color = letterState.text_color;
  }

  function renderDecorations() {
    appliedDecorationsEl.innerHTML = letterState.decorations.map((icon, idx) => `
      <span class="applied-sticker-tag">
        <span>${icon}</span>
        <button type="button" onclick="window.removeDecoration(${idx})">✕</button>
      </span>
    `).join("");
  }

  window.removeDecoration = function(index) {
    letterState.decorations.splice(index, 1);
    renderDecorations();
    triggerAutoSave();
  };

  function renderAttachments() {
    attachmentsPreviewEl.innerHTML = letterState.attachments.map((url, idx) => `
      <div class="attached-photo-card">
        <img src="${url}" alt="Foto Anexa">
        <button type="button" class="attached-photo-remove" onclick="window.removeAttachment(${idx})">✕</button>
      </div>
    `).join("");
  }

  window.removeAttachment = function(index) {
    letterState.attachments.splice(index, 1);
    renderAttachments();
    triggerAutoSave();
  };

  // Upload de Fotos
  if (photoFileInput) {
    photoFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (letterState.attachments.length >= 4) {
        window.UTILS.showToast("Limite de 4 fotos por carta.", "warning");
        return;
      }

      setSaveStatus("saving", "Enviando foto...");
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `letter-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const photoUrl = await window.DB.uploadFile("photos", fileName, file);

        letterState.attachments.push(photoUrl);
        renderAttachments();
        triggerAutoSave();
        window.UTILS.showToast("Foto anexada à carta! ♡", "success");
      } catch (err) {
        console.error("Erro no upload da foto:", err);
        window.UTILS.showToast("Erro ao anexar fotografia.", "error");
        setSaveStatus("error", "Erro ao anexar foto");
      }
    });
  }

  // Auto-Save Debounce
  function triggerAutoSave() {
    setSaveStatus("saving", "Salvando rascunho...");
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      performSave(false);
    }, 2000);
  }

  function setSaveStatus(state, msg) {
    savePill.className = `save-status-pill ${state}`;
    let icon = "💾";
    if (state === "saving") icon = "⏳";
    if (state === "saved") icon = "✓";
    if (state === "error") icon = "⚠️";
    savePill.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  }

  // Executa o salvamento no Supabase
  async function performSave(isFinalSend = false) {
    if (isSaving) return;
    const supabase = window.DB.getClient();
    if (!supabase) {
      setSaveStatus("error", "Supabase não conectado");
      return;
    }

    // Se estiver vazio e não for final, não cria registro desnecessário
    if (!letterState.title.trim() && !letterState.content.trim() && !letterState.id) {
      setSaveStatus("saved", "Salvo");
      return;
    }

    isSaving = true;
    try {
      const payload = {
        sender_id: profile.id,
        title: letterState.title.trim() || "Uma carta com amor ♡",
        content: letterState.content,
        paper_style: letterState.paper_style,
        font_family: letterState.font_family,
        font_size: letterState.font_size,
        text_color: letterState.text_color,
        text_align: letterState.text_align,
        decorations: letterState.decorations,
        attachments: letterState.attachments,
        status: isFinalSend ? "sent" : (letterState.status || "draft"),
        updated_at: new Date().toISOString()
      };

      if (isFinalSend) {
        payload.sent_at = new Date().toISOString();
        const partner = await window.AUTH.getPartnerProfile();
        if (partner) {
          payload.recipient_id = partner.id;
        }
      }

      let savedData;
      if (letterState.id) {
        // Atualiza
        const { data, error } = await supabase
          .from("letters")
          .update(payload)
          .eq("id", letterState.id)
          .select()
          .single();

        if (error) throw error;
        savedData = data;
      } else {
        // Insere novo rascunho
        const { data, error } = await supabase
          .from("letters")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        savedData = data;
        letterState.id = savedData.id;
      }

      // Se for envio ou alteração relevante, registra no histórico de versões
      if (isFinalSend || (letterState.content.length > 50 && Math.random() < 0.2)) {
        await supabase.from("letter_versions").insert({
          letter_id: letterState.id,
          title: payload.title,
          content: payload.content
        });
      }

      setSaveStatus("saved", isFinalSend ? "Enviada com sucesso!" : "Salvo no cantinho ♡");
    } catch (err) {
      console.error("Erro ao salvar carta:", err);
      setSaveStatus("error", "Tentando sincronizar...");
    } finally {
      isSaving = false;
    }
  }

  // Carrega carta existente
  async function loadExistingLetter(id) {
    const supabase = window.DB.getClient();
    try {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        letterState = {
          id: data.id,
          title: data.title || "",
          content: data.content || "",
          paper_style: data.paper_style || "cream",
          font_family: data.font_family || "caveat",
          font_size: data.font_size || "medium",
          text_color: data.text_color || "#765D6C",
          text_align: data.text_align || "left",
          decorations: data.decorations || [],
          attachments: data.attachments || [],
          status: data.status || "draft"
        };

        titleInput.value = letterState.title;
        contentTextarea.value = letterState.content;

        applyPaperStyle();
        applyFontFamily();
        applyTextAlign();
        applyTextColor();
        renderDecorations();
        renderAttachments();
        setSaveStatus("saved", "Rascunho recuperado");
      }
    } catch (e) {
      console.error("Erro ao carregar carta:", e);
    }
  }

  // Ação de Enviar Carta
  sendBtn.addEventListener("click", async () => {
    if (!letterState.title.trim()) {
      window.UTILS.showToast("Dê um título bonito para sua carta antes de enviar ♡", "warning");
      titleInput.focus();
      return;
    }

    if (!letterState.content.trim()) {
      window.UTILS.showToast("Escreva algumas palavras carinhosas na sua carta!", "warning");
      contentTextarea.focus();
      return;
    }

    if (!confirm("Deseja selar e enviar esta carta para seu amor agora? ♡")) {
      return;
    }

    sendBtn.disabled = true;
    sendBtn.innerHTML = `<span class="olc-spinner"></span> Selando envelope...`;

    try {
      await performSave(true);
      window.UTILS.triggerConfetti();
      window.UTILS.showToast("Carta selada e enviada com muito amor! ♡", "success");

      setTimeout(() => {
        window.location.href = "cartas.html";
      }, 1500);
    } catch (err) {
      console.error("Erro no envio:", err);
      window.UTILS.showToast("Não foi possível enviar a carta.", "error");
      sendBtn.disabled = false;
      sendBtn.innerHTML = `<span>Selar e Enviar</span> 💌`;
    }
  });

  // Preview ao Vivo
  previewBtn.addEventListener("click", () => {
    if (window.romanticAudio) window.romanticAudio.playPaperRustle();
    window.UTILS.showToast("Modo de visualização rápida ativado", "info", 1800);
  });

  // Inicializa visual padrão
  applyPaperStyle();
  applyFontFamily();
});

