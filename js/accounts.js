/**
 * SD FINANÇAS ENTERPRISE - Accounts & Wallets Module
 */

const AccountsModule = {
  render() {
    this.renderAccountCards();
    this.populateTransferSelects();
  },

  renderAccountCards() {
    const container = document.getElementById('accounts-cards-grid');
    if (!container) return;

    container.innerHTML = AppState.accounts.map(acc => `
      <div class="card" style="border-left: 4px solid ${acc.color || 'var(--gold-primary)'};">
        <div class="card-header">
          <div>
            <div class="card-title">${acc.name}</div>
            <div class="card-subtitle">${acc.bank} • ${acc.type.toUpperCase()}</div>
          </div>
          <div style="width: 32px; height: 32px; border-radius: 8px; background: ${acc.color}22; display: flex; align-items: center; justify-content: center; color: ${acc.color};">
            <i data-lucide="landmark"></i>
          </div>
        </div>
        <div style="margin: 14px 0;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Saldo Disponível</div>
          <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: ${acc.balance >= 0 ? 'var(--text-primary)' : 'var(--rose)'};">
            ${AppState.formatCurrency(acc.balance)}
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <button class="btn btn-outline btn-sm" style="flex: 1;" onclick="AccountsModule.openTransferModal('${acc.id}')">
            <i data-lucide="arrow-left-right"></i> Transferir
          </button>
          <button class="btn btn-outline btn-sm" onclick="AccountsModule.openEditBalance('${acc.id}')">
            <i data-lucide="edit-3"></i> Ajustar
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  },

  populateTransferSelects() {
    const fromSelect = document.getElementById('transfer-from-account');
    const toSelect = document.getElementById('transfer-to-account');

    if (fromSelect && toSelect) {
      const options = AppState.accounts.map(a =>
        `<option value="${a.id}">${a.name} (${AppState.formatCurrency(a.balance)})</option>`
      ).join('');
      fromSelect.innerHTML = options;
      toSelect.innerHTML = options;
    }
  },

  openTransferModal(sourceAccountId = null) {
    const modal = document.getElementById('modal-transfer');
    if (!modal) return;

    this.populateTransferSelects();
    if (sourceAccountId) {
      const from = document.getElementById('transfer-from-account');
      if (from) from.value = sourceAccountId;
    }

    modal.classList.add('active');
  },

  closeTransferModal() {
    const modal = document.getElementById('modal-transfer');
    if (modal) modal.classList.remove('active');
  },

  executeTransfer(e) {
    e.preventDefault();
    const fromId = document.getElementById('transfer-from-account').value;
    const toId = document.getElementById('transfer-to-account').value;
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const desc = document.getElementById('transfer-desc').value.trim() || 'Transferência entre contas';

    if (fromId === toId) {
      AppState.showToast('Selecione contas de origem e destino diferentes.', 'error');
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      AppState.showToast('Informe um valor de transferência válido.', 'error');
      return;
    }

    const fromAcc = AppState.accounts.find(a => a.id === fromId);
    const toAcc = AppState.accounts.find(a => a.id === toId);

    if (!fromAcc || !toAcc) return;

    fromAcc.balance -= amount;
    toAcc.balance += amount;
    AppState.save('accounts');

    // Create system transactions
    const now = new Date().toISOString().split('T')[0];
    AppState.transactions.unshift({
      id: 'tx-' + Date.now(),
      desc: `${desc} (${fromAcc.name} → ${toAcc.name})`,
      amount,
      type: 'expense',
      category: 'Transferência',
      accountId: fromId,
      date: now,
      status: 'completed'
    });

    AppState.transactions.unshift({
      id: 'tx-' + (Date.now() + 1),
      desc: `${desc} (Recebido de ${fromAcc.name})`,
      amount,
      type: 'income',
      category: 'Transferência',
      accountId: toId,
      date: now,
      status: 'completed'
    });

    AppState.save('transactions');

    this.closeTransferModal();
    this.render();
    DashboardModule.render();
    TransactionsModule.render();
    AppState.showToast(`Transferência de ${AppState.formatCurrency(amount)} realizada!`);
  },

  openEditBalance(accountId) {
    const acc = AppState.accounts.find(a => a.id === accountId);
    if (!acc) return;

    const newBalStr = prompt(`Definir novo saldo para "${acc.name}":`, acc.balance);
    if (newBalStr === null) return;

    const newBal = parseFloat(newBalStr);
    if (isNaN(newBal)) {
      AppState.showToast('Valor inválido.', 'error');
      return;
    }

    acc.balance = newBal;
    AppState.save('accounts');
    this.render();
    DashboardModule.render();
    AppState.showToast(`Saldo de "${acc.name}" atualizado para ${AppState.formatCurrency(newBal)}.`);
  },

  openNewAccountModal() {
    const name = prompt('Nome da Nova Conta (ex: C6 Bank, Santander):');
    if (!name || !name.trim()) return;

    const bank = prompt('Banco / Instituição:', name);
    const balance = parseFloat(prompt('Saldo Inicial (R$):', '0')) || 0;

    const newAcc = {
      id: 'acc-' + Date.now(),
      name: name.trim(),
      bank: bank ? bank.trim() : 'Geral',
      type: 'corrente',
      balance,
      color: '#d4af37'
    };

    AppState.accounts.push(newAcc);
    AppState.save('accounts');
    this.render();
    DashboardModule.render();
    AppState.showToast(`Conta "${name}" cadastrada com sucesso!`);
  }
};
