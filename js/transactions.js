/**
 * SDFINANCEIRO — Transactions Management Module
 */

const Transactions = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Search input
    const searchInput = document.getElementById('tx-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => this.render());
    }

    // Filter selects
    ['tx-filter-type', 'tx-filter-account', 'tx-filter-category'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.render());
      }
    });

    // Clear filters button
    const clearBtn = document.getElementById('btn-clear-tx-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('tx-search').value = '';
        document.getElementById('tx-filter-type').value = 'all';
        document.getElementById('tx-filter-account').value = 'all';
        document.getElementById('tx-filter-category').value = 'all';
        this.render();
      });
    }

    // New transaction button
    const addBtn = document.getElementById('btn-add-transaction');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openModal());
    }

    const quickBtn = document.getElementById('btn-quick-transaction');
    if (quickBtn) {
      quickBtn.addEventListener('click', () => this.openModal());
    }

    // Form submit
    const form = document.getElementById('form-transaction');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });
    }

    // Export CSV
    const exportBtn = document.getElementById('btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportCSV());
    }
  },

  openModal(transactionToEdit = null) {
    const modal = document.getElementById('modal-transaction');
    const title = document.getElementById('modal-transaction-title');
    const form = document.getElementById('form-transaction');
    form.reset();

    const todayISO = new Date().toISOString().split('T')[0];

    if (transactionToEdit) {
      title.textContent = 'Editar Lançamento';
      document.getElementById('tx-id').value = transactionToEdit.id;
      form.querySelector(`input[name="tx-type"][value="${transactionToEdit.type}"]`).checked = true;
      document.getElementById('form-tx-amount').value = transactionToEdit.amount;
      document.getElementById('form-tx-date').value = transactionToEdit.date;
      document.getElementById('form-tx-desc').value = transactionToEdit.description;
      document.getElementById('form-tx-account').value = transactionToEdit.accountId;
      document.getElementById('form-tx-category').value = transactionToEdit.category;
      document.getElementById('form-tx-installments').value = transactionToEdit.installments || 1;
      document.getElementById('form-tx-status').value = transactionToEdit.status || 'completed';
      document.getElementById('form-tx-notes').value = transactionToEdit.notes || '';
    } else {
      title.textContent = 'Novo Lançamento';
      document.getElementById('tx-id').value = '';
      document.getElementById('form-tx-date').value = todayISO;
      document.getElementById('form-tx-status').value = 'completed';
      document.getElementById('form-tx-installments').value = '1';
    }

    modal.classList.add('active');
  },

  handleFormSubmit() {
    const id = document.getElementById('tx-id').value;
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const amount = parseFloat(document.getElementById('form-tx-amount').value) || 0;
    const date = document.getElementById('form-tx-date').value;
    const description = document.getElementById('form-tx-desc').value.trim();
    const accountId = document.getElementById('form-tx-account').value;
    const category = document.getElementById('form-tx-category').value;
    const installments = parseInt(document.getElementById('form-tx-installments').value) || 1;
    const status = document.getElementById('form-tx-status').value;
    const notes = document.getElementById('form-tx-notes').value.trim();

    let transactions = Storage.getTransactions();
    let accounts = Storage.getAccounts();
    const targetAccount = accounts.find(a => a.id === accountId);

    const txData = {
      id: id || `tx_${Date.now()}`,
      type,
      amount,
      date,
      description,
      accountId,
      category,
      installments,
      status,
      notes
    };

    if (id) {
      // If editing, find old transaction to adjust balance if needed
      const oldTx = transactions.find(t => t.id === id);
      if (oldTx && targetAccount && targetAccount.type !== 'credit') {
        // Revert old
        if (oldTx.type === 'income') targetAccount.balance -= oldTx.amount;
        if (oldTx.type === 'expense') targetAccount.balance += oldTx.amount;
        // Apply new
        if (type === 'income') targetAccount.balance += amount;
        if (type === 'expense') targetAccount.balance -= amount;
      }
      transactions = transactions.map(t => t.id === id ? txData : t);
      App.showToast('Lançamento atualizado!', 'success');
    } else {
      // Add new and update balance if debit/cash
      if (targetAccount && targetAccount.type !== 'credit') {
        if (type === 'income') targetAccount.balance += amount;
        if (type === 'expense') targetAccount.balance -= amount;
      }
      transactions.unshift(txData);
      App.showToast('Lançamento registrado com sucesso!', 'success');
    }

    Storage.saveAccounts(accounts);
    Storage.saveTransactions(transactions);
    Accounts.recalculateBalances();

    App.closeModals();
    this.render();
    App.refreshAll();
  },

  deleteTransaction(id) {
    if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

    let transactions = Storage.getTransactions();
    let accounts = Storage.getAccounts();
    const tx = transactions.find(t => t.id === id);

    if (tx) {
      const targetAccount = accounts.find(a => a.id === tx.accountId);
      if (targetAccount && targetAccount.type !== 'credit') {
        if (tx.type === 'income') targetAccount.balance -= tx.amount;
        if (tx.type === 'expense') targetAccount.balance += tx.amount;
        Storage.saveAccounts(accounts);
      }
    }

    transactions = transactions.filter(t => t.id !== id);
    Storage.saveTransactions(transactions);
    Accounts.recalculateBalances();

    App.showToast('Lançamento excluído.', 'info');
    this.render();
    App.refreshAll();
  },

  getFilteredTransactions() {
    const transactions = Storage.getTransactions();
    const accounts = Storage.getAccounts();

    const searchTerm = (document.getElementById('tx-search')?.value || '').toLowerCase().trim();
    const typeFilter = document.getElementById('tx-filter-type')?.value || 'all';
    const accountFilter = document.getElementById('tx-filter-account')?.value || 'all';
    const categoryFilter = document.getElementById('tx-filter-category')?.value || 'all';
    const globalPeriod = document.getElementById('select-global-period')?.value || 'current_month';

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    return transactions.filter(tx => {
      // Date Period Filtering (Dia, Semana, Mês, Ano, Busca por Data)
      if (typeof App !== 'undefined' && App.isDateInSelectedPeriod) {
        if (!App.isDateInSelectedPeriod(tx.date)) return false;
      }

      // Search
      if (searchTerm) {
        const matchDesc = tx.description.toLowerCase().includes(searchTerm);
        const matchNotes = (tx.notes || '').toLowerCase().includes(searchTerm);
        const matchCat = tx.category.toLowerCase().includes(searchTerm);
        if (!matchDesc && !matchNotes && !matchCat) return false;
      }

      // Type
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

      // Account
      if (accountFilter !== 'all' && tx.accountId !== accountFilter) return false;

      // Category
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

      return true;
    });
  },

  render() {
    const filtered = this.getFilteredTransactions();
    const accounts = Storage.getAccounts();
    const tbody = document.getElementById('transactions-table-body');
    const dashboardRecent = document.getElementById('dashboard-recent-transactions');

    let totalIncome = 0;
    let totalExpense = 0;

    filtered.forEach(tx => {
      if (tx.type === 'income') totalIncome += tx.amount;
      if (tx.type === 'expense') totalExpense += tx.amount;
    });

    const net = totalIncome - totalExpense;

    const sumIncomeEl = document.getElementById('tx-sum-income');
    const sumExpenseEl = document.getElementById('tx-sum-expense');
    const sumNetEl = document.getElementById('tx-sum-net');

    if (sumIncomeEl) sumIncomeEl.textContent = `R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (sumExpenseEl) sumExpenseEl.textContent = `R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (sumNetEl) {
      sumNetEl.textContent = `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      sumNetEl.className = net >= 0 ? 'text-emerald' : 'text-rose';
    }

    // Render Table
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center" style="padding: 40px; color: var(--text-muted);">
              <i data-lucide="inbox" style="width: 36px; height: 36px; margin-bottom: 8px; opacity: 0.5;"></i>
              <p>Nenhum lançamento encontrado para os filtros selecionados.</p>
            </td>
          </tr>
        `;
      } else {
        // Sort by date descending
        const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
        tbody.innerHTML = sorted.map(tx => {
          const acc = accounts.find(a => a.id === tx.accountId);
          const accName = acc ? acc.name : 'Conta Geral';
          const isIncome = tx.type === 'income';
          const formattedDate = tx.date.split('-').reverse().join('/');

          return `
            <tr>
              <td><b>${formattedDate}</b></td>
              <td>
                <div style="font-weight: 600; color: var(--text-primary);">${tx.description}</div>
                ${tx.notes ? `<small style="color: var(--text-muted);">${tx.notes}</small>` : ''}
              </td>
              <td><span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${tx.category}</span></td>
              <td>
                <span style="display: inline-flex; align-items: center; gap: 6px;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: ${acc?.color || '#3b82f6'};"></span>
                  ${accName}
                </span>
              </td>
              <td>
                <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
                  ${isIncome ? 'Receita' : 'Despesa'} ${tx.installments > 1 ? `(${tx.installments}x)` : ''}
                </span>
              </td>
              <td class="text-right" style="font-weight: 700; font-family: 'Outfit', sans-serif; color: ${isIncome ? 'var(--emerald)' : 'var(--rose)'};">
                ${isIncome ? '+' : '-'} R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td class="text-center">
                <button class="btn-icon btn-sm" onclick="Transactions.openModal(Storage.getTransactions().find(t=>t.id==='${tx.id}'))" title="Editar">
                  <i data-lucide="edit-3"></i>
                </button>
                <button class="btn-icon btn-sm" onclick="Transactions.deleteTransaction('${tx.id}')" title="Excluir">
                  <i data-lucide="trash-2"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Compact Dashboard Widget (Top 5)
    if (dashboardRecent) {
      const recent = [...Storage.getTransactions()]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      if (recent.length === 0) {
        dashboardRecent.innerHTML = '<p class="text-muted text-center" style="padding: 20px;">Nenhuma transação recente.</p>';
      } else {
        dashboardRecent.innerHTML = recent.map(tx => {
          const acc = accounts.find(a => a.id === tx.accountId);
          const isIncome = tx.type === 'income';
          const formattedDate = tx.date.split('-').reverse().slice(0, 2).join('/');

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-subtle);">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: ${isIncome ? 'var(--emerald-light)' : 'var(--rose-light)'}; color: ${isIncome ? 'var(--emerald)' : 'var(--rose)'}; display: flex; align-items: center; justify-content: center;">
                  <i data-lucide="${isIncome ? 'arrow-down-left' : 'arrow-up-right'}" style="width: 18px; height: 18px;"></i>
                </div>
                <div>
                  <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">${tx.description}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted);">${formattedDate} • ${acc?.name || 'Geral'}</div>
                </div>
              </div>
              <div style="font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 0.95rem; color: ${isIncome ? 'var(--emerald)' : 'var(--rose)'};">
                ${isIncome ? '+' : '-'} R$ ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          `;
        }).join('');
      }
    }

    lucide.createIcons();
  },

  exportCSV() {
    const transactions = this.getFilteredTransactions();
    const accounts = Storage.getAccounts();

    if (transactions.length === 0) {
      App.showToast('Nenhum lançamento para exportar.', 'error');
      return;
    }

    let csv = 'Data;Descricao;Categoria;Forma de Pagamento;Tipo;Valor;Status;Observacoes\n';
    transactions.forEach(tx => {
      const acc = accounts.find(a => a.id === tx.accountId);
      const accName = acc ? acc.name : '';
      csv += `"${tx.date}";"${tx.description}";"${tx.category}";"${accName}";"${tx.type}";"${tx.amount.toFixed(2).replace('.', ',')}";"${tx.status}";"${tx.notes || ''}"\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lancamentos_sdfinanceiro_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    App.showToast('Relatório CSV exportado com sucesso!', 'success');
  }
};
