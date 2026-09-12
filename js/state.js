/**
 * SD FINANÇAS ENTERPRISE - Reactive State & Core Utilities
 */

const AppState = {
  accounts: [],
  cards: [],
  transactions: [],
  bills: [],
  goals: [],
  investments: [],
  settings: {},

  init() {
    StorageEngine.init();
    this.reloadAll();
  },

  reloadAll() {
    this.accounts = StorageEngine.load(StorageEngine.KEYS.ACCOUNTS) || [];
    this.cards = StorageEngine.load(StorageEngine.KEYS.CARDS) || [];
    this.transactions = StorageEngine.load(StorageEngine.KEYS.TRANSACTIONS) || [];
    this.bills = StorageEngine.load(StorageEngine.KEYS.BILLS) || [];
    this.goals = StorageEngine.load(StorageEngine.KEYS.GOALS) || [];
    this.investments = StorageEngine.load(StorageEngine.KEYS.INVESTMENTS) || [];
    this.settings = StorageEngine.load(StorageEngine.KEYS.SETTINGS) || {};
  },

  save(entity) {
    switch (entity) {
      case 'accounts':
        StorageEngine.save(StorageEngine.KEYS.ACCOUNTS, this.accounts);
        break;
      case 'cards':
        StorageEngine.save(StorageEngine.KEYS.CARDS, this.cards);
        break;
      case 'transactions':
        StorageEngine.save(StorageEngine.KEYS.TRANSACTIONS, this.transactions);
        break;
      case 'bills':
        StorageEngine.save(StorageEngine.KEYS.BILLS, this.bills);
        break;
      case 'goals':
        StorageEngine.save(StorageEngine.KEYS.GOALS, this.goals);
        break;
      case 'investments':
        StorageEngine.save(StorageEngine.KEYS.INVESTMENTS, this.investments);
        break;
      case 'settings':
        StorageEngine.save(StorageEngine.KEYS.SETTINGS, this.settings);
        break;
    }
  },

  // Calculations
  getTotalBalance() {
    return this.accounts.reduce((acc, a) => acc + (parseFloat(a.balance) || 0), 0);
  },

  getTotalInvestments() {
    return this.investments.reduce((acc, i) => acc + (parseFloat(i.current) || 0), 0);
  },

  getMonthlyIncome(yearMonth) {
    const currentYM = yearMonth || new Date().toISOString().slice(0, 7);
    return this.transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentYM))
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  },

  getMonthlyExpenses(yearMonth) {
    const currentYM = yearMonth || new Date().toISOString().slice(0, 7);
    return this.transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentYM))
      .reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
  },

  getPendingBillsSummary() {
    const pendingPayable = this.bills
      .filter(b => b.type === 'payable' && b.status === 'pending')
      .reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

    const pendingReceivable = this.bills
      .filter(b => b.type === 'receivable' && b.status === 'pending')
      .reduce((acc, b) => acc + (parseFloat(b.amount) || 0), 0);

    return { payable: pendingPayable, receivable: pendingReceivable };
  },

  // Formatters
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  },

  formatDate(dateStr) {
    if (!dateStr) return '--';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-triangle'}" style="width: 18px; height: 18px; color: ${type === 'success' ? '#10b981' : '#f43f5e'}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
