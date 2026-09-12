/**
 * SD FINANÇAS ENTERPRISE - Transactions Management Module
 */

const TransactionsModule = {
  currentFilter: {
    type: 'all',
    category: 'all',
    search: '',
    month: ''
  },

  render() {
    this.renderFilterSelects();
    this.renderList();
  },

  renderFilterSelects() {
    const catSelect = document.getElementById('tx-filter-category');
    if (catSelect) {
      const categories = [...new Set(AppState.transactions.map(t => t.category))];
      catSelect.innerHTML = '<option value="all">Todas Categorias</option>' +
        categories.map(c => `<option value="${c}">${c}</option>`).join('');
    }

    const accSelectModal = document.getElementById('new-tx-account');
    if (accSelectModal) {
      accSelectModal.innerHTML = AppState.accounts.map(a =>
        `<option value="${a.id}">${a.name} (${AppState.formatCurrency(a.balance)})</option>`
      ).join('');
    }
  },

  renderList() {
    const tbody = document.getElementById('tx-table-body');
    if (!tbody) return;

    let filtered = [...AppState.transactions];

    if (this.currentFilter.type !== 'all') {
      filtered = filtered.filter(t => t.type === this.currentFilter.type);
    }

    if (this.currentFilter.category !== 'all') {
      filtered = filtered.filter(t => t.category === this.currentFilter.category);
    }

    if (this.currentFilter.search.trim()) {
      const q = this.currentFilter.search.toLowerCase();
      filtered = filtered.filter(t => t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">Nenhuma transação encontrada com os filtros selecionados.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(tx => {
      const isIncome = tx.type === 'income';
      const acc = AppState.accounts.find(a => a.id === tx.accountId);
      return `
        <tr>
          <td>
            <div style="font-weight:600; color:#fff;">${tx.desc}</div>
            <div style="font-size:0.75rem; color:#64748b;">ID: #${tx.id}</div>
          </td>
          <td>${AppState.formatDate(tx.date)}</td>
          <td><span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${tx.category}</span></td>
          <td style="color:#94a3b8;">${acc ? acc.name : 'Conta Geral'}</td>
          <td style="font-weight:700; font-family:var(--font-heading); color:${isIncome ? 'var(--emerald)' : 'var(--rose)'};">
            ${isIncome ? '+' : '-'} ${AppState.formatCurrency(tx.amount)}
          </td>
          <td>
            <button class="btn-icon" onclick="TransactionsModule.delete('${tx.id}')" title="Excluir Transação">
              <i data-lucide="trash-2" style="width:14px; height:14px; color:var(--rose);"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  openModal(type = 'expense') {
    const modal = document.getElementById('modal-transaction');
    if (!modal) return;

    const form = document.getElementById('form-new-tx');
    if (form) form.reset();

    const typeInput = document.getElementById('new-tx-type');
    if (typeInput) typeInput.value = type;

    const dateInput = document.getElementById('new-tx-date');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    modal.classList.add('active');
  },

  closeModal() {
    const modal = document.getElementById('modal-transaction');
    if (modal) modal.classList.remove('active');
  },

  saveFromForm(e) {
    e.preventDefault();
    const desc = document.getElementById('new-tx-desc').value.trim();
    const amount = parseFloat(document.getElementById('new-tx-amount').value);
    const type = document.getElementById('new-tx-type').value;
    const category = document.getElementById('new-tx-category').value.trim();
    const accountId = document.getElementById('new-tx-account').value;
    const date = document.getElementById('new-tx-date').value;

    if (!desc || isNaN(amount) || amount <= 0) {
      AppState.showToast('Preencha a descrição e um valor válido.', 'error');
      return;
    }

    const newTx = {
      id: 'tx-' + Date.now(),
      desc,
      amount,
      type,
      category: category || 'Geral',
      accountId,
      date: date || new Date().toISOString().split('T')[0],
      status: 'completed'
    };

    // Update account balance
    const acc = AppState.accounts.find(a => a.id === accountId);
    if (acc) {
      if (type === 'income') acc.balance += amount;
      else acc.balance -= amount;
      AppState.save('accounts');
    }

    AppState.transactions.unshift(newTx);
    AppState.save('transactions');

    this.closeModal();
    this.render();
    DashboardModule.render();
    AccountsModule.render();
    AppState.showToast(`Transação "${desc}" registrada com sucesso!`);
  },

  delete(id) {
    if (!confirm('Deseja realmente remover esta transação?')) return;

    const idx = AppState.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      const tx = AppState.transactions[idx];
      // Reverse account balance effect
      const acc = AppState.accounts.find(a => a.id === tx.accountId);
      if (acc) {
        if (tx.type === 'income') acc.balance -= tx.amount;
        else acc.balance += tx.amount;
        AppState.save('accounts');
      }

      AppState.transactions.splice(idx, 1);
      AppState.save('transactions');

      this.render();
      DashboardModule.render();
      AccountsModule.render();
      AppState.showToast('Transação removida com sucesso.');
    }
  }
};
