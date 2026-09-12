/**
 * SD FINANÇAS ENTERPRISE - Credit Cards Management Module
 */

const CardsModule = {
  render() {
    const container = document.getElementById('cards-grid-container');
    if (!container) return;

    if (AppState.cards.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); padding:30px; text-align:center;">Nenhum cartão cadastrado.</div>';
      return;
    }

    container.innerHTML = AppState.cards.map(c => {
      const used = parseFloat(c.currentInvoice) || 0;
      const limit = parseFloat(c.limit) || 1;
      const available = Math.max(0, limit - used);
      const pct = Math.min(100, Math.round((used / limit) * 100));

      return `
        <div class="card" style="background: linear-gradient(145deg, #131d2e 0%, #0d131f 100%); border-top: 3px solid ${c.color || 'var(--gold-primary)'};">
          <div class="card-header">
            <div>
              <div class="card-title">${c.name}</div>
              <div class="card-subtitle">${c.bank} • Fechamento: dia ${c.closeDay} | Vencimento: dia ${c.dueDay}</div>
            </div>
            <i data-lucide="credit-card" style="color: ${c.color || 'var(--gold-primary)'}; width:28px; height:28px;"></i>
          </div>

          <div style="margin: 18px 0;">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
              <span style="color:var(--text-muted);">Fatura Atual</span>
              <span style="font-weight:700; color:var(--rose); font-family:var(--font-heading);">${AppState.formatCurrency(used)}</span>
            </div>

            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width: ${pct}%; background: ${pct > 80 ? 'var(--rose)' : 'var(--gold-gradient)'};"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:6px;">
              <span>Uso do limite: <b>${pct}%</b></span>
              <span>Disponível: <b style="color:var(--emerald);">${AppState.formatCurrency(available)}</b></span>
            </div>
          </div>

          <div style="background:rgba(255,255,255,0.02); border-radius:var(--radius-md); padding:10px 14px; display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="font-size:0.78rem; color:var(--text-secondary);">Limite Total:</span>
            <span style="font-weight:800; font-family:var(--font-heading);">${AppState.formatCurrency(limit)}</span>
          </div>

          <div style="display:flex; gap:8px;">
            <button class="btn btn-outline btn-sm" style="flex:1;" onclick="CardsModule.payInvoice('${c.id}')">
              <i data-lucide="check-circle"></i> Pagar Fatura
            </button>
            <button class="btn btn-outline btn-sm" onclick="CardsModule.editLimit('${c.id}')">
              <i data-lucide="sliders"></i> Limite
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  payInvoice(cardId) {
    const card = AppState.cards.find(c => c.id === cardId);
    if (!card) return;

    if (card.currentInvoice <= 0) {
      AppState.showToast('Esta fatura já está zerada!', 'error');
      return;
    }

    if (!confirm(`Confirmar o pagamento da fatura de ${AppState.formatCurrency(card.currentInvoice)} do cartão "${card.name}"?`)) return;

    // Pick first available account or ask
    const acc = AppState.accounts[0];
    if (acc) {
      acc.balance -= card.currentInvoice;
      AppState.save('accounts');

      AppState.transactions.unshift({
        id: 'tx-' + Date.now(),
        desc: `Pagamento Fatura ${card.name}`,
        amount: card.currentInvoice,
        type: 'expense',
        category: 'Cartão de Crédito',
        accountId: acc.id,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      });
      AppState.save('transactions');
    }

    const paidVal = card.currentInvoice;
    card.currentInvoice = 0;
    AppState.save('cards');

    this.render();
    DashboardModule.render();
    AccountsModule.render();
    TransactionsModule.render();
    AppState.showToast(`Fatura de ${AppState.formatCurrency(paidVal)} paga com sucesso!`);
  },

  editLimit(cardId) {
    const card = AppState.cards.find(c => c.id === cardId);
    if (!card) return;

    const newLimitStr = prompt(`Definir novo limite para ${card.name}:`, card.limit);
    if (newLimitStr === null) return;

    const newLimit = parseFloat(newLimitStr);
    if (isNaN(newLimit) || newLimit <= 0) {
      AppState.showToast('Limite inválido.', 'error');
      return;
    }

    card.limit = newLimit;
    AppState.save('cards');
    this.render();
    AppState.showToast(`Limite do cartão "${card.name}" ajustado com sucesso!`);
  },

  openNewCardModal() {
    const name = prompt('Nome do Cartão (ex: C6 Carbon, XP Visa):');
    if (!name || !name.trim()) return;

    const bank = prompt('Banco Emissor:', name);
    const limit = parseFloat(prompt('Limite Total (R$):', '10000')) || 10000;
    const closeDay = parseInt(prompt('Dia de Fechamento da Fatura:', '25')) || 25;
    const dueDay = parseInt(prompt('Dia de Vencimento da Fatura:', '5')) || 5;

    AppState.cards.push({
      id: 'card-' + Date.now(),
      name: name.trim(),
      bank: bank ? bank.trim() : 'Geral',
      limit,
      currentInvoice: 0,
      closeDay,
      dueDay,
      color: '#d4af37'
    });

    AppState.save('cards');
    this.render();
    AppState.showToast(`Cartão "${name}" adicionado com sucesso!`);
  }
};
