/**
 * SD FINANÇAS ENTERPRISE - Agenda & Lembretes Module
 */

const AgendaModule = {
  reminders: [],

  init() {
    this.loadReminders();
    this.bindEvents();
    this.updateBadge();
  },

  loadReminders() {
    const saved = localStorage.getItem('sd_enterprise_agenda');
    if (saved) {
      try {
        this.reminders = JSON.parse(saved);
      } catch (e) {
        this.reminders = this.getDefaultReminders();
      }
    } else {
      this.reminders = this.getDefaultReminders();
      this.saveReminders();
    }
  },

  getDefaultReminders() {
    return [
      {
        id: 'rem-1',
        title: 'Fechamento de Fatura Nubank Ultravioleta',
        date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
        time: '09:00',
        priority: 'high',
        category: 'Cartão',
        completed: false
      },
      {
        id: 'rem-2',
        title: 'Reunião de Conciliação Bancária com Contabilidade',
        date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 10),
        time: '14:30',
        priority: 'medium',
        category: 'Financeiro',
        completed: false
      },
      {
        id: 'rem-3',
        title: 'Pagamento de Aluguel Comercial & IPTU',
        date: new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 10),
        time: '10:00',
        priority: 'high',
        category: 'Despesa Fixa',
        completed: false
      }
    ];
  },

  saveReminders() {
    localStorage.setItem('sd_enterprise_agenda', JSON.stringify(this.reminders));
    this.updateBadge();
  },

  updateBadge() {
    const pendingCount = this.reminders.filter(r => !r.completed).length;
    const badge = document.getElementById('badge-agenda-count');
    if (badge) {
      badge.textContent = pendingCount;
      badge.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
    }
    const topBadge = document.getElementById('top-badge-agenda-count');
    if (topBadge) {
      topBadge.textContent = pendingCount;
      topBadge.style.display = pendingCount > 0 ? 'inline-flex' : 'none';
    }
  },

  bindEvents() {
    const form = document.getElementById('form-new-reminder');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addReminderFromForm();
      });
    }
  },

  render() {
    const container = document.getElementById('agenda-reminders-list');
    if (!container) return;

    if (this.reminders.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i data-lucide="calendar-check" style="width: 48px; height: 48px; margin-bottom: 12px; color: var(--gold-primary); opacity: 0.7;"></i>
          <p style="font-size: 1rem; font-weight: 500;">Nenhum lembrete ou compromisso cadastrado.</p>
          <button class="btn btn-primary btn-sm" style="margin-top: 14px;" onclick="AgendaModule.openModal()">
            <i data-lucide="plus"></i> Novo Lembrete
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = this.reminders.map(rem => {
      const priorityColors = {
        high: { bg: 'rgba(244, 63, 94, 0.15)', text: '#fb7185', label: 'Alta Prioridade' },
        medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', label: 'Média' },
        low: { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', label: 'Normal' }
      };
      const pMeta = priorityColors[rem.priority] || priorityColors.medium;

      return `
        <div class="card reminder-card ${rem.completed ? 'completed' : ''}" style="margin-bottom: 12px; border-left: 3px solid ${rem.completed ? '#64748b' : pMeta.text};">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 14px;">
              <input type="checkbox" ${rem.completed ? 'checked' : ''} onchange="AgendaModule.toggleComplete('${rem.id}')" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--gold-primary);">
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 600; color: ${rem.completed ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration: ${rem.completed ? 'line-through' : 'none'};">
                  ${rem.title}
                </h4>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">
                  <span><i data-lucide="calendar" style="width: 13px; height: 13px; vertical-align: middle;"></i> ${AppState.formatDate(rem.date)}</span>
                  ${rem.time ? `<span><i data-lucide="clock" style="width: 13px; height: 13px; vertical-align: middle;"></i> ${rem.time}</span>` : ''}
                  <span style="background: ${pMeta.bg}; color: ${pMeta.text}; padding: 2px 8px; border-radius: var(--radius-full); font-weight: 600; font-size: 0.7rem;">
                    ${pMeta.label}
                  </span>
                  <span style="background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 0.7rem;">
                    ${rem.category || 'Geral'}
                  </span>
                </div>
              </div>
            </div>

            <button class="btn-icon btn-sm" onclick="AgendaModule.deleteReminder('${rem.id}')" title="Excluir" style="color: var(--text-muted);">
              <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  openModal() {
    const modal = document.getElementById('modal-new-reminder');
    if (modal) {
      modal.classList.add('active');
      const dateInput = document.getElementById('rem-date');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().slice(0, 10);
      }
    }
  },

  closeModal() {
    const modal = document.getElementById('modal-new-reminder');
    if (modal) modal.classList.remove('active');
  },

  addReminderFromForm() {
    const title = document.getElementById('rem-title').value.trim();
    const date = document.getElementById('rem-date').value;
    const time = document.getElementById('rem-time').value;
    const priority = document.getElementById('rem-priority').value;
    const category = document.getElementById('rem-category').value.trim() || 'Financeiro';

    if (!title) return;

    this.reminders.unshift({
      id: 'rem-' + Date.now(),
      title,
      date,
      time,
      priority,
      category,
      completed: false
    });

    this.saveReminders();
    this.closeModal();
    this.render();
    document.getElementById('form-new-reminder').reset();
    AppState.showToast('Compromisso agendado com sucesso!');
  },

  toggleComplete(id) {
    const rem = this.reminders.find(r => r.id === id);
    if (rem) {
      rem.completed = !rem.completed;
      this.saveReminders();
      this.render();
    }
  },

  deleteReminder(id) {
    this.reminders = this.reminders.filter(r => r.id !== id);
    this.saveReminders();
    this.render();
    AppState.showToast('Lembrete removido.');
  }
};
