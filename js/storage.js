/**
 * SD FINANÇAS ENTERPRISE - Data Persistence & Storage Engine
 */

const StorageEngine = {
  KEYS: {
    ACCOUNTS: 'sd_fin_accounts_v1',
    CARDS: 'sd_fin_cards_v1',
    TRANSACTIONS: 'sd_fin_transactions_v1',
    BILLS: 'sd_fin_bills_v1',
    GOALS: 'sd_fin_goals_v1',
    INVESTMENTS: 'sd_fin_investments_v1',
    SETTINGS: 'sd_fin_settings_v1'
  },

  getInitialData() {
    return {
      accounts: [
        { id: 'acc-1', name: 'Nubank Principal', type: 'corrente', bank: 'Nubank', balance: 14850.50, color: '#820ad1' },
        { id: 'acc-2', name: 'Banco Inter PJ', type: 'pj', bank: 'Inter', balance: 22400.00, color: '#ff7a00' },
        { id: 'acc-3', name: 'Itaú Personalité', type: 'corrente', bank: 'Itaú', balance: 8350.25, color: '#ec7000' },
        { id: 'acc-4', name: 'Reserva em Dinheiro', type: 'dinheiro', bank: 'Carteira Física', balance: 1200.00, color: '#10b981' }
      ],
      cards: [
        { id: 'card-1', name: 'Nubank Ultravioleta', bank: 'Nubank', limit: 25000, currentInvoice: 3840.50, closeDay: 28, dueDay: 5, color: '#820ad1' },
        { id: 'card-2', name: 'Inter Black PJ', bank: 'Inter', limit: 30000, currentInvoice: 6120.00, closeDay: 25, dueDay: 2, color: '#ff7a00' }
      ],
      transactions: [
        { id: 'tx-1', desc: 'Recebimento de Projeto Web Pro', amount: 9800.00, type: 'income', category: 'Serviços', accountId: 'acc-2', date: '2026-09-10', status: 'completed' },
        { id: 'tx-2', desc: 'Consultoria Financeira Mensal', amount: 4500.00, type: 'income', category: 'Consultoria', accountId: 'acc-1', date: '2026-09-08', status: 'completed' },
        { id: 'tx-3', desc: 'Assinaturas Softwares & IA', amount: 680.90, type: 'expense', category: 'Tecnologia', accountId: 'acc-1', date: '2026-09-09', status: 'completed' },
        { id: 'tx-4', desc: 'Servidor Cloud & CDN Vercel', amount: 420.00, type: 'expense', category: 'Infraestrutura', accountId: 'acc-2', date: '2026-09-07', status: 'completed' },
        { id: 'tx-5', desc: 'Supermercado & Suprimentos', amount: 1240.60, type: 'expense', category: 'Alimentação', accountId: 'acc-1', date: '2026-09-05', status: 'completed' },
        { id: 'tx-6', desc: 'Combustível & Manutenção Auto', amount: 450.00, type: 'expense', category: 'Transporte', accountId: 'acc-1', date: '2026-09-04', status: 'completed' },
        { id: 'tx-7', desc: 'Dividendos e Proventos FIIs', amount: 1120.40, type: 'income', category: 'Investimentos', accountId: 'acc-3', date: '2026-09-02', status: 'completed' }
      ],
      bills: [
        { id: 'bill-1', title: 'Energia Elétrica Escritório', amount: 380.40, dueDate: '2026-09-18', type: 'payable', status: 'pending', category: 'Utilidades' },
        { id: 'bill-2', title: 'Internet Fibra Dedicada', amount: 199.90, dueDate: '2026-09-20', type: 'payable', status: 'pending', category: 'Utilidades' },
        { id: 'bill-3', title: 'Honorários Contabilidade', amount: 850.00, dueDate: '2026-09-25', type: 'payable', status: 'pending', category: 'Serviços' },
        { id: 'bill-4', title: 'Recebimento Fatura Cliente Alpha', amount: 6200.00, dueDate: '2026-09-22', type: 'receivable', status: 'pending', category: 'Vendas' },
        { id: 'bill-5', title: 'Contrato Mensal de Manutenção', amount: 3400.00, dueDate: '2026-09-30', type: 'receivable', status: 'pending', category: 'Contratos' }
      ],
      goals: [
        { id: 'goal-1', title: 'Reserva de Emergência (6 Meses)', target: 50000, current: 38500, deadline: '2026-12-31', color: '#10b981' },
        { id: 'goal-2', title: 'Troca de Estação de Trabalho & Equipamentos', target: 18000, current: 12400, deadline: '2026-11-30', color: '#d4af37' },
        { id: 'goal-3', title: 'Aporte Carteira Previdência / FIIs', target: 100000, current: 62000, deadline: '2027-06-30', color: '#06b6d4' }
      ],
      investments: [
        { id: 'inv-1', name: 'Tesouro Selic 2029', type: 'Renda Fixa', invested: 25000, current: 28450.20, yieldRate: '10.75% a.a.' },
        { id: 'inv-2', name: 'CDB Liquidez Diária 110% CDI', type: 'CDB', invested: 15000, current: 16920.80, yieldRate: '11.55% a.a.' },
        { id: 'inv-3', name: 'Carteira de Fundos Imobiliários (FIIs)', type: 'FIIs', invested: 35000, current: 39120.00, yieldRate: '0.85% a.m.' }
      ],
      settings: {
        currency: 'BRL',
        theme: 'dark',
        user: { name: 'Samuel David', role: 'Administrador Pro', email: 'samuel@sddigitais.com' }
      }
    };
  },

  init() {
    if (!localStorage.getItem(this.KEYS.ACCOUNTS)) {
      const initial = this.getInitialData();
      this.save(this.KEYS.ACCOUNTS, initial.accounts);
      this.save(this.KEYS.CARDS, initial.cards);
      this.save(this.KEYS.TRANSACTIONS, initial.transactions);
      this.save(this.KEYS.BILLS, initial.bills);
      this.save(this.KEYS.GOALS, initial.goals);
      this.save(this.KEYS.INVESTMENTS, initial.investments);
      this.save(this.KEYS.SETTINGS, initial.settings);
    }
  },

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error(`Erro ao carregar chave ${key}:`, e);
      return null;
    }
  },

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error(`Erro ao salvar chave ${key}:`, e);
      return false;
    }
  },

  exportFullBackup() {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      accounts: this.load(this.KEYS.ACCOUNTS) || [],
      cards: this.load(this.KEYS.CARDS) || [],
      transactions: this.load(this.KEYS.TRANSACTIONS) || [],
      bills: this.load(this.KEYS.BILLS) || [],
      goals: this.load(this.KEYS.GOALS) || [],
      investments: this.load(this.KEYS.INVESTMENTS) || [],
      settings: this.load(this.KEYS.SETTINGS) || {}
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SD_Financas_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (data.accounts) this.save(this.KEYS.ACCOUNTS, data.accounts);
      if (data.cards) this.save(this.KEYS.CARDS, data.cards);
      if (data.transactions) this.save(this.KEYS.TRANSACTIONS, data.transactions);
      if (data.bills) this.save(this.KEYS.BILLS, data.bills);
      if (data.goals) this.save(this.KEYS.GOALS, data.goals);
      if (data.investments) this.save(this.KEYS.INVESTMENTS, data.investments);
      if (data.settings) this.save(this.KEYS.SETTINGS, data.settings);
      return true;
    } catch (e) {
      console.error('Falha ao importar backup:', e);
      return false;
    }
  },

  resetAllData() {
    const initial = this.getInitialData();
    this.save(this.KEYS.ACCOUNTS, initial.accounts);
    this.save(this.KEYS.CARDS, initial.cards);
    this.save(this.KEYS.TRANSACTIONS, initial.transactions);
    this.save(this.KEYS.BILLS, initial.bills);
    this.save(this.KEYS.GOALS, initial.goals);
    this.save(this.KEYS.INVESTMENTS, initial.investments);
    this.save(this.KEYS.SETTINGS, initial.settings);
  }
};
