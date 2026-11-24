/**
 * OUR LITTLE CORNER 1.0 ♡
 * js/calendario.js - Lógica do Calendário Compartilhado de Marcos e Datas Especiais
 */

document.addEventListener("DOMContentLoaded", async () => {
  const profile = await window.AUTH.requireAuth();
  if (!profile) return;

  window.NAV.init("calendario");

  let currentDate = new Date();
  let events = [];

  const monthTitleEl = document.getElementById("cal-month-title");
  const daysGridEl = document.getElementById("cal-days-grid");
  const upcomingListEl = document.getElementById("upcoming-events-list");
  const prevBtn = document.getElementById("cal-prev-month");
  const nextBtn = document.getElementById("cal-next-month");
  const addEventBtn = document.getElementById("btn-add-event");
  const modal = document.getElementById("new-event-modal");
  const modalClose = document.getElementById("new-event-modal-close");
  const eventForm = document.getElementById("new-event-form");

  // Navegação de Meses
  prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    if (window.romanticAudio) window.romanticAudio.playPop();
    renderCalendar();
  });

  nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    if (window.romanticAudio) window.romanticAudio.playPop();
    renderCalendar();
  });

  // Busca eventos no Supabase
  async function fetchEvents() {
    const supabase = window.DB.getClient();
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      events = data || [];
      renderCalendar();
      renderUpcomingList();
    } catch (err) {
      console.error("Erro ao carregar calendário:", err);
    }
  }

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    monthTitleEl.textContent = `${monthNames[month]} de ${year}`;

    // Primeiro dia do mês e total de dias
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    let html = "";

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      html += `<div class="cal-day-cell other-month"><span class="cal-day-num">${prevMonthDays - i}</span></div>`;
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDays; d++) {
      const isToday = isCurrentMonth && today.getDate() === d;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = events.filter(e => e.event_date === dateStr);

      html += `
        <div class="cal-day-cell ${isToday ? 'today' : ''}" onclick="window.selectDay('${dateStr}')">
          <span class="cal-day-num">${d}</span>
          <div class="cal-day-events">
            ${dayEvents.map(e => `<span class="cal-event-dot" title="${window.UTILS.escapeHtml(e.title)}"></span>`).join("")}
          </div>
        </div>
      `;
    }

    daysGridEl.innerHTML = html;
  }

  // Renderiza Próximos Eventos com Contagem Regressiva
  function renderUpcomingList() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter(e => {
      const eDate = new Date(e.event_date + "T00:00:00");
      return eDate >= today;
    }).slice(0, 6);

    if (upcoming.length === 0) {
      upcomingListEl.innerHTML = `
        <p style="font-size: 0.88rem; color: var(--color-text-muted); text-align: center; padding: 14px 0;">
          Nenhum evento futuro cadastrado ainda. ♡
        </p>
      `;
      return;
    }

    upcomingListEl.innerHTML = upcoming.map(e => {
      const eDate = new Date(e.event_date + "T00:00:00");
      const diffTime = eDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let badgeText = `Faltam ${diffDays} dias`;
      if (diffDays === 0) badgeText = "É HOJE! 🎉";
      else if (diffDays === 1) badgeText = "É AMANHÃ! ✨";

      const iconMap = {
        anniversary: "🎂",
        date: "🕯️",
        travel: "✈️",
        memory: "💍",
        surprise: "🎁"
      };
      const catIcon = iconMap[e.category] || "💖";

      return `
        <div class="upcoming-event-item">
          <span class="event-countdown-badge">${badgeText}</span>
          <h4 style="font-family: var(--font-title); font-size: 1.05rem; margin: 4px 0; color: var(--color-text);">
            ${catIcon} ${window.UTILS.escapeHtml(e.title)}
          </h4>
          <p style="font-size: 0.82rem; color: var(--color-text-muted); margin: 0;">
            ${window.UTILS.formatDate(e.event_date + "T00:00:00")}
          </p>
          ${e.description ? `<p style="font-size: 0.82rem; color: var(--color-text); margin-top: 6px;">${window.UTILS.escapeHtml(e.description)}</p>` : ''}
        </div>
      `;
    }).join("");
  }

  window.selectDay = function(dateStr) {
    const dayEvents = events.filter(e => e.event_date === dateStr);
    if (dayEvents.length > 0) {
      const titles = dayEvents.map(e => `• ${e.title}`).join("\n");
      alert(`Eventos em ${window.UTILS.formatDate(dateStr + "T00:00:00")}:\n\n${titles}`);
    } else {
      document.getElementById("event-date").value = dateStr;
      modal.classList.add("active");
    }
  };

  // Modal de Novo Evento
  if (addEventBtn) {
    addEventBtn.addEventListener("click", () => {
      modal.classList.add("active");
      if (window.romanticAudio) window.romanticAudio.playPop();
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("event-title").value.trim();
      const date = document.getElementById("event-date").value;
      const category = document.getElementById("event-category").value;
      const desc = document.getElementById("event-desc").value.trim();
      const submitBtn = eventForm.querySelector("button[type='submit']");

      submitBtn.disabled = true;

      try {
        const supabase = window.DB.getClient();
        const { error } = await supabase.from("calendar_events").insert({
          created_by: profile.id,
          title: title,
          event_date: date,
          category: category,
          description: desc
        });

        if (error) throw error;

        // Notifica o parceiro
        const partner = await window.AUTH.getPartnerProfile();
        if (partner) {
          await supabase.from("notifications").insert({
            user_id: partner.id,
            sender_id: profile.id,
            type: "calendar",
            title: "Nova data especial no calendário! 🗓️",
            message: `${profile.display_name} marcou: "${title}" em ${window.UTILS.formatDate(date + 'T00:00:00')}`,
            link_url: "calendario.html"
          });
        }

        window.UTILS.triggerConfetti();
        window.UTILS.showToast("Data marcada com amor no nosso calendário! ♡", "success");
        modal.classList.remove("active");
        eventForm.reset();
        await fetchEvents();
      } catch (err) {
        console.error("Erro ao salvar data:", err);
        window.UTILS.showToast("Erro ao marcar data.", "error");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  fetchEvents();
});

