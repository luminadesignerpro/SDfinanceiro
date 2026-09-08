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

    // Search input
    const searchInput = document.getElementById('input-search-checks');
    const clearSearchBtn = document.getElementById('btn-clear-checks-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        if (clearSearchBtn) clearSearchBtn.style.display = this.searchQuery ? 'inline-flex' : 'none';
        this.render();
      });
    }

    if (clearSearchBtn && searchInput) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        this.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        this.render();
      });
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

  searchQuery: '',

  render() {
    const checks = Storage.getChecks();
    const accounts = Storage.getAccounts();
    const tbody = document.getElementById('checks-table-body');
    const cardsContainer = document.getElementById('checks-cards-list');

    // Calculate Check KPIs
    const issuedPending = checks.filter(c => c.type === 'issued' && c.status === 'pending');
    const totalIssuedPending = issuedPending.reduce((sum, c) => sum + c.amount, 0);

    const receivedPending = checks.filter(c => c.type === 'received' && c.status === 'pending');
    const totalReceivedPending = receivedPending.reduce((sum, c) => sum + c.amount, 0);

    const clearedMonth = checks.filter(c => c.status === 'cleared');
    const totalClearedMonth = clearedMonth.reduce((sum, c) => sum + c.amount, 0);

    // Update KPI UI
    const elIssuedPending = document.getElementById('check-kpi-issued-pending');
    const elReceivedPending = document.getElementById('check-kpi-received-pending');
    const elClearedMonth = document.getElementById('check-kpi-cleared-month');
    const sidebarBadge = document.getElementById('badge-pending-checks');

    if (elIssuedPending) elIssuedPending.textContent = `R$ ${totalIssuedPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elReceivedPending) elReceivedPending.textContent = `R$ ${totalReceivedPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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

    if (this.searchQuery) {
      filtered = filtered.filter(c => 
        (c.number && c.number.toLowerCase().includes(this.searchQuery)) ||
        (c.beneficiary && c.beneficiary.toLowerCase().includes(this.searchQuery)) ||
        (c.bank && c.bank.toLowerCase().includes(this.searchQuery)) ||
        (c.notes && c.notes.toLowerCase().includes(this.searchQuery))
      );
    }

    // Render Cards (Estilo Luxury da Imagem 2)
    if (cardsContainer) {
      if (filtered.length === 0) {
        cardsContainer.innerHTML = `
          <div class="empty-state-pro">
            <i data-lucide="scroll-text"></i>
            <h4>Nenhum cheque encontrado</h4>
            <p>Não há cheques com os filtros aplicados.</p>
            <button type="button" class="btn btn-primary btn-sm" onclick="Checks.openModal()" style="margin-top: 10px;">
              + Cadastrar Cheque
            </button>
          </div>
        `;
      } else {
        cardsContainer.innerHTML = filtered.map(chk => {
          const acc = accounts.find(a => a.id === chk.accountId);
          const isIssued = chk.type === 'issued';
          const formattedIssue = chk.issueDate ? chk.issueDate.split('-').reverse().join('/') : '';
          const formattedClearing = chk.clearingDate ? chk.clearingDate.split('-').reverse().join('/') : '';

          let statusLabel = 'Pendente';
          if (chk.status === 'cleared') statusLabel = 'Compensado';
          else if (chk.status === 'bounced') statusLabel = 'Devolvido';
          else if (chk.status === 'canceled') statusLabel = 'Cancelado';

          return `
            <div class="comp-product-card check-card-pro" id="check-card-${chk.id}">
              <div class="comp-card-top" style="justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span class="comp-cat-tag" style="${isIssued ? 'background: rgba(245, 158, 11, 0.12); border-color: rgba(245, 158, 11, 0.6); color: #fbbf24;' : 'background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.6); color: #10b981;'}">
                    ${isIssued ? 'EMITIDO (A PAGAR)' : 'RECEBIDO (DEPÓSITO)'}
                  </span>
                  <h3 class="comp-prod-title">#${App.escapeHTML(chk.number)}</h3>
                </div>
                <span class="comp-lowest-badge" style="${chk.status === 'cleared' ? 'background: #10b981; color: #022c22;' : (chk.status === 'pending' ? 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);' : 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);')}">
                  ${statusLabel}
                </span>
              </div>

              <div class="comp-quotes-grid" style="grid-template-columns: repeat(2, 1fr); gap: 8px;">
                <div class="comp-supplier-box">
                  <div class="comp-supplier-header">
                    <span class="comp-supplier-name"><i data-lucide="user"></i> Favorecido</span>
                  </div>
                  <div style="font-weight: 700; color: #ffffff; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${App.escapeHTML(chk.beneficiary)}
                  </div>
                  ${chk.notes ? `<small style="color: #94a3b8; font-size: 0.72rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${App.escapeHTML(chk.notes)}</small>` : ''}
                </div>

                <div class="comp-supplier-box">
                  <div class="comp-supplier-header">
                    <span class="comp-supplier-name"><i data-lucide="building-2"></i> Banco</span>
                  </div>
                  <div style="font-weight: 700; color: #cbd5e1; font-size: 0.92rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${App.escapeHTML(chk.bank || 'Não especificado')}
                  </div>
                  ${acc ? `<small style="color: #f59e0b; font-size: 0.72rem;">${App.escapeHTML(acc.name)}</small>` : ''}
                </div>

                <div class="comp-supplier-box">
                  <div class="comp-supplier-header">
                    <span class="comp-supplier-name"><i data-lucide="calendar"></i> Bom Para</span>
                  </div>
                  <div style="font-family: 'Outfit', sans-serif; font-weight: 800; color: #fbbf24; font-size: 1rem;">
                    ${formattedClearing}
                  </div>
                  <small style="color: #64748b; font-size: 0.72rem;">Emissão: ${formattedIssue}</small>
                </div>

                <div class="comp-supplier-box ${!isIssued ? 'is-best-price' : ''}">
                  <div class="comp-supplier-header">
                    <span class="comp-supplier-name"><i data-lucide="banknote"></i> Valor</span>
                  </div>
                  <div class="comp-price-row">
                    <span class="comp-currency">R$</span>
                    <span class="comp-price-val" style="color: ${isIssued ? '#f87171' : '#10b981'}; font-size: 1.15rem;">
                      ${chk.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              <div class="comp-card-footer" style="padding-top: 10px; margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  ${chk.status === 'pending' ? `
                    <button type="button" class="comp-buy-btn btn-green" style="padding: 6px 14px; width: auto;" onclick="Checks.toggleCheckStatus('${chk.id}', 'cleared')">
                      <i data-lucide="check-circle-2"></i> <span>Compensar</span>
                    </button>
                  ` : `
                    <button type="button" class="comp-buy-btn" style="padding: 6px 14px; width: auto;" onclick="Checks.toggleCheckStatus('${chk.id}', 'pending')">
                      <i data-lucide="rotate-ccw"></i> <span>Pendente</span>
                    </button>
                  `}
                </div>

                <div class="comp-actions-group">
                  <button type="button" class="comp-btn-icon" onclick="Checks.openModal(Storage.getChecks().find(c=>c.id==='${chk.id}'))" title="Editar">
                    <i data-lucide="edit-3"></i>
                  </button>
                  <button type="button" class="comp-btn-icon btn-danger-icon" onclick="Checks.deleteCheck('${chk.id}')" title="Excluir">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Fallback table body if exists
    if (tbody) {
      tbody.innerHTML = '';
    }

    lucide.createIcons();
  }
};
