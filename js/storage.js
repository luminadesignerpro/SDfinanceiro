/**
 * SDFINANCEIRO — Storage & Initial State Manager
 * (Suporte completo a Usuários, Contas Fixas/Consumo, Sessão e Biometria)
 */

const Storage = {
  KEYS: {
    ACCOUNTS: 'sdfinanceiro_accounts_v1',
    TRANSACTIONS: 'sdfinanceiro_transactions_v1',
    CHECKS: 'sdfinanceiro_checks_v1',
    AGENDA: 'sdfinanceiro_agenda_v1',
    BILLS: 'sdfinanceiro_bills_v1',
    USERS: 'sdfinanceiro_users_v1',
    ACTIVE_USER: 'sdfinanceiro_active_user_v1',
    AUTH_SESSION: 'sdfinanceiro_auth_session_v1',
    SETTINGS: 'sdfinanceiro_settings_v1'
  },

  // Initial rich mock data for instant wow effect
  getInitialData() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');

    return {
      users: [
        {
          id: 'usr_1',
          name: 'Sérgio Dantas',
          username: 'admin',
          password: '123',
          role: 'Administrador',
          email: 'sergio.dantas@sdfinanceiro.com',
          color: '#f59e0b',
          avatar: 'SD',
          isCurrent: true,
          biometricsEnabled: true
        },
        {
          id: 'usr_2',
          name: 'Amanda Silva',
          username: 'amanda',
          password: '123',
          role: 'Financeiro / Contábil',
          email: 'amanda.silva@sdfinanceiro.com',
          color: '#8b5cf6',
          avatar: 'AS',
          isCurrent: false,
          biometricsEnabled: true
        }
      ],

      accounts: [
        {
          id: 'acc_credit_1',
          name: 'Nubank Ultravioleta',
          type: 'credit',
          limit: 15000.00,
          usedLimit: 3420.50,
          closingDay: 25,
          dueDay: 5,
          last4: '8841',
          color: '#8b5cf6',
          institution: 'Nubank'
        },
        {
          id: 'acc_credit_2',
          name: 'Itaú Personalité Black',
          type: 'credit',
          limit: 25000.00,
          usedLimit: 4890.00,
          closingDay: 18,
          dueDay: 28,
          last4: '5120',
          color: '#f59e0b',
          institution: 'Itaú Unibanco'
        },
        {
          id: 'acc_debit_1',
          name: 'Conta Corrente Itaú',
          type: 'debit',
          balance: 18450.75,
          last4: '9012',
          color: '#3b82f6',
          institution: 'Itaú Unibanco'
        },
        {
          id: 'acc_debit_2',
          name: 'Bradesco Prime',
          type: 'debit',
          balance: 9320.00,
          last4: '3341',
          color: '#ec4899',
          institution: 'Bradesco'
        },
        {
          id: 'acc_cash_1',
          name: 'Dinheiro em Espécie (Caixa)',
          type: 'cash',
          balance: 2450.00,
          color: '#10b981',
          institution: 'Carteira Física'
        }
      ],

      bills: [
        {
          id: 'bill_1',
          title: 'Conta de Energia Elétrica (Enel)',
          type: 'energy',
          provider: 'Enel Distribuição',
          amount: 384.50,
          dueDate: `${currentYear}-${currentMonth}-10`,
          refMonth: `${currentMonth}/${currentYear}`,
          barcode: '83620000003 8 84500138001 4 23456789012 3 45678901234 5',
          pixKey: 'financeiro@enel.com.br',
          status: 'pending',
          accountId: 'acc_debit_1',
          notes: 'Consumo do galpão e escritório comercial'
        },
        {
          id: 'bill_2',
          title: 'Conta de Água e Saneamento',
          type: 'water',
          provider: 'Cagece Águas',
          amount: 142.30,
          dueDate: `${currentYear}-${currentMonth}-15`,
          refMonth: `${currentMonth}/${currentYear}`,
          barcode: '82640000001 4 42300045001 2 98765432101 1 23456789012 3',
          pixKey: 'pix@cagece.com.br',
          status: 'pending',
          accountId: 'acc_debit_1',
          notes: 'Hidrômetro principal'
        },
        {
          id: 'bill_3',
          title: 'Internet Fibra Óptica 600MB',
          type: 'internet',
          provider: 'Claro / Vivo Fibra',
          amount: 149.90,
          dueDate: `${currentYear}-${currentMonth}-08`,
          refMonth: `${currentMonth}/${currentYear}`,
          barcode: '84610000001 9 49900012001 5 11223344556 7 88990011223 4',
          pixKey: 'cobranca@fibra.com.br',
          status: 'pending',
          accountId: 'acc_debit_1',
          notes: 'Link dedicado com Wi-Fi para escritório'
        },
        {
          id: 'bill_4',
          title: 'Aluguel do Galpão / Imóvel',
          type: 'rent',
          provider: 'Imobiliária Dantas & Filhos',
          amount: 2200.00,
          dueDate: `${currentYear}-${currentMonth}-05`,
          refMonth: `${currentMonth}/${currentYear}`,
          barcode: '34191790010104351004791020150008890000220000',
          pixKey: 'imoveis@dantas.com.br',
          status: 'paid',
          paidAt: `${currentYear}-${currentMonth}-02`,
          accountId: 'acc_debit_1',
          notes: 'Contrato comercial 2025/2027'
        },
        {
          id: 'bill_5',
          title: 'Telefone Celular Corporativo',
          type: 'phone',
          provider: 'TIM Empresas',
          amount: 89.90,
          dueDate: `${currentYear}-${currentMonth}-20`,
          refMonth: `${currentMonth}/${currentYear}`,
          barcode: '84630000000 8 99000045001 3 11223344556 7 44556677889 0',
          pixKey: 'tim@pix.com.br',
          status: 'pending',
          accountId: 'acc_debit_1',
          notes: '2 linhas móveis da equipe'
        }
      ],

      checks: [
        {
          id: 'chk_1',
          number: '000451',
          type: 'issued', // Emitido (A pagar)
          beneficiary: 'Distribuidora Movelar Sul',
          bank: 'Itaú Ag: 1240 / CC: 55410-2',
          accountId: 'acc_debit_1',
          amount: 3500.00,
          issueDate: `${currentYear}-${currentMonth}-05`,
          clearingDate: `${currentYear}-${currentMonth}-28`,
          status: 'pending',
          category: 'Fornecedores',
          notes: 'Pagamento referente à compra de chapas MDF'
        },
        {
          id: 'chk_2',
          number: '000452',
          type: 'issued',
          beneficiary: 'Transportadora Rápido Sol',
          bank: 'Itaú Ag: 1240 / CC: 55410-2',
          accountId: 'acc_debit_1',
          amount: 1250.00,
          issueDate: `${currentYear}-${currentMonth}-10`,
          clearingDate: `${currentYear}-${currentMonth}-30`,
          status: 'pending',
          category: 'Serviços',
          notes: 'Frete de mercadorias'
        },
        {
          id: 'chk_3',
          number: '001890',
          type: 'received', // Recebido (A depositar)
          beneficiary: 'Cliente: Construtora Horizonte',
          bank: 'Banco do Brasil Ag: 3344 / CC: 10294-1',
          accountId: 'acc_debit_1',
          amount: 8500.00,
          issueDate: `${currentYear}-${currentMonth}-01`,
          clearingDate: `${currentYear}-${currentMonth}-15`,
          status: 'pending',
          category: 'Vendas',
          notes: 'Entrada do projeto residencial 402'
        },
        {
          id: 'chk_4',
          number: '000450',
          type: 'issued',
          beneficiary: 'Serralheria & Perfis Aço Forte',
          bank: 'Itaú Ag: 1240 / CC: 55410-2',
          accountId: 'acc_debit_1',
          amount: 2100.00,
          issueDate: `${currentYear}-${currentMonth}-02`,
          clearingDate: `${currentYear}-${currentMonth}-06`,
          status: 'cleared',
          category: 'Fornecedores',
          notes: 'Compensado com sucesso'
        }
      ],

      agenda: [
        {
          id: 'apt_1',
          title: 'Vencimento Conta de Energia (Enel)',
          date: `${currentYear}-${currentMonth}-10`,
          time: '10:00',
          priority: 'high',
          category: 'payment',
          value: 384.50,
          status: 'pending',
          obs: 'Pagar via Pix ou débito em conta Itaú'
        },
        {
          id: 'apt_2',
          title: 'Reunião com Diretor Comercial (Vidros)',
          date: `${currentYear}-${currentMonth}-05`,
          time: '14:30',
          priority: 'medium',
          category: 'meeting',
          value: 0,
          status: 'pending',
          obs: 'Alinhamento da entrega de vidros temperados e ferragens'
        },
        {
          id: 'apt_3',
          title: 'Compensação do Cheque 001890 (Horizonte)',
          date: `${currentYear}-${currentMonth}-15`,
          time: '11:00',
          priority: 'high',
          category: 'check',
          value: 8500.00,
          status: 'pending',
          obs: 'Verificar entrada de saldo no Itaú'
        },
        {
          id: 'apt_4',
          title: 'Vencimento Fatura Cartão Nubank',
          date: `${currentYear}-${currentMonth}-05`,
          time: '09:00',
          priority: 'urgent',
          category: 'financial',
          value: 3420.50,
          status: 'pending',
          obs: 'Débito automático ou pagamento integral'
        }
      ],

      transactions: [
        {
          id: 'tx_1',
          type: 'income',
          amount: 15000.00,
          date: `${currentYear}-${currentMonth}-01`,
          desc: 'Recebimento de Projeto Arquitetônico',
          category: 'Vendas',
          accountId: 'acc_debit_1',
          installments: 1,
          status: 'completed',
          notes: 'Transferência TED confirmada'
        },
        {
          id: 'tx_2',
          type: 'income',
          amount: 4610.25,
          date: `${currentYear}-${currentMonth}-03`,
          desc: 'Venda de Balcão e Ferragens',
          category: 'Vendas',
          accountId: 'acc_cash_1',
          installments: 1,
          status: 'completed',
          notes: 'Pagamentos em dinheiro e Pix'
        },
        {
          id: 'tx_3',
          type: 'expense',
          amount: 2200.00,
          date: `${currentYear}-${currentMonth}-02`,
          desc: 'Aluguel do Galpão Comercial',
          category: 'Moradia',
          accountId: 'acc_debit_1',
          installments: 1,
          status: 'completed',
          notes: 'Pago via Pix'
        },
        {
          id: 'tx_4',
          type: 'expense',
          amount: 450.80,
          date: `${currentYear}-${currentMonth}-04`,
          desc: 'Abastecimento Frota e Manutenção',
          category: 'Transporte',
          accountId: 'acc_credit_1',
          installments: 1,
          status: 'completed',
          notes: 'Posto Petrobras'
        },
        {
          id: 'tx_5',
          type: 'expense',
          amount: 309.50,
          date: `${currentYear}-${currentMonth}-04`,
          desc: 'Almoço de Negócios & Restaurante',
          category: 'Alimentação',
          accountId: 'acc_credit_1',
          installments: 1,
          status: 'completed',
          notes: 'Restaurante Varanda do Lago'
        }
      ]
    };
  },

  // USERS
  getUsers() {
    const data = localStorage.getItem(this.KEYS.USERS);
    if (!data) {
      const initial = this.getInitialData().users;
      this.saveUsers(initial);
      return initial;
    }
    return JSON.parse(data);
  },

  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  getActiveUser() {
    const users = this.getUsers();
    const active = users.find(u => u.isCurrent) || users[0];
    return active;
  },

  setActiveUser(userId) {
    const users = this.getUsers();
    users.forEach(u => {
      u.isCurrent = (u.id === userId);
    });
    this.saveUsers(users);
    return this.getActiveUser();
  },

  // AUTH SESSION
  isLoggedIn() {
    const session = localStorage.getItem(this.KEYS.AUTH_SESSION);
    return session === 'authenticated';
  },

  setLoggedIn(bool) {
    if (bool) {
      localStorage.setItem(this.KEYS.AUTH_SESSION, 'authenticated');
    } else {
      localStorage.removeItem(this.KEYS.AUTH_SESSION);
    }
  },

  // ACCOUNTS
  getAccounts() {
    const data = localStorage.getItem(this.KEYS.ACCOUNTS);
    if (!data) {
      const initial = this.getInitialData().accounts;
      this.saveAccounts(initial);
      return initial;
    }
    return JSON.parse(data);
  },

  saveAccounts(accounts) {
    localStorage.setItem(this.KEYS.ACCOUNTS, JSON.stringify(accounts));
  },

  // BILLS (Água, Luz, Internet, etc.)
  getBills() {
    const data = localStorage.getItem(this.KEYS.BILLS);
    if (!data) {
      const initial = this.getInitialData().bills;
      this.saveBills(initial);
      return initial;
    }
    return JSON.parse(data);
  },

  saveBills(bills) {
    localStorage.setItem(this.KEYS.BILLS, JSON.stringify(bills));
  },

  // TRANSACTIONS
  getTransactions() {
    const data = localStorage.getItem(this.KEYS.TRANSACTIONS);
    if (!data) {
      const initial = this.getInitialData().transactions;
      this.saveTransactions(initial);
      return initial;
    }
    return JSON.parse(data);
  },

  saveTransactions(transactions) {
    localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  // CHECKS
  getChecks() {
    const data = localStorage.getItem(this.KEYS.CHECKS);
    if (!data) {
      const initial = this.getInitialData().checks;
      this.saveChecks(initial);
      return initial;
    }
    return JSON.parse(data);
  },

  saveChecks(checks) {
    localStorage.setItem(this.KEYS.CHECKS, JSON.stringify(checks));
  },

  // AGENDA
  getAgenda() {
    const data = localStorage.getItem(this.KEYS.AGENDA);
    if (!data) {
      const initial = this.getInitialData().agenda;
      this.saveAgenda(initial);
      return initial;
    }
    return JSON.parse(data);
  },

  saveAgenda(agenda) {
    localStorage.setItem(this.KEYS.AGENDA, JSON.stringify(agenda));
  },

  // Reset to initial demo data
  resetDemoData() {
    const init = this.getInitialData();
    this.saveUsers(init.users);
    this.saveAccounts(init.accounts);
    this.saveBills(init.bills);
    this.saveTransactions(init.transactions);
    this.saveChecks(init.checks);
    this.saveAgenda(init.agenda);
  },

  // Clear everything
  clearAll() {
    localStorage.removeItem(this.KEYS.USERS);
    localStorage.removeItem(this.KEYS.ACCOUNTS);
    localStorage.removeItem(this.KEYS.BILLS);
    localStorage.removeItem(this.KEYS.TRANSACTIONS);
    localStorage.removeItem(this.KEYS.CHECKS);
    localStorage.removeItem(this.KEYS.AGENDA);
    localStorage.removeItem(this.KEYS.AUTH_SESSION);
  },

  // Export full JSON backup
  exportJSON() {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      users: this.getUsers(),
      accounts: this.getAccounts(),
      bills: this.getBills(),
      transactions: this.getTransactions(),
      checks: this.getChecks(),
      agenda: this.getAgenda()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sdfinanceiro_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Import JSON backup
  importJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.users) this.saveUsers(data.users);
      if (data.accounts) this.saveAccounts(data.accounts);
      if (data.bills) this.saveBills(data.bills);
      if (data.transactions) this.saveTransactions(data.transactions);
      if (data.checks) this.saveChecks(data.checks);
      if (data.agenda) this.saveAgenda(data.agenda);
      return true;
    } catch (e) {
      console.error('Falha ao importar backup JSON:', e);
      return false;
    }
  }
};
