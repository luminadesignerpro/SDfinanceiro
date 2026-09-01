/**
 * SDFINANCEIRO — Checks Management Module
 */

const Checks = {
  activeStatusFilter: 'all',

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Status filter tabs
    const tabs = document.querySelectorAll('.checks-tabs-bar .filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeStatusFilter = tab.dataset.status;
        this.render();
      });
    });

    // Add check button
    const addBtn = document.getElementById('btn-add-check');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    // Form submit
    const form = document.getElementById('form-check');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }
  },

  openModal(checkToEdit = null) {
    const modal = document.getElementById('modal-check');
    const title = document.getElementById('modal-check-title');
    const form = document.getElementById('form-check');
    form.reset();

    const todayISO = new Date().toISOString().split('T')[0];

    if (checkToEdit) {
      title.textContent = 'Editar Cheque';
      document.getElementById('check-id').value = checkToEdit.id;
      form.querySelector(`input[name="check-type"][value="${checkToEdit.type}"]`).checked = true;
      document.getElementById('form-check-number').value = checkToEdit.number;
      document.getElementById('form-check-amount').value = checkToEdit.amount;
      document.getElementById('form-check-beneficiary').value = checkToEdit.beneficiary;
      document.getElementById('form-check-bank').value = checkToEdit.bank || '';
      document.getElementById('form-check-account-link').value = checkToEdit.accountId || '';
      document.getElementById('form-check-issue-date').value = checkToEdit.issueDate;
      document.getElementById('form-check-clearing-date').value = checkToEdit.clearingDate;
      document.getElementById('form-check-status').value = checkToEdit.status;
      document.getElementById('form-check-category').value = checkToEdit.category || 'Fornecedores';
      document.getElementById('form-check-notes').value = checkToEdit.notes || '';
    } else {
      title.textContent = 'Cadastrar Cheque';
      document.getElementById('check-id').value = '';
      document.getElementById('form-check-issue-date').value = todayISO;
      document.getElementById('form-check-clearing-date').value = todayISO;
      document.getElementById('form-check-status').value = 'pending';
    }

    modal.classList.add('active');
  },

  handleFormSubmit() {
    const id = document.getElementById('check-id').value;
    const type = document.querySelector('input[name="check-type"]:checked').value;
    const number = document.getElementById('form-check-number').value.trim();
    const amount = parseFloat(document.getElementById('form-check-amount').value) || 0;
    const beneficiary = document.getElementById('form-check-beneficiary').value.trim();
    const bank = document.getElementById('form-check-bank').value.trim();
    const accountId = document.getElementById('form-check-account-link').value;
    const issueDate = document.getElementById('form-check-issue-date').value;
    const clearingDate = document.getElementById('form-check-clearing-date').value;
    const status = document.getElementById('form-check-status').value;
    const category = document.getElementById('form-check-category').value;
    const notes = document.getElementById('form-check-notes').value.trim();

    let checks = Storage.getChecks();

    const checkData = {
      id: id || `chk_${Date.now()}`,
      type,
      number,
      amount,
      beneficiary,
      bank,
      accountId,
      issueDate,
      clearingDate,
      status,
      category,
      notes
    };

    if (id) {
      checks = checks.map(c => c.id === id ? checkData : c);
      App.showToast('Cheque atualizado com sucesso!', 'success');
    } else {
      checks.unshift(checkData);
      App.showToast('Cheque cadastrado com sucesso!', 'success');

      // Auto-create reminder in agenda for clearing date
      const agenda = Storage.getAgenda();
      agenda.push({
        id: `apt_chk_${Date.now()}`,
        title: `Compensação Cheque #${number} - ${beneficiary}`,
        description: `Cheque ${type === 'issued' ? 'emitido a pagar' : 'recebido a compensar'} no valor de R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        date: clearingDate,
        time: '10:00',
        priority: 'high',
        category: 'check',
        value: amount,
        status: 'pending',
        notes: `Banco: ${bank} | Conta: ${accountId}`
      });
      Storage.saveAgenda(agenda);
    }

    Storage.saveChecks(checks);
    App.closeModals();
    this.render();
    App.refreshAll();
  },

  toggleCheckStatus(id, newStatus) {
    let checks = Storage.getChecks();
    const check = checks.find(c => c.id === id);
    if (!check) return;

    check.status = newStatus;
    Storage.saveChecks(checks);
    App.showToast(`Status do cheque #${check.number} alterado para ${newStatus}.`, 'info');
    this.render();
    App.refreshAll();
  },

  deleteCheck(id) {
    if (!confirm('Deseja excluir este cheque?')) return;
    let checks = Storage.getChecks().filter(c => c.id !== id);
    Storage.saveChecks(checks);
    App.showToast('Cheque excluído.', 'info');
    this.render();
    App.refreshAll();
  },

  render() {
    const checks = Storage.getChecks();
    const accounts = Storage.getAccounts();
    const tbody = document.getElementById('checks-table-body');

    // Calculate Check KPIs
    const issuedPending = checks.filter(c => c.type === 'issued' && c.status === 'pending');
    const totalIssuedPending = issuedPending.reduce((sum, c) => sum + c.amount, 0);

    const receivedPending = checks.filter(c => c.type === 'received' && c.status === 'pending');
    const totalReceivedPending = receivedPending.reduce((sum, c) => sum + c.amount, 0);

    const clearedMonth = checks.filter(c => c.status === 'cleared');
    const totalClearedMonth = clearedMonth.reduce((sum, c) => sum + c.amount, 0);

    // Update KPI UI
    const elIssuedPending = document.getElementById('check-kpi-issued-pending');
    const elIssuedCount = document.getElementById('check-kpi-issued-count');
    const elReceivedPending = document.getElementById('check-kpi-received-pending');
    const elReceivedCount = document.getElementById('check-kpi-received-count');
    const elClearedMonth = document.getElementById('check-kpi-cleared-month');
    const sidebarBadge = document.getElementById('badge-pending-checks');

    if (elIssuedPending) elIssuedPending.textContent = `R$ ${totalIssuedPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elIssuedCount) elIssuedCount.textContent = `${issuedPending.length} cheques a pagar`;
    if (elReceivedPending) elReceivedPending.textContent = `R$ ${totalReceivedPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elReceivedCount) elReceivedCount.textContent = `${receivedPending.length} cheques a depositar`;
    if (elClearedMonth) elClearedMonth.textContent = `R$ ${totalClearedMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (sidebarBadge) sidebarBadge.textContent = issuedPending.length + receivedPending.length;

    // Filter Checks
    let filtered = checks;
    if (this.activeStatusFilter !== 'all') {
      if (this.activeStatusFilter === 'bounced') {
        filtered = checks.filter(c => c.status === 'bounced' || c.status === 'canceled');
      } else {
        filtered = checks.filter(c => c.status === this.activeStatusFilter);
      }
    }

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center" style="padding: 40px; color: var(--text-muted);">
            <i data-lucide="scroll-text" style="width: 36px; height: 36px; margin-bottom: 8px; opacity: 0.5;"></i>
            <p>Nenhum cheque encontrado nesta categoria.</p>
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    tbody.innerHTML = filtered.map(chk => {
      const acc = accounts.find(a => a.id === chk.accountId);
      const isIssued = chk.type === 'issued';
      const formattedIssue = chk.issueDate.split('-').reverse().join('/');
      const formattedClearing = chk.clearingDate.split('-').reverse().join('/');

      let badgeClass = 'badge-pending';
      let statusLabel = 'Pendente';

      if (chk.status === 'cleared') {
        badgeClass = 'badge-cleared';
        statusLabel = 'Compensado';
      } else if (chk.status === 'bounced') {
        badgeClass = 'badge-bounced';
        statusLabel = 'Devolvido';
      } else if (chk.status === 'canceled') {
        badgeClass = 'badge-canceled';
        statusLabel = 'Cancelado';
      }

      return `
        <tr>
          <td><b style="color: var(--text-primary);">#${chk.number}</b></td>
          <td>
            <span class="badge ${isIssued ? 'badge-expense' : 'badge-income'}">
              ${isIssued ? 'Emitido (Pagar)' : 'Recebido (Depósito)'}
            </span>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${chk.beneficiary}</div>
            ${chk.notes ? `<small style="color: var(--text-muted);">${chk.notes}</small>` : ''}
          </td>
          <td>
            <div>${chk.bank || 'Não especificado'}</div>
            ${acc ? `<small style="color: var(--primary);">${acc.name}</small>` : ''}
          </td>
          <td>${formattedIssue}</td>
          <td><b style="color: var(--amber);">${formattedClearing}</b></td>
          <td class="text-right" style="font-family: 'Outfit', sans-serif; font-weight: 700; color: ${isIssued ? 'var(--rose)' : 'var(--emerald)'};">
            R$ ${chk.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </td>
          <td class="text-center">
            <select class="btn-sm" style="background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 6px; outline: none; cursor: pointer;" onchange="Checks.toggleCheckStatus('${chk.id}', this.value)">
              <option value="pending" ${chk.status === 'pending' ? 'selected' : ''}>⏳ Pendente</option>
              <option value="cleared" ${chk.status === 'cleared' ? 'selected' : ''}>✅ Compensado</option>
              <option value="bounced" ${chk.status === 'bounced' ? 'selected' : ''}>❌ Devolvido</option>
              <option value="canceled" ${chk.status === 'canceled' ? 'selected' : ''}>🚫 Cancelado</option>
            </select>
          </td>
          <td class="text-center">
            <button class="btn-icon btn-sm" onclick="Checks.openModal(Storage.getChecks().find(c=>c.id==='${chk.id}'))" title="Editar">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="btn-icon btn-sm" onclick="Checks.deleteCheck('${chk.id}')" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    lucide.createIcons();
  }
};
