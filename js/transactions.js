/* ===================================================================
   SD FINANÇAS PRO — GESTÃO DE TRANSAÇÕES & LANÇAMENTOS
   =================================================================== */

const TransactionsManager = {
  currentFilter: {
    type: 'all',
    status: 'all',
    category: 'all',
    search: ''
  },

  init() {
    this.renderDashboardMetrics();
    this.renderTransactionsList();
    this.renderRecentTransactions();
    this.setupEventListeners();
  },

  // Atualiza os cartões de indicadores no topo do Dashboard
  renderDashboardMetrics() {
    const transactions = Storage.getTransactions();
    const accounts = Storage.getAccounts();

    // Saldo Total consolidado de todas as contas
    const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);

    // Entradas e Saídas do mês
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpense += t.amount;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

    // Atualiza o DOM
    const elBalance = document.getElementById('metricTotalBalance');
    const elIncome = document.getElementById('metricTotalIncome');
    const elExpense = document.getElementById('metricTotalExpense');
    const elSavings = document.getElementById('metricSavingsRate');

    if (elBalance) elBalance.textContent = Storage.formatCurrency(totalBalance);
    if (elIncome) elIncome.textContent = Storage.formatCurrency(totalIncome);
    if (elExpense) elExpense.textContent = Storage.formatCurrency(totalExpense);
    if (elSavings) elSavings.textContent = `${savingsRate}% economizados`;

    // Atualiza gráficos
    ChartsManager.initCashflowChart(transactions);
    ChartsManager.initCategoryDonut(transactions);
  },

  // Renderiza a lista de transações recentes no Dashboard (máximo 5)
  renderRecentTransactions() {
    const container = document.getElementById('recentTransactionsList');
    if (!container) return;

    const txs = Storage.getTransactions().slice(0, 5);
    if (txs.length === 0) {
      container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 24px;">Nenhuma transação registrada.</td></tr>`;
      return;
    }

    container.innerHTML = txs.map(t => this.createTransactionRowHTML(t)).join('');
    if (window.lucide) lucide.createIcons();
  },

  // Renderiza a tabela completa da aba de Transações com filtros
  renderTransactionsList() {
    const container = document.getElementById('allTransactionsList');
    if (!container) return;

    let txs = Storage.getTransactions();

    // Filtros
    if (this.currentFilter.type !== 'all') {
      txs = txs.filter(t => t.type === this.currentFilter.type);
    }
    if (this.currentFilter.status !== 'all') {
      txs = txs.filter(t => t.status === this.currentFilter.status);
    }
    if (this.currentFilter.category !== 'all') {
      txs = txs.filter(t => t.category === this.currentFilter.category);
    }
    if (this.currentFilter.search.trim()) {
      const q = this.currentFilter.search.toLowerCase();
      txs = txs.filter(t => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    const countEl = document.getElementById('txFilteredCount');
    if (countEl) countEl.textContent = `${txs.length} lançamentos encontrados`;

    if (txs.length === 0) {
      container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 32px;">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>`;
      return;
    }

    container.innerHTML = txs.map(t => this.createTransactionRowHTML(t, true)).join('');
    if (window.lucide) lucide.createIcons();
  },

  createTransactionRowHTML(t, showActions = false) {
    const isIncome = t.type === 'income';
    const amountClass = isIncome ? 'amount-income' : 'amount-expense';
    const prefix = isIncome ? '+ ' : '- ';
    const statusBadge = t.status === 'paid' 
      ? `<span class="badge badge-paid"><i data-lucide="check-circle-2" style="width:12px;height:12px"></i> Pago</span>` 
      : `<span class="badge badge-pending"><i data-lucide="clock" style="width:12px;height:12px"></i> Pendente</span>`;

    const iconColor = t.categoryColor || (isIncome ? '#10b981' : '#ef4444');
    const iconName = t.categoryIcon || (isIncome ? 'arrow-down-left' : 'arrow-up-right');

    const actionsHtml = showActions ? `
      <td>
        <div style="display:flex; gap: 8px;">
          <button class="btn-icon btn-sm" title="Alternar Status" onclick="TransactionsManager.toggleStatus('${t.id}')">
            <i data-lucide="${t.status === 'paid' ? 'rotate-ccw' : 'check'}"></i>
          </button>
          <button class="btn-icon btn-sm" title="Excluir" onclick="TransactionsManager.deleteTransaction('${t.id}')" style="color:#ef4444">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </td>
    ` : '';

    return `
      <tr>
        <td>
          <div class="tx-item">
            <div class="tx-icon" style="background: ${iconColor}22; color: ${iconColor}">
              <i data-lucide="${iconName}"></i>
            </div>
            <div class="tx-info">
              <h5>${t.description}</h5>
              <p>${Storage.formatDate(t.date)}</p>
            </div>
          </div>
        </td>
        <td><span class="badge badge-category">${t.category}</span></td>
        <td>${statusBadge}</td>
        <td class="${amountClass}">${prefix}${Storage.formatCurrency(t.amount)}</td>
        ${actionsHtml}
      </tr>
    `;
  },

  // Alterna status entre pago e pendente
  toggleStatus(id) {
    const txs = Storage.getTransactions();
    const tx = txs.find(t => t.id === id);
    if (tx) {
      tx.status = tx.status === 'paid' ? 'pending' : 'paid';
      Storage.saveTransactions(txs);
      this.renderTransactionsList();
      this.renderRecentTransactions();
      this.renderDashboardMetrics();
      App.showToast(`Lançamento marcado como ${tx.status === 'paid' ? 'Pago' : 'Pendente'}`);
    }
  },

  // Exclui uma transação
  deleteTransaction(id) {
    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    let txs = Storage.getTransactions();
    txs = txs.filter(t => t.id !== id);
    Storage.saveTransactions(txs);
    this.renderTransactionsList();
    this.renderRecentTransactions();
    this.renderDashboardMetrics();
    App.showToast('Lançamento excluído com sucesso');
  },

  // Abre modal de criação
  openNewTransactionModal() {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    if (form) form.reset();

    // Data padrão para hoje
    const dateInput = document.getElementById('txDate');
    if (dateInput) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    // Preenche select de contas
    const selectAcc = document.getElementById('txAccount');
    if (selectAcc) {
      const accounts = Storage.getAccounts();
      selectAcc.innerHTML = accounts.map(a => `<option value="${a.id}">${a.name} (${Storage.formatCurrency(a.balance)})</option>`).join('');
    }

    if (modal) modal.classList.add('active');
    if (window.lucide) lucide.createIcons();
  },

  closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.remove('active');
  },

  // Salvar nova transação a partir do formulário
  saveTransactionFromForm(e) {
    e.preventDefault();
    const desc = document.getElementById('txDescription').value.trim();
    const amount = parseFloat(document.getElementById('txAmount').value);
    const type = document.getElementById('txType').value;
    const category = document.getElementById('txCategory').value;
    const accountId = document.getElementById('txAccount').value;
    const date = document.getElementById('txDate').value;
    const status = document.getElementById('txStatus').value;

    if (!desc || isNaN(amount) || amount <= 0) {
      alert('Por favor, preencha a descrição e um valor válido.');
      return;
    }

    // Atribui ícone inteligente pela categoria
    const iconMap = {
      'Salário': { icon: 'briefcase', color: '#10b981' },
      'Serviços': { icon: 'trending-up', color: '#06b6d4' },
      'Investimentos': { icon: 'pie-chart', color: '#10b981' },
      'Alimentação': { icon: 'shopping-cart', color: '#f59e0b' },
      'Moradia': { icon: 'home', color: '#ef4444' },
      'Transporte': { icon: 'truck', color: '#8b5cf6' },
      'Lazer & Restaurantes': { icon: 'coffee', color: '#ec4899' },
      'Saúde & Bem-estar': { icon: 'activity', color: '#3b82f6' }
    };

    const categoryMeta = iconMap[category] || { icon: 'dollar-sign', color: '#94a3b8' };

    const newTx = {
      id: 'tx-' + Date.now(),
      description: desc,
      amount: amount,
      type: type,
      category: category,
      categoryIcon: categoryMeta.icon,
      categoryColor: categoryMeta.color,
      accountId: accountId,
      date: date || new Date().toISOString().slice(0, 10),
      status: status
    };

    const txs = Storage.getTransactions();
    txs.unshift(newTx);
    Storage.saveTransactions(txs);

    // Atualiza saldo da conta se pago
    if (status === 'paid') {
      const accounts = Storage.getAccounts();
      const acc = accounts.find(a => a.id === accountId);
      if (acc) {
        if (type === 'income') acc.balance += amount;
        else if (type === 'expense') acc.balance -= amount;
        Storage.saveAccounts(accounts);
      }
    }

    this.closeTransactionModal();
    this.renderTransactionsList();
    this.renderRecentTransactions();
    this.renderDashboardMetrics();
    AccountsManager.renderAccounts();
    App.showToast('Transação registrada com sucesso!');
  },

  setupEventListeners() {
    const form = document.getElementById('transactionForm');
    if (form) {
      form.addEventListener('submit', (e) => this.saveTransactionFromForm(e));
    }

    // Filtro por tipo
    const filterType = document.getElementById('filterTxType');
    if (filterType) {
      filterType.addEventListener('change', (e) => {
        this.currentFilter.type = e.target.value;
        this.renderTransactionsList();
      });
    }

    // Filtro por status
    const filterStatus = document.getElementById('filterTxStatus');
    if (filterStatus) {
      filterStatus.addEventListener('change', (e) => {
        this.currentFilter.status = e.target.value;
        this.renderTransactionsList();
      });
    }

    // Filtro por busca
    const searchInput = document.getElementById('searchTx');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.currentFilter.search = e.target.value;
        this.renderTransactionsList();
      });
    }
  }
};
