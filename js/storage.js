/* ===================================================================
   SD FINANÇAS PRO — GERENCIADOR DE DADOS & LOCALSTORAGE
   =================================================================== */

const STORAGE_KEYS = {
  TRANSACTIONS: 'sdf_transactions',
  ACCOUNTS: 'sdf_accounts',
  GOALS: 'sdf_goals',
  BUDGETS: 'sdf_budgets',
  SETTINGS: 'sdf_settings'
};

// Dados Iniciais Ricos de Demonstração (em Reais R$)
const INITIAL_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Nubank Principal',
    bank: 'Nubank',
    type: 'checking',
    balance: 8450.75,
    color: 'purple',
    cardNumber: '•••• 7842',
    limit: 15000.00,
    usedLimit: 3420.50,
    dueDate: 'Dia 10'
  },
  {
    id: 'acc-2',
    name: 'Banco Inter PJ & Invest',
    bank: 'Inter',
    type: 'investment',
    balance: 24320.00,
    color: 'emerald',
    cardNumber: '•••• 1930',
    limit: 10000.00,
    usedLimit: 1200.00,
    dueDate: 'Dia 15'
  },
  {
    id: 'acc-3',
    name: 'Reserva & Carteira Física',
    bank: 'Dinheiro / Carteira',
    type: 'cash',
    balance: 1850.00,
    color: 'dark',
    cardNumber: '•••• 9901',
    limit: 0,
    usedLimit: 0,
    dueDate: '-'
  }
];

const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    description: 'Salário & Pró-labore',
    amount: 9800.00,
    type: 'income',
    category: 'Salário',
    categoryIcon: 'briefcase',
    categoryColor: '#10b981',
    accountId: 'acc-1',
    date: '2026-09-05',
    status: 'paid'
  },
  {
    id: 'tx-2',
    description: 'Supermercado Pão de Açúcar',
    amount: 842.30,
    type: 'expense',
    category: 'Alimentação',
    categoryIcon: 'shopping-cart',
    categoryColor: '#f59e0b',
    accountId: 'acc-1',
    date: '2026-09-06',
    status: 'paid'
  },
  {
    id: 'tx-3',
    description: 'Condomínio e Aluguel',
    amount: 1950.00,
    type: 'expense',
    category: 'Moradia',
    categoryIcon: 'home',
    categoryColor: '#ef4444',
    accountId: 'acc-1',
    date: '2026-09-10',
    status: 'pending'
  },
  {
    id: 'tx-4',
    description: 'Consultoria Web & Design',
    amount: 3200.00,
    type: 'income',
    category: 'Serviços',
    categoryIcon: 'trending-up',
    categoryColor: '#06b6d4',
    accountId: 'acc-2',
    date: '2026-09-07',
    status: 'paid'
  },
  {
    id: 'tx-5',
    description: 'Combustível Posto Shell',
    amount: 280.00,
    type: 'expense',
    category: 'Transporte',
    categoryIcon: 'truck',
    categoryColor: '#8b5cf6',
    accountId: 'acc-1',
    date: '2026-09-08',
    status: 'paid'
  },
  {
    id: 'tx-6',
    description: 'Academia & Crossfit',
    amount: 189.90,
    type: 'expense',
    category: 'Saúde & Bem-estar',
    categoryIcon: 'activity',
    categoryColor: '#ec4899',
    accountId: 'acc-1',
    date: '2026-09-03',
    status: 'paid'
  },
  {
    id: 'tx-7',
    description: 'Rendimento Dividendos FIIs',
    amount: 415.50,
    type: 'income',
    category: 'Investimentos',
    categoryIcon: 'pie-chart',
    categoryColor: '#10b981',
    accountId: 'acc-2',
    date: '2026-09-08',
    status: 'paid'
  },
  {
    id: 'tx-8',
    description: 'Internet Fibra Óptica 1Gb',
    amount: 149.90,
    type: 'expense',
    category: 'Moradia',
    categoryIcon: 'wifi',
    categoryColor: '#ef4444',
    accountId: 'acc-1',
    date: '2026-09-12',
    status: 'pending'
  }
];

const INITIAL_GOALS = [
  {
    id: 'goal-1',
    name: 'Reserva de Emergência (6 Meses)',
    targetAmount: 30000.00,
    currentAmount: 21500.00,
    deadline: '2026-12-31',
    icon: 'shield',
    color: '#10b981'
  },
  {
    id: 'goal-2',
    name: 'Viagem de Férias para Europa',
    targetAmount: 18000.00,
    currentAmount: 9400.00,
    deadline: '2027-03-15',
    icon: 'plane',
    color: '#6366f1'
  },
  {
    id: 'goal-3',
    name: 'Troca de Carro / Entrada',
    targetAmount: 45000.00,
    currentAmount: 14200.00,
    deadline: '2027-08-30',
    icon: 'car',
    color: '#f59e0b'
  }
];

const INITIAL_BUDGETS = [
  { category: 'Alimentação', limit: 2200.00, icon: 'shopping-cart' },
  { category: 'Moradia', limit: 2500.00, icon: 'home' },
  { category: 'Transporte', limit: 900.00, icon: 'truck' },
  { category: 'Lazer & Restaurantes', limit: 800.00, icon: 'coffee' },
  { category: 'Saúde & Bem-estar', limit: 600.00, icon: 'activity' }
];

// Funções de Inicialização e Leitura
const Storage = {
  getAccounts() {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (!data) {
      this.saveAccounts(INITIAL_ACCOUNTS);
      return INITIAL_ACCOUNTS;
    }
    return JSON.parse(data);
  },
  saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  getTransactions() {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) {
      this.saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(data);
  },
  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getGoals() {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    if (!data) {
      this.saveGoals(INITIAL_GOALS);
      return INITIAL_GOALS;
    }
    return JSON.parse(data);
  },
  saveGoals(goals) {
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  getBudgets() {
    const data = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!data) {
      this.saveBudgets(INITIAL_BUDGETS);
      return INITIAL_BUDGETS;
    }
    return JSON.parse(data);
  },
  saveBudgets(budgets) {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  },

  // Formatadores
  formatCurrency(value) {
    const val = Number(value) || 0;
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  },

  // Exportar para JSON
  exportDataJSON() {
    const backup = {
      accounts: this.getAccounts(),
      transactions: this.getTransactions(),
      goals: this.getGoals(),
      budgets: this.getBudgets(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sd-financas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Exportar Transações para CSV
  exportTransactionsCSV() {
    const txs = this.getTransactions();
    let csv = 'ID;Data;Descrição;Tipo;Categoria;Valor (R$);Status\n';
    txs.forEach(t => {
      csv += `"${t.id}";"${t.date}";"${t.description.replace(/"/g, '""')}";"${t.type}";"${t.category}";"${t.amount.toFixed(2).replace('.', ',')}";"${t.status}"\n`;
    });
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sd-financas-lancamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // Restaurar dados originais de demonstração
  resetToDefault() {
    this.saveAccounts(INITIAL_ACCOUNTS);
    this.saveTransactions(INITIAL_TRANSACTIONS);
    this.saveGoals(INITIAL_GOALS);
    this.saveBudgets(INITIAL_BUDGETS);
  }
};
