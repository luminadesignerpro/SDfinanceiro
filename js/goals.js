/**
 * SD FINANÇAS ENTERPRISE - Financial Goals & Piggybanks (Metas & Sonhos)
 */

const GoalsModule = {
  render() {
    const container = document.getElementById('goals-grid-container');
    if (!container) return;

    if (AppState.goals.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); padding:30px; text-align:center;">Nenhuma meta cadastrada ainda. Crie sua primeira meta!</div>';
      return;
    }

    container.innerHTML = AppState.goals.map(g => {
      const current = parseFloat(g.current) || 0;
      const target = parseFloat(g.target) || 1;
      const pct = Math.min(100, Math.round((current / target) * 100));
      const remaining = Math.max(0, target - current);

      return `
        <div class="card" style="border-top: 3px solid ${g.color || 'var(--gold-primary)'};">
          <div class="card-header">
            <div>
              <div class="card-title">${g.title}</div>
              <div class="card-subtitle">Prazo: ${AppState.formatDate(g.deadline)}</div>
            </div>
            <div style="font-size:1.1rem; font-weight:800; color:${g.color || 'var(--gold-primary)'}; font-family:var(--font-heading);">
              ${pct}%
            </div>
          </div>

          <div style="margin: 16px 0;">
            <div class="progress-bar-container" style="height: 10px;">
              <div class="progress-bar-fill" style="width: ${pct}%; background: ${g.color || 'var(--gold-gradient)'};"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-top:8px;">
              <span style="color:var(--text-secondary);">Acumulado: <b style="color:#fff;">${AppState.formatCurrency(current)}</b></span>
              <span style="color:var(--text-muted);">Alvo: <b>${AppState.formatCurrency(target)}</b></span>
            </div>

            <div style="margin-top:6px; font-size:0.75rem; color:var(--text-muted);">
              Faltam <b>${AppState.formatCurrency(remaining)}</b> para atingir o objetivo.
            </div>
          </div>

          <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px;">
            <button class="btn btn-outline btn-sm" style="flex:1;" onclick="GoalsModule.addDeposit('${g.id}')">
              <i data-lucide="plus-circle"></i> Fazer Aporte
            </button>
            <button class="btn-icon" onclick="GoalsModule.delete('${g.id}')" title="Excluir Meta">
              <i data-lucide="trash-2" style="width:14px; height:14px; color:var(--rose);"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  addDeposit(goalId) {
    const goal = AppState.goals.find(g => g.id === goalId);
    if (!goal) return;

    const amountStr = prompt(`Valor do aporte para a meta "${goal.title}" (R$):`, '500');
    if (amountStr === null) return;

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      AppState.showToast('Valor de aporte inválido.', 'error');
      return;
    }

    goal.current += amount;
    AppState.save('goals');

    // Register transaction
    const acc = AppState.accounts[0];
    if (acc) {
      acc.balance -= amount;
      AppState.save('accounts');

      AppState.transactions.unshift({
        id: 'tx-' + Date.now(),
        desc: `Aporte Meta: ${goal.title}`,
        amount,
        type: 'expense',
        category: 'Metas / Poupança',
        accountId: acc.id,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      });
      AppState.save('transactions');
    }

    this.render();
    DashboardModule.render();
    AccountsModule.render();
    TransactionsModule.render();
    AppState.showToast(`Aporte de ${AppState.formatCurrency(amount)} adicionado à meta!`);
  },

  openNewGoalModal() {
    const title = prompt('Nome da Nova Meta (ex: Viagem, Carro Novo, Casa Própria):');
    if (!title || !title.trim()) return;

    const target = parseFloat(prompt('Valor Alvo da Meta (R$):', '10000'));
    if (isNaN(target) || target <= 0) return;

    const current = parseFloat(prompt('Saldo Inicial Já Guardado (R$):', '0')) || 0;
    const deadline = prompt('Data Limite Estimada (AAAA-MM-DD):', '2026-12-31');

    AppState.goals.push({
      id: 'goal-' + Date.now(),
      title: title.trim(),
      target,
      current,
      deadline: deadline || '2026-12-31',
      color: '#d4af37'
    });

    AppState.save('goals');
    this.render();
    AppState.showToast(`Meta "${title}" criada com sucesso!`);
  },

  delete(id) {
    if (!confirm('Deseja realmente remover esta meta?')) return;
    const idx = AppState.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      AppState.goals.splice(idx, 1);
      AppState.save('goals');
      this.render();
      AppState.showToast('Meta removida.');
    }
  }
};
