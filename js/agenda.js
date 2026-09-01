/**
 * SDFINANCEIRO — Agenda & Appointments Management Module
 */

const Agenda = {
  currentCalDate: new Date(),
  selectedDate: null, // null means all or today
  filterStatus: {
    pending: true,
    done: true,
    canceled: false
  },

  init() {
    this.bindEvents();
    this.renderCalendar();
    this.renderAppointments();
  },

  bindEvents() {
    // Calendar month navigation
    const prevBtn = document.getElementById('cal-prev-month');
    const nextBtn = document.getElementById('cal-next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentCalDate.setMonth(this.currentCalDate.getMonth() - 1);
        this.renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentCalDate.setMonth(this.currentCalDate.getMonth() + 1);
        this.renderCalendar();
      });
    }

    // Status filter checkboxes
    ['chk-filter-pending', 'chk-filter-done', 'chk-filter-canceled'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          const key = id.replace('chk-filter-', '');
          this.filterStatus[key] = e.target.checked;
          this.renderAppointments();
        });
      }
    });

    // Quick filter buttons (Today / All)
    const btnToday = document.getElementById('btn-filter-today');
    const btnAll = document.getElementById('btn-filter-all-agenda');

    if (btnToday) {
      btnToday.addEventListener('click', () => {
        const today = new Date();
        this.selectedDate = today.toISOString().split('T')[0];
        this.currentCalDate = new Date(today);
        this.renderCalendar();
        this.renderAppointments();
      });
    }

    if (btnAll) {
      btnAll.addEventListener('click', () => {
        this.selectedDate = null;
        this.renderCalendar();
        this.renderAppointments();
      });
    }

    // Add appointment button
    const addBtn = document.getElementById('btn-add-appointment');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    const quickAptBtn = document.getElementById('btn-quick-appointment');
    if (quickAptBtn) {
      quickAptBtn.addEventListener('click', () => this.openModal());
    }

    // Form submit
    const form = document.getElementById('form-appointment');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  },

  openModal(aptToEdit = null) {
    const modal = document.getElementById('modal-appointment');
    const title = document.getElementById('modal-appointment-title');
    const form = document.getElementById('form-appointment');
    form.reset();

    const todayISO = this.selectedDate || new Date().toISOString().split('T')[0];

    if (aptToEdit) {
      title.textContent = 'Editar Compromisso';
      document.getElementById('apt-id').value = aptToEdit.id;
      document.getElementById('form-apt-title').value = aptToEdit.title;
      document.getElementById('form-apt-date').value = aptToEdit.date;
      document.getElementById('form-apt-time').value = aptToEdit.time;
      document.getElementById('form-apt-priority').value = aptToEdit.priority || 'medium';
      document.getElementById('form-apt-category').value = aptToEdit.category || 'payment';
      document.getElementById('form-apt-value').value = aptToEdit.value || '';
      document.getElementById('form-apt-status').value = aptToEdit.status || 'pending';
      document.getElementById('form-apt-obs').value = aptToEdit.description || '';
    } else {
      title.textContent = 'Novo Compromisso';
      document.getElementById('apt-id').value = '';
      document.getElementById('form-apt-date').value = todayISO;
      document.getElementById('form-apt-time').value = '09:00';
      document.getElementById('form-apt-priority').value = 'medium';
      document.getElementById('form-apt-status').value = 'pending';
    }

    modal.classList.add('active');
  },

  handleFormSubmit() {
    const id = document.getElementById('apt-id').value;
    const title = document.getElementById('form-apt-title').value.trim();
    const date = document.getElementById('form-apt-date').value;
    const time = document.getElementById('form-apt-time').value;
    const priority = document.getElementById('form-apt-priority').value;
    const category = document.getElementById('form-apt-category').value;
    const value = parseFloat(document.getElementById('form-apt-value').value) || 0;
    const status = document.getElementById('form-apt-status').value;
    const description = document.getElementById('form-apt-obs').value.trim();

    let agenda = Storage.getAgenda();

    const aptData = {
      id: id || `apt_${Date.now()}`,
      title,
      date,
      time,
      priority,
      category,
      value,
      status,
      description
    };

    if (id) {
      agenda = agenda.map(a => a.id === id ? aptData : a);
      App.showToast('Compromisso atualizado!', 'success');
    } else {
      agenda.push(aptData);
      App.showToast('Compromisso agendado com sucesso!', 'success');
    }

    Storage.saveAgenda(agenda);
    App.closeModals();
    this.renderCalendar();
    this.renderAppointments();
    App.refreshAll();
  },

  toggleDone(id) {
    let agenda = Storage.getAgenda();
    const apt = agenda.find(a => a.id === id);
    if (!apt) return;

    apt.status = apt.status === 'done' ? 'pending' : 'done';
    Storage.saveAgenda(agenda);
    App.showToast(`Compromisso marcado como ${apt.status === 'done' ? 'Concluído' : 'Pendente'}.`, 'info');
    this.renderCalendar();
    this.renderAppointments();
    App.refreshAll();
  },

  deleteAppointment(id) {
    if (!confirm('Deseja excluir este compromisso?')) return;
    let agenda = Storage.getAgenda().filter(a => a.id !== id);
    Storage.saveAgenda(agenda);
    App.showToast('Compromisso removido.', 'info');
    this.renderCalendar();
    this.renderAppointments();
    App.refreshAll();
  },

  renderCalendar() {
    const year = this.currentCalDate.getFullYear();
    const month = this.currentCalDate.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const monthHeader = document.getElementById('cal-month-year');
    if (monthHeader) monthHeader.textContent = `${monthNames[month]} ${year}`;

    const container = document.getElementById('calendar-days-container');
    if (!container) return;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevLastDay = new Date(year, month, 0).getDate();

    const agenda = Storage.getAgenda();
    const todayISO = new Date().toISOString().split('T')[0];

    let html = `
      <div class="cal-header-day">Dom</div>
      <div class="cal-header-day">Seg</div>
      <div class="cal-header-day">Ter</div>
      <div class="cal-header-day">Qua</div>
      <div class="cal-header-day">Qui</div>
      <div class="cal-header-day">Sex</div>
      <div class="cal-header-day">Sáb</div>
    `;

    // Previous month filler days
    for (let x = firstDayIndex; x > 0; x--) {
      const d = prevLastDay - x + 1;
      html += `<div class="cal-day other-month">${d}</div>`;
    }

    // Current month days
    for (let i = 1; i <= lastDay; i++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateISO = `${year}-${monthStr}-${dayStr}`;

      const isToday = dateISO === todayISO;
      const isSelected = dateISO === this.selectedDate;
      const hasEvents = agenda.some(a => a.date === dateISO && a.status !== 'canceled');

      let classes = ['cal-day'];
      if (isToday) classes.push('today');
      if (isSelected) classes.push('active');

      html += `
        <div class="${classes.join(' ')}" onclick="Agenda.selectDate('${dateISO}')">
          <span>${i}</span>
          ${hasEvents ? '<div class="cal-day-dot"></div>' : ''}
        </div>
      `;
    }

    container.innerHTML = html;
  },

  selectDate(dateISO) {
    if (this.selectedDate === dateISO) {
      this.selectedDate = null; // deselect
    } else {
      this.selectedDate = dateISO;
    }
    this.renderCalendar();
    this.renderAppointments();
  },

  renderAppointments() {
    const agenda = Storage.getAgenda();
    const container = document.getElementById('agenda-items-container');
    const dashboardUpcoming = document.getElementById('dashboard-upcoming-agenda');
    const todayISO = new Date().toISOString().split('T')[0];

    // Badge today in sidebar
    const todayItems = agenda.filter(a => a.date === todayISO && a.status === 'pending');
    const badgeToday = document.getElementById('badge-agenda-today');
    if (badgeToday) badgeToday.textContent = todayItems.length;

    // Filter agenda items
    let filtered = agenda.filter(item => {
      if (item.status === 'pending' && !this.filterStatus.pending) return false;
      if (item.status === 'done' && !this.filterStatus.done) return false;
      if (item.status === 'canceled' && !this.filterStatus.canceled) return false;

      if (this.selectedDate && item.date !== this.selectedDate) return false;
      return true;
    });

    // Sort by date and time
    filtered.sort((a, b) => {
      const dtA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dtB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dtA - dtB;
    });

    // Update Header title & count
    const titleEl = document.getElementById('agenda-selected-date-title');
    const countEl = document.getElementById('agenda-total-selected-count');

    if (titleEl) {
      if (this.selectedDate) {
        const formatted = this.selectedDate.split('-').reverse().join('/');
        titleEl.textContent = `Compromissos para ${formatted}`;
      } else {
        titleEl.textContent = `Todos os Compromissos Agendados`;
      }
    }
    if (countEl) countEl.textContent = `${filtered.length} itens`;

    // Render in Agenda Main List
    if (container) {
      if (filtered.length === 0) {
        container.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--text-muted);">
            <i data-lucide="calendar-check" style="width: 48px; height: 48px; opacity: 0.4; margin-bottom: 12px;"></i>
            <p>Nenhum compromisso marcado para este filtro.</p>
          </div>
        `;
      } else {
        container.innerHTML = filtered.map(item => {
          const isDone = item.status === 'done';
          const formattedDate = item.date.split('-').reverse().slice(0, 2).join('/');
          const pClass = `p-${item.priority || 'medium'}`;
          const priorityLabels = { urgent: 'Urgente', high: 'Alta', medium: 'Média', low: 'Baixa' };

          return `
            <div class="agenda-item-card ${isDone ? 'done' : ''}">
              <div class="agenda-item-left">
                <div class="agenda-item-time-box">
                  <div class="agenda-item-time">${item.time || '--:--'}</div>
                  <div class="agenda-item-date-sub">${formattedDate}</div>
                </div>

                <div class="agenda-item-details">
                  <div class="agenda-item-title">${item.title}</div>
                  ${item.description ? `<div class="agenda-item-desc">${item.description}</div>` : ''}
                  <div class="agenda-item-tags">
                    <span class="tag-priority ${pClass}">${priorityLabels[item.priority] || 'Média'}</span>
                    <span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${item.category}</span>
                  </div>
                </div>
              </div>

              <div class="agenda-item-right">
                ${item.value > 0 ? `<div class="agenda-item-value">R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>` : ''}
                
                <button class="btn btn-sm ${isDone ? 'btn-outline' : 'btn-primary'}" onclick="Agenda.toggleDone('${item.id}')" title="${isDone ? 'Reabrir' : 'Marcar Concluído'}">
                  <i data-lucide="${isDone ? 'rotate-ccw' : 'check'}"></i>
                  ${isDone ? 'Concluído' : 'Concluir'}
                </button>

                <button class="btn-icon btn-sm" onclick="Agenda.openModal(Storage.getAgenda().find(a=>a.id==='${item.id}'))" title="Editar">
                  <i data-lucide="edit-3"></i>
                </button>
                <button class="btn-icon btn-sm" onclick="Agenda.deleteAppointment('${item.id}')" title="Excluir">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Compact Dashboard Widget (Upcoming 4 pending items)
    if (dashboardUpcoming) {
      const pendingUpcoming = agenda
        .filter(a => a.status === 'pending')
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
        .slice(0, 4);

      if (pendingUpcoming.length === 0) {
        dashboardUpcoming.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">Nenhum compromisso pendente.</p>';
      } else {
        dashboardUpcoming.innerHTML = pendingUpcoming.map(item => {
          const formattedDate = item.date.split('-').reverse().slice(0, 2).join('/');
          const isToday = item.date === todayISO;

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 38px; height: 38px; border-radius: 8px; background: ${isToday ? 'var(--amber-light)' : 'rgba(255,255,255,0.05)'}; color: ${isToday ? 'var(--amber)' : 'var(--text-secondary)'}; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
                  <span>${item.time}</span>
                  <small style="font-size: 0.65rem; opacity: 0.7;">${formattedDate}</small>
                </div>
                <div>
                  <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${item.title}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${item.description || 'Lembrete de compromisso'}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                ${item.value > 0 ? `<b style="font-size: 0.85rem; color: var(--emerald); font-family: 'Outfit', sans-serif;">R$ ${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b>` : ''}
                <button class="btn-icon btn-sm" onclick="Agenda.toggleDone('${item.id}')" title="Concluir">
                  <i data-lucide="check"></i>
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    lucide.createIcons();
  }
};
