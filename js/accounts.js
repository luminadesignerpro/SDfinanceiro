/* ===================================================================
   SD FINANÇAS PRO — GESTÃO DE CONTAS & CARTÕES
   =================================================================== */

const AccountsManager = {
  init() {
    this.renderAccounts();
    this.setupEventListeners();
  },

  renderAccounts() {
    const container = document.getElementById('accountsCardsContainer');
    const dashboardCardsContainer = document.getElementById('dashboardCardsContainer');
    const accounts = Storage.getAccounts();

    const cardsHTML = accounts.map(a => this.createDigitalCardHTML(a)).join('');

    if (container) container.innerHTML = cardsHTML;
    if (dashboardCardsContainer) dashboardCardsContainer.innerHTML = cardsHTML;

    // Métricas de Contas
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalLimit = accounts.reduce((sum, a) => sum + a.limit, 0);
    const totalUsedLimit = accounts.reduce((sum, a) => sum + (a.usedLimit || 0), 0);

    const elTotalBalance = document.getElementById('accountsTotalBalance');
    const elTotalLimit = document.getElementById('accountsTotalLimit');
    const elAvailableLimit = document.getElementById('accountsAvailableLimit');

    if (elTotalBalance) elTotalBalance.textContent = Storage.formatCurrency(totalBalance);
    if (elTotalLimit) elTotalLimit.textContent = Storage.formatCurrency(totalLimit);
    if (elAvailableLimit) elAvailableLimit.textContent = Storage.formatCurrency(totalLimit - totalUsedLimit);

    const elTopDisp = document.getElementById('topHeaderDisponivel');
    if (elTopDisp) elTopDisp.textContent = Storage.formatCurrency(totalBalance);

    // Renderiza tags da Linha 3 do Header (CONTAS / BANCOS)
    const headerTagsContainer = document.getElementById('headerAccountsTagsList');
    if (headerTagsContainer) {
      const bankIcons = {
        'Nubank': { icon: 'landmark', color: '#a78bfa' },
        'Inter': { icon: 'building-2', color: '#10b981' },
        'Dinheiro / Carteira': { icon: 'wallet', color: '#38bdf8' }
      };

      const tagsHTML = accounts.map(a => {
        const meta = bankIcons[a.bank] || { icon: 'credit-card', color: '#f59e0b' };
        return `
          <div class="sd-tag-pill" onclick="App.switchTab('accounts')" title="Filtrar por ${a.bank}">
            <i data-lucide="${meta.icon}" style="width: 12px; height: 12px; color: ${meta.color};"></i>
            <span>${a.bank.toUpperCase()}</span>
            <span class="sd-tag-close" onclick="event.stopPropagation(); App.showToast('Filtro por ${a.bank} ativado')">×</span>
          </div>
        `;
      }).join('') + `
        <button class="sd-tag-add-btn" onclick="AccountsManager.openNewAccountModal()" title="Adicionar nova conta ou cartão">
          <span>+ Conta / Cartão</span>
        </button>
      `;
      headerTagsContainer.innerHTML = tagsHTML;
    }

    if (window.lucide) lucide.createIcons();
  },

  createDigitalCardHTML(acc) {
    const available = (acc.limit || 0) - (acc.usedLimit || 0);
    return `
      <div class="digital-card ${acc.color || 'purple'}">
        <div class="card-top">
          <div class="card-chip"></div>
          <div class="card-bank">${acc.bank}</div>
        </div>
        
        <div class="card-number">${acc.cardNumber || '•••• •••• •••• 1234'}</div>
        
        <div class="card-meta">
          <div class="card-holder">
            <h6>Titular da Conta</h6>
            <p>${acc.name}</p>
          </div>
          <div class="card-balance" style="text-align: right;">
            <h6>Saldo em Conta</h6>
            <p>${Storage.formatCurrency(acc.balance)}</p>
          </div>
        </div>

        ${acc.limit > 0 ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.15); display: flex; justify-content: space-between; font-size: 0.72rem; color: rgba(255,255,255,0.85);">
            <span>Fatura: <strong>${Storage.formatCurrency(acc.usedLimit || 0)}</strong></span>
            <span>Limite Disp: <strong>${Storage.formatCurrency(available)}</strong></span>
          </div>
        ` : ''}
      </div>
    `;
  },

  openNewAccountModal() {
    const modal = document.getElementById('accountModal');
    const form = document.getElementById('accountForm');
    if (form) form.reset();
    if (modal) modal.classList.add('active');
  },

  closeAccountModal() {
    const modal = document.getElementById('accountModal');
    if (modal) modal.classList.remove('active');
  },

  saveAccountFromForm(e) {
    e.preventDefault();
    const name = document.getElementById('accName').value.trim();
    const bank = document.getElementById('accBank').value.trim();
    const balance = parseFloat(document.getElementById('accBalance').value) || 0;
    const limit = parseFloat(document.getElementById('accLimit').value) || 0;
    const color = document.getElementById('accColor').value;

    if (!name || !bank) {
      alert('Preencha o nome da conta e o banco.');
      return;
    }

    const lastDigits = Math.floor(1000 + Math.random() * 9000);

    const newAcc = {
      id: 'acc-' + Date.now(),
      name: name,
      bank: bank,
      type: 'checking',
      balance: balance,
      color: color,
      cardNumber: `•••• ${lastDigits}`,
      limit: limit,
      usedLimit: 0,
      dueDate: 'Dia 10'
    };

    const accounts = Storage.getAccounts();
    accounts.push(newAcc);
    Storage.saveAccounts(accounts);

    this.closeAccountModal();
    this.renderAccounts();
    TransactionsManager.renderDashboardMetrics();
    App.showToast('Nova conta adicionada com sucesso!');
  },

  setupEventListeners() {
    const form = document.getElementById('accountForm');
    if (form) {
      form.addEventListener('submit', (e) => this.saveAccountFromForm(e));
    }
  }
};
