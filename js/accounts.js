/**
 * SDFINANCEIRO — Accounts & Cards Management Module (with Invoice Statement & Auto-select)
 */

const Accounts = {
  activeFilter: 'all',
  currentViewingInvoiceAccountId: null,

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Filter chips
    const chips = document.querySelectorAll('#account-type-filters .chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.dataset.type;
        this.render();
      });
    });

    // Account Type selector in Modal
    const typeSelect = document.getElementById('form-acc-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.toggleModalFields(e.target.value);
      });
    }

    // Account form submit
    const form = document.getElementById('form-account');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Add account button
    const addBtn = document.getElementById('btn-add-account');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Pay invoice button inside invoice modal
    const payInvoiceBtn = document.getElementById('btn-pay-invoice');
    if (payInvoiceBtn) {
      payInvoiceBtn.addEventListener('click', () => {
        if (this.currentViewingInvoiceAccountId) {
          this.payInvoice(this.currentViewingInvoiceAccountId);
        }
      });
    }
  },

  toggleModalFields(type) {
    const creditGroup = document.getElementById('credit-fields-group');
    const balanceGroup = document.getElementById('balance-fields-group');

    if (type === 'credit') {
      creditGroup.style.display = 'block';
      balanceGroup.style.display = 'none';
      document.getElementById('form-acc-limit').required = true;
      document.getElementById('form-acc-balance').required = false;
    } else {
      creditGroup.style.display = 'none';
      balanceGroup.style.display = 'block';
      document.getElementById('form-acc-limit').required = false;
      document.getElementById('form-acc-balance').required = true;
    }
  },

  openModal(accountToEdit = null) {
    const modal = document.getElementById('modal-account');
    const title = document.getElementById('modal-account-title');
    const form = document.getElementById('form-account');
    form.reset();

    if (accountToEdit) {
      title.textContent = 'Editar Cartão / Conta';
      document.getElementById('acc-id').value = accountToEdit.id;
      document.getElementById('form-acc-type').value = accountToEdit.type;
      document.getElementById('form-acc-name').value = accountToEdit.name;
      document.getElementById('form-acc-institution').value = accountToEdit.institution || '';

      if (accountToEdit.type === 'credit') {
        document.getElementById('form-acc-limit').value = accountToEdit.limit;
        document.getElementById('form-acc-card-last4').value = accountToEdit.last4 || '';
        document.getElementById('form-acc-closing-day').value = accountToEdit.closingDay || '';
        document.getElementById('form-acc-due-day').value = accountToEdit.dueDay || '';
      } else {
        document.getElementById('form-acc-balance').value = accountToEdit.balance;
      }

      // Color
      const colorRadio = form.querySelector(`input[name="acc-color"][value="${accountToEdit.color}"]`);
      if (colorRadio) colorRadio.checked = true;

      this.toggleModalFields(accountToEdit.type);
    } else {
      title.textContent = 'Adicionar Cartão ou Conta';
      document.getElementById('acc-id').value = '';
      this.toggleModalFields('credit');
    }

    modal.classList.add('active');
  },

  handleFormSubmit() {
    const id = document.getElementById('acc-id').value;
    const type = document.getElementById('form-acc-type').value;
    const name = document.getElementById('form-acc-name').value.trim();
    const color = document.querySelector('input[name="acc-color"]:checked')?.value || '#3b82f6';
    const institution = document.getElementById('form-acc-institution').value.trim();

    let accounts = Storage.getAccounts();

    let accountData = {
      id: id || `acc_${Date.now()}`,
      name,
      type,
      color,
      institution
    };

    if (type === 'credit') {
      const limit = parseFloat(document.getElementById('form-acc-limit').value) || 0;
      const last4 = document.getElementById('form-acc-card-last4').value.trim() || '0000';
      const closingDay = parseInt(document.getElementById('form-acc-closing-day').value) || 25;
      const dueDay = parseInt(document.getElementById('form-acc-due-day').value) || 5;

      accountData = {
        ...accountData,
        limit,
        usedLimit: id ? (accounts.find(a => a.id === id)?.usedLimit || 0) : 0,
        last4,
        closingDay,
        dueDay
      };
    } else {
      const balance = parseFloat(document.getElementById('form-acc-balance').value) || 0;
      const last4 = document.getElementById('form-acc-card-last4')?.value?.trim() || '';

      accountData = {
        ...accountData,
        balance,
        last4
      };
    }

    if (id) {
      accounts = accounts.map(a => a.id === id ? accountData : a);
      App.showToast('Conta/Cartão atualizado com sucesso!', 'success');
    } else {
      accounts.push(accountData);
      App.showToast('Conta/Cartão cadastrado com sucesso!', 'success');
    }

    Storage.saveAccounts(accounts);
    App.closeModals();
    this.render();
    App.refreshAll();
  },

  deleteAccount(id) {
    if (!confirm('Deseja realmente excluir este cartão/conta? Os lançamentos vinculados permanecerão no histórico.')) {
      return;
    }
    let accounts = Storage.getAccounts().filter(a => a.id !== id);
    Storage.saveAccounts(accounts);
    App.showToast('Conta/Cartão removido.', 'info');
    this.render();
    App.refreshAll();
  },

  // Recalculate credit card used limits and balances dynamically from transactions
  recalculateBalances() {
    const accounts = Storage.getAccounts();
    const transactions = Storage.getTransactions();

    accounts.forEach(acc => {
      if (acc.type === 'credit') {
        const spent = transactions
          .filter(t => t.accountId === acc.id && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const paid = transactions
          .filter(t => t.accountId === acc.id && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        acc.usedLimit = Math.max(0, spent - paid);
      }
    });

    Storage.saveAccounts(accounts);
  },

  // View Invoice Statement Modal (Tudo o que foi gasto no cartão)
  openInvoiceModal(accountId) {
    const accounts = Storage.getAccounts();
    const card = accounts.find(a => a.id === accountId);
    if (!card || card.type !== 'credit') return;

    this.currentViewingInvoiceAccountId = accountId;

    const modal = document.getElementById('modal-invoice');
    const cardNameEl = document.getElementById('modal-invoice-card-name');
    const totalAmountEl = document.getElementById('invoice-total-amount');
    const datesEl = document.getElementById('invoice-period-dates');
    const tbody = document.getElementById('invoice-items-tbody');

    if (cardNameEl) cardNameEl.textContent = `${card.name} (•••• ${card.last4 || '4242'})`;
    if (datesEl) datesEl.textContent = `Fechamento: Todo dia ${card.closingDay || 25} | Vencimento: Todo dia ${card.dueDay || 5}`;

    // Get all transactions on this card
    const transactions = Storage.getTransactions().filter(t => t.accountId === accountId && t.type === 'expense');
    
    // Sort descending by date
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalInvoice = transactions.reduce((sum, t) => sum + t.amount, 0);
    if (totalAmountEl) {
      totalAmountEl.textContent = `R$ ${totalInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    if (tbody) {
      if (transactions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="text-center" style="padding: 30px; color: var(--text-muted);">
              <i data-lucide="check-circle-2" style="width: 32px; height: 32px; opacity: 0.5; margin-bottom: 6px;"></i>
              <p>Nenhum gasto registrado nesta fatura até o momento.</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = transactions.map(tx => {
          const formattedDate = tx.date.split('-').reverse().join('/');
          return `
            <tr>
              <td><b>${formattedDate}</b></td>
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">${tx.description}</div>
                ${tx.notes ? `<small style="color: var(--text-muted);">${tx.notes}</small>` : ''}
              </td>
              <td><span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${tx.category}</span></td>
              <td><span class="badge" style="background: rgba(255,255,255,0.04);">${tx.installments > 1 ? `${tx.installments}x` : 'À Vista (1x)'}</span></td>
              <td class="text-right" style="font-weight: 700; font-family: 'Outfit', sans-serif; color: var(--rose);">
                R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    lucide.createIcons();
    modal.classList.add('active');
  },

  // Quick Pay Invoice Action
  payInvoice(accountId) {
    const accounts = Storage.getAccounts();
    const card = accounts.find(a => a.id === accountId);
    if (!card) return;

    const invoiceTotal = card.usedLimit || 0;
    if (invoiceTotal <= 0) {
      App.showToast('Esta fatura já está zerada ou quitada!', 'info');
      return;
    }

    if (!confirm(`Deseja confirmar a quitação da fatura de R$ ${invoiceTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do cartão ${card.name}?`)) {
      return;
    }

    // Register an income payment on the credit card to clear usedLimit
    const todayISO = new Date().toISOString().split('T')[0];
    const transactions = Storage.getTransactions();
    transactions.unshift({
      id: `tx_pay_${Date.now()}`,
      type: 'income',
      amount: invoiceTotal,
      date: todayISO,
      description: `Pagamento de Fatura — ${card.name}`,
      accountId: card.id,
      category: 'Serviços',
      installments: 1,
      status: 'completed',
      notes: 'Quitação integral de fatura'
    });

    Storage.saveTransactions(transactions);
    this.recalculateBalances();

    App.showToast('Fatura quitada com sucesso!', 'success');
    App.closeModals();
    App.refreshAll();
  },

  render() {
    const accounts = Storage.getAccounts();
    const container = document.getElementById('accounts-grid');
    if (!container) return;

    // Update Counts
    document.getElementById('count-all-acc').textContent = accounts.length;
    document.getElementById('count-credit-acc').textContent = accounts.filter(a => a.type === 'credit').length;
    document.getElementById('count-debit-acc').textContent = accounts.filter(a => a.type === 'debit' || a.type === 'savings').length;
    document.getElementById('count-cash-acc').textContent = accounts.filter(a => a.type === 'cash').length;
    
    // Sidebar badge
    const badge = document.getElementById('badge-accounts-count');
    if (badge) badge.textContent = accounts.length;

    // Filter
    let filtered = accounts;
    if (this.activeFilter === 'credit') {
      filtered = accounts.filter(a => a.type === 'credit');
    } else if (this.activeFilter === 'debit') {
      filtered = accounts.filter(a => a.type === 'debit' || a.type === 'savings');
    } else if (this.activeFilter === 'cash') {
      filtered = accounts.filter(a => a.type === 'cash');
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-placeholder" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
          <i data-lucide="credit-card" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4;"></i>
          <p>Nenhuma conta ou cartão encontrado nesta categoria.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = filtered.map(acc => {
      if (acc.type === 'credit') {
        const availableLimit = Math.max(0, acc.limit - (acc.usedLimit || 0));
        const percentUsed = Math.min(100, Math.round(((acc.usedLimit || 0) / (acc.limit || 1)) * 100));
        let progressClass = 'safe';
        if (percentUsed > 80) progressClass = 'danger';
        else if (percentUsed > 50) progressClass = 'warn';

        return `
          <div class="account-card-wrapper">
            <div class="fin-card" style="background: linear-gradient(135deg, ${acc.color} 0%, #0f172a 120%);">
              <div class="fin-card-bg-overlay"></div>
              <div class="fin-card-top">
                <span class="fin-card-brand">${acc.institution || 'CRÉDITO'}</span>
                <span class="fin-card-type-tag">Crédito</span>
              </div>
              
              <div class="fin-card-chip-row">
                <div class="emv-chip"></div>
                <span class="contactless-icon">📡</span>
              </div>

              <div class="fin-card-number">•••• •••• •••• ${acc.last4 || '4242'}</div>

              <div class="fin-card-bottom">
                <div class="fin-card-holder">
                  <small>Titular / Cartão</small>
                  <span>${acc.name}</span>
                </div>
                <div class="fin-card-balance">
                  <small>Fatura Atual</small>
                  <span>R$ ${(acc.usedLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- Meta details under card -->
            <div class="account-meta-card">
              <div class="account-limit-bar-wrap">
                <div class="account-limit-labels">
                  <span>Limite Usado: <b>${percentUsed}%</b></span>
                  <span>Disponível: <b>R$ ${availableLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill ${progressClass}" style="width: ${percentUsed}%"></div>
                </div>
              </div>

              <div class="account-dates-row">
                <span>Fechamento: Dia ${acc.closingDay || 25}</span>
                <span>Vencimento: Dia ${acc.dueDay || 5}</span>
                <span>Total: R$ ${acc.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div class="account-actions-row">
                <button class="btn btn-primary btn-sm" onclick="Accounts.openInvoiceModal('${acc.id}')" title="Ver todos os gastos da fatura">
                  <i data-lucide="receipt-text"></i> Ver Fatura
                </button>
                <div class="account-actions-right">
                  <button class="btn btn-secondary btn-sm" onclick="Accounts.openModal(Storage.getAccounts().find(a=>a.id==='${acc.id}'))" title="Editar">
                    <i data-lucide="edit-3"></i>
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="Accounts.deleteAccount('${acc.id}')" title="Excluir">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else {
        // Debit, Bank Account, or Cash Wallet
        const isCash = acc.type === 'cash';
        const typeLabel = isCash ? 'Dinheiro Físico' : 'Conta / Débito';

        return `
          <div class="account-card-wrapper">
            <div class="fin-card" style="background: linear-gradient(135deg, ${acc.color} 0%, #0d1527 120%);">
              <div class="fin-card-bg-overlay"></div>
              <div class="fin-card-top">
                <span class="fin-card-brand">${acc.institution || (isCash ? 'CARTEIRA' : 'BANCO')}</span>
                <span class="fin-card-type-tag">${typeLabel}</span>
              </div>
              
              <div class="fin-card-chip-row">
                ${isCash ? '<span style="font-size: 1.6rem;">💵</span>' : '<div class="emv-chip"></div><span class="contactless-icon">📡</span>'}
              </div>

              <div class="fin-card-number">${isCash ? 'CARTEIRA & COFRE' : `•••• •••• •••• ${acc.last4 || '1020'}`}</div>

              <div class="fin-card-bottom">
                <div class="fin-card-holder">
                  <small>Nome da Conta</small>
                  <span>${acc.name}</span>
                </div>
                <div class="fin-card-balance">
                  <small>Saldo Disponível</small>
                  <span>R$ ${(acc.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <!-- Meta details under card -->
            <div class="account-meta-card">
              <div class="account-dates-row">
                <span>Tipo: ${typeLabel}</span>
                <span>Liquidez Imediata</span>
              </div>

              <div class="account-actions-row">
                <span style="font-size: 0.75rem; color: var(--text-muted);">Status: Ativo</span>
                <div class="account-actions-right">
                  <button class="btn btn-secondary btn-sm" onclick="Accounts.openModal(Storage.getAccounts().find(a=>a.id==='${acc.id}'))" title="Editar">
                    <i data-lucide="edit-3"></i>
                  </button>
                  <button class="btn btn-outline btn-sm" onclick="Accounts.deleteAccount('${acc.id}')" title="Excluir">
                    <i data-lucide="trash-2"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    }).join('');

    lucide.createIcons();
    this.populateAccountSelects();
  },

  populateAccountSelects() {
    const accounts = Storage.getAccounts();
    const selects = [
      document.getElementById('form-tx-account'),
      document.getElementById('tx-filter-account'),
      document.getElementById('form-check-account-link')
    ];

    selects.forEach(sel => {
      if (!sel) return;
      const isFilter = sel.id.startsWith('tx-filter');
      const isCheckLink = sel.id.includes('check');

      let optionsHTML = isFilter ? '<option value="all">Todas as Contas/Meios</option>' : '';
      if (isCheckLink) optionsHTML = '<option value="">Nenhuma conta vinculada</option>';

      accounts.forEach(acc => {
        let label = `${acc.name} (${acc.type === 'credit' ? 'Crédito' : 'Saldo'})`;
        optionsHTML += `<option value="${acc.id}">${label}</option>`;
      });

      sel.innerHTML = optionsHTML;
    });
  }
};
