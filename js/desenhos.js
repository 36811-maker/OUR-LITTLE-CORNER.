/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/desenhos.js - Estúdio de Desenho Completo com Colaboração em Tempo Real
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("desenhos");

  // Elementos do DOM
  const canvas = document.getElementById("art-canvas");
  const ctx = canvas.getContext("2d");
  const wrapper = document.getElementById("canvas-wrapper");
  const sizeSlider = document.getElementById("brush-size-slider");
  const sizeDot = document.getElementById("size-preview-dot");
  const undoBtn = document.getElementById("btn-undo");
  const redoBtn = document.getElementById("btn-redo");
  const clearBtn = document.getElementById("btn-clear");
  const saveBtn = document.getElementById("btn-save-drawing");
  const photoUploadInput = document.getElementById("import-photo-input");
  const addTextBtn = document.getElementById("btn-add-text");
  const collabStatusEl = document.getElementById("collab-status-text");
  const partnerCursorEl = document.getElementById("partner-cursor");
  const partnerNameTag = document.getElementById("partner-name-tag");

  // Estado do Estúdio
  let currentTool = "pen"; // 'pen', 'fine', 'marker', 'texture', 'eraser'
  let currentColor = "#765D6C";
  let currentSize = 5;
  let currentBg = "#FFFFFF";

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Pilhas de Histórico (Undo / Redo)
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 20;

  // Estado da sessão colaborativa do parceiro
  let partnerChannel = null;
  let partnerProfile = null;
  let partnerIsDrawing = false;
  let partnerLastX = 0;
  let partnerLastY = 0;
  let partnerTool = "pen";
  let partnerColor = "#E26D8E";
  let partnerSize = 5;

  // 1. Configuração de Resolução e DPI do Canvas
  function resizeCanvas() {
    const rect = wrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Guarda desenho atual se houver
    let tempImg = null;
    if (canvas.width > 0 && canvas.height > 0) {
      tempImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    if (tempImg) {
      // Restaura fundo e desenho
      fillBackground(currentBg);
    } else {
      fillBackground(currentBg);
      saveState();
    }
  }

  function fillBackground(color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // 2. Histórico de Estados (Undo / Redo)
  function saveState() {
    if (undoStack.length >= MAX_HISTORY) undoStack.shift();
    undoStack.push(canvas.toDataURL());
    redoStack.length = 0; // Limpa redo
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    if (undoBtn) undoBtn.disabled = undoStack.length <= 1;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
  }

  function restoreState(dataUrl) {
    const img = new Image();
    img.onload = () => {
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      ctx.scale(dpr, dpr);
    };
    img.src = dataUrl;
  }

  undoBtn.addEventListener("click", () => {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      const previous = undoStack[undoStack.length - 1];
      restoreState(previous);
      updateHistoryButtons();
      if (window.romanticAudio) window.romanticAudio.playPop();
    }
  });

  redoBtn.addEventListener("click", () => {
    if (redoStack.length > 0) {
      const next = redoStack.pop();
      undoStack.push(next);
      restoreState(next);
      updateHistoryButtons();
      if (window.romanticAudio) window.romanticAudio.playPop();
    }
  });

  clearBtn.addEventListener("click", () => {
    if (confirm("Deseja limpar toda a tela de desenho?")) {
      fillBackground(currentBg);
      saveState();
      broadcastCollabEvent("clear", {});
      if (window.romanticAudio) window.romanticAudio.playPaperRustle();
    }
  });

  // 3. Coordenadas relativas ao canvas
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // 4. Desenho de Traço
  function applyBrushStyles(context, tool, color, size) {
    context.lineCap = "round";
    context.lineJoin = "round";

    if (tool === "fine") {
      context.lineWidth = Math.min(size, 3);
      context.strokeStyle = color;
      context.globalAlpha = 1.0;
      context.globalCompositeOperation = "source-over";
    } else if (tool === "marker") {
      context.lineWidth = size * 2.2;
      context.strokeStyle = color;
      context.globalAlpha = 0.35;
      context.globalCompositeOperation = "multiply";
    } else if (tool === "texture") {
      context.lineWidth = size;
      context.strokeStyle = color;
      context.globalAlpha = 0.75;
      context.globalCompositeOperation = "source-over";
    } else if (tool === "eraser") {
      context.lineWidth = size * 2.5;
      context.strokeStyle = currentBg;
      context.globalAlpha = 1.0;
      context.globalCompositeOperation = "source-over";
    } else {
      // Pincel Comum
      context.lineWidth = size;
      context.strokeStyle = color;
      context.globalAlpha = 1.0;
      context.globalCompositeOperation = "source-over";
    }
  }

  function startDrawing(x, y) {
    isDrawing = true;
    lastX = x;
    lastY = y;

    ctx.save();
    applyBrushStyles(ctx, currentTool, currentColor, currentSize);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    broadcastCollabEvent("stroke-start", {
      x, y,
      tool: currentTool,
      color: currentColor,
      size: currentSize
    });
  }

  function drawMove(x, y) {
    if (!isDrawing) return;

    ctx.save();
    applyBrushStyles(ctx, currentTool, currentColor, currentSize);

    if (currentTool === "texture") {
      // Efeito sutil de giz de cera
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();

      for (let i = 0; i < 4; i++) {
        const jitterX = x + (Math.random() * currentSize - currentSize / 2);
        const jitterY = y + (Math.random() * currentSize - currentSize / 2);
        ctx.fillRect(jitterX, jitterY, 1.2, 1.2);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();

    lastX = x;
    lastY = y;

    broadcastCollabEvent("stroke-move", { x, y });
  }

  function stopDrawing() {
    if (isDrawing) {
      isDrawing = false;
      saveState();
      broadcastCollabEvent("stroke-end", {});
    }
  }

  // 5. Eventos de Ponteiro (Mouse + Touch unificados)
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    const coords = getCoordinates(e);
    startDrawing(coords.x, coords.y);
  });

  canvas.addEventListener("pointermove", (e) => {
    const coords = getCoordinates(e);
    if (isDrawing) {
      drawMove(coords.x, coords.y);
    }
    // Envia posição do cursor para o parceiro
    broadcastCursorPosition(coords.x, coords.y);
  });

  canvas.addEventListener("pointerup", (e) => {
    canvas.releasePointerCapture(e.pointerId);
    stopDrawing();
  });

  canvas.addEventListener("pointercancel", stopDrawing);

  // 6. Seleção de Ferramentas
  document.querySelectorAll(".brush-type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".brush-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTool = btn.getAttribute("data-tool");
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  });

  // Slider de Espessura
  if (sizeSlider) {
    sizeSlider.addEventListener("input", (e) => {
      currentSize = parseInt(e.target.value, 10);
      if (sizeDot) {
        sizeDot.style.transform = `scale(${Math.max(0.4, currentSize / 15)})`;
        sizeDot.style.background = currentTool === "eraser" ? "#CCC" : currentColor;
      }
    });
  }

  // Grade de Cores
  document.querySelectorAll(".studio-color-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".studio-color-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentColor = btn.getAttribute("data-color");
      if (sizeDot) sizeDot.style.background = currentColor;
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  });

  // Custom Color Picker
  const customColorInput = document.getElementById("custom-color-picker");
  if (customColorInput) {
    customColorInput.addEventListener("change", (e) => {
      currentColor = e.target.value;
      if (sizeDot) sizeDot.style.background = currentColor;
    });
  }

  // Cor de Fundo
  document.querySelectorAll(".bg-choice-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentBg = btn.getAttribute("data-bg");
      fillBackground(currentBg);
      saveState();
      if (window.romanticAudio) window.romanticAudio.playPaperRustle();
    });
  });

  // 7. Importar Fotografia para desenhar por cima
  if (photoUploadInput) {
    photoUploadInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const rect = canvas.getBoundingClientRect();
          // Desenha a imagem mantendo proporção no fundo
          ctx.save();
          fillBackground(currentBg);
          const hRatio = rect.width / img.width;
          const vRatio = rect.height / img.height;
          const ratio = Math.min(hRatio, vRatio);
          const centerShiftX = (rect.width - img.width * ratio) / 2;
          const centerShiftY = (rect.height - img.height * ratio) / 2;

          ctx.drawImage(img, 0, 0, img.width, img.height,
            centerShiftX, centerShiftY, img.width * ratio, img.height * ratio);
          ctx.restore();
          saveState();
          window.UTILS.showToast("Fotografia importada! Desenhe à vontade por cima ♡", "success");
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // 8. Adicionar Texto no Desenho
  if (addTextBtn) {
    addTextBtn.addEventListener("click", () => {
      const text = prompt("Digite uma frase romântica para estampar no desenho:");
      if (!text || !text.trim()) return;

      ctx.save();
      ctx.font = `${Math.max(22, currentSize * 3)}px 'Caveat', cursive`;
      ctx.fillStyle = currentColor;
      ctx.textAlign = "center";
      const rect = canvas.getBoundingClientRect();
      ctx.fillText(text.trim(), rect.width / 2, rect.height / 2);
      ctx.restore();
      saveState();
      if (window.romanticAudio) window.romanticAudio.playChime();
    });
  }

  // 9. Adesivos no Canvas
  document.querySelectorAll(".studio-sticker-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sticker = btn.getAttribute("data-sticker");
      ctx.save();
      ctx.font = "42px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const rect = canvas.getBoundingClientRect();
      const posX = rect.width / 2 + (Math.random() * 80 - 40);
      const posY = rect.height / 2 + (Math.random() * 80 - 40);
      ctx.fillText(sticker, posX, posY);
      ctx.restore();
      saveState();
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  });

  // 10. Salvar e Compartilhar Desenho no Supabase
  saveBtn.addEventListener("click", async () => {
    const title = prompt("Dê um título bonito para o nosso desenho:", "Nosso Desenho de Amor ♡");
    if (title === null) return;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="olc-spinner"></span> Guardando na galeria...`;

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const fileName = `drawing-${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

      // Upload para Supabase Storage
      const publicUrl = await window.DB.uploadDataUrl("drawings", fileName, dataUrl);

      // Inserção no banco
      const supabase = window.DB.getClient();
      const partner = await window.AUTH.getPartnerProfile();

      const { error } = await supabase.from("drawings").insert({
        author_id: profile.id,
        recipient_id: partner ? partner.id : null,
        title: title.trim() || "Nosso Desenho ♡",
        image_url: publicUrl,
        is_shared: true
      });

      if (error) throw error;

      // Notificação ao parceiro
      if (partner) {
        await supabase.from("notifications").insert({
          user_id: partner.id,
          sender_id: profile.id,
          type: "drawing",
          title: "Novo desenho para você! 🎨",
          message: `${profile.display_name} acabou de compartilhar um desenho: "${title}"`,
          link_url: "galeria.html"
        });
      }

      window.UTILS.triggerConfetti();
      window.UTILS.showToast("Desenho guardado com amor na nossa galeria! ♡", "success");
    } catch (err) {
      console.error("Erro ao salvar desenho:", err);
      window.UTILS.showToast("Erro ao salvar o desenho.", "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span>Guardar na Galeria</span> 💾`;
    }
  });

  // =========================================================================
  // 11. COLABORAÇÃO EM TEMPO REAL VIA SUPABASE REALTIME
  // =========================================================================
  async function setupRealtimeCollaboration() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    partnerProfile = await window.AUTH.getPartnerProfile();
    const partnerName = partnerProfile ? partnerProfile.display_name : "Seu Amor";

    partnerChannel = supabase.channel("realtime-drawing-studio", {
      config: {
        broadcast: { ack: false }
      }
    });

    // Escuta eventos de desenho do parceiro
    partnerChannel
      .on("broadcast", { event: "draw-event" }, ({ payload }) => {
        handlePartnerDrawEvent(payload);
      })
      .on("broadcast", { event: "cursor-event" }, ({ payload }) => {
        handlePartnerCursor(payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          collabStatusEl.innerHTML = `<span>🎨 Tela ao vivo pronta para os dois</span>`;
        }
      });
  }

  function broadcastCollabEvent(type, data) {
    if (!partnerChannel) return;
    partnerChannel.send({
      type: "broadcast",
      event: "draw-event",
      payload: {
        type,
        senderId: profile.id,
        ...data
      }
    });
  }

  let lastCursorBroadcast = 0;
  function broadcastCursorPosition(x, y) {
    const now = Date.now();
    if (now - lastCursorBroadcast < 40) return; // Limita a 25fps para suavidade
    lastCursorBroadcast = now;

    if (!partnerChannel) return;
    partnerChannel.send({
      type: "broadcast",
      event: "cursor-event",
      payload: {
        senderId: profile.id,
        senderName: profile.display_name,
        x, y
      }
    });
  }

  function handlePartnerDrawEvent(event) {
    if (event.senderId === profile.id) return; // Ignora os próprios eventos

    if (event.type === "stroke-start") {
      partnerIsDrawing = true;
      partnerLastX = event.x;
      partnerLastY = event.y;
      partnerTool = event.tool;
      partnerColor = event.color;
      partnerSize = event.size;

      ctx.save();
      applyBrushStyles(ctx, partnerTool, partnerColor, partnerSize);
      ctx.beginPath();
      ctx.moveTo(event.x, event.y);
      ctx.lineTo(event.x, event.y);
      ctx.stroke();
      ctx.restore();
    } else if (event.type === "stroke-move" && partnerIsDrawing) {
      ctx.save();
      applyBrushStyles(ctx, partnerTool, partnerColor, partnerSize);
      ctx.beginPath();
      ctx.moveTo(partnerLastX, partnerLastY);
      ctx.lineTo(event.x, event.y);
      ctx.stroke();
      ctx.restore();

      partnerLastX = event.x;
      partnerLastY = event.y;
    } else if (event.type === "stroke-end") {
      partnerIsDrawing = false;
      saveState();
    } else if (event.type === "clear") {
      fillBackground(currentBg);
      saveState();
      window.UTILS.showToast("Seu amor limpou a tela.", "info");
    }
  }

  function handlePartnerCursor(payload) {
    if (payload.senderId === profile.id) return;

    if (partnerCursorEl) {
      partnerCursorEl.style.display = "flex";
      partnerCursorEl.style.left = `${payload.x}px`;
      partnerCursorEl.style.top = `${payload.y}px`;
      if (partnerNameTag) {
        partnerNameTag.textContent = `${payload.senderName || 'Amor'} desenhando... ♡`;
      }
    }
  }

  // Inicialização
  resizeCanvas();
  window.addEventListener("resize", () => {
    // Evita redimensionamento destrutivo se já tiver conteúdo
  });
  setupRealtimeCollaboration();
});

