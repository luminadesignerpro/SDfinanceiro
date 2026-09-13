/**
 * SD FINANÇAS ENTERPRISE - Investment Simulator & Portfolio
 */

const InvestmentsModule = {
  render() {
    this.renderPortfolio();
    this.runSimulation();
  },

  renderPortfolio() {
    const container = document.getElementById('investments-list-container');
    if (!container) return;

    container.innerHTML = AppState.investments.map(inv => {
      const profit = inv.current - inv.invested;
      const pct = ((profit / inv.invested) * 100).toFixed(2);

      return `
        <div class="card" style="margin-bottom:14px; border-left:4px solid var(--gold-primary);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap: 10px;">
            <div>
              <div style="font-weight:700; font-size:1.05rem; color:#fff;">${inv.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">${inv.type} • Rentabilidade Estimada: ${inv.yieldRate}</div>
            </div>
            <span class="badge badge-income" style="flex-shrink:0; white-space:nowrap;">+${pct}%</span>
          </div>
          <div class="investment-card-metrics">
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Valor Investido</div>
              <div style="font-weight:700; font-family:var(--font-heading); color:#94a3b8;">${AppState.formatCurrency(inv.invested)}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Saldo Atual</div>
              <div style="font-weight:800; font-family:var(--font-heading); color:#fff; font-size:1.15rem;">${AppState.formatCurrency(inv.current)}</div>
            </div>
            <div>
              <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Rendimento Total</div>
              <div style="font-weight:700; font-family:var(--font-heading); color:var(--emerald);">+ ${AppState.formatCurrency(profit)}</div>
            </div>
          </div>
          <div style="display:flex; gap:8px; border-top:1px solid var(--border-color); padding-top:12px; margin-top:12px; align-items:center;">
            <button class="btn btn-outline btn-sm" style="flex:1; border-color:rgba(212,175,55,0.4); color:var(--gold-primary);" onclick="InvestmentsModule.edit('${inv.id}')">
              <i data-lucide="edit-3"></i> Editar
            </button>
            <button class="btn-icon" onclick="InvestmentsModule.delete('${inv.id}')" title="Excluir Ativo" style="flex-shrink:0;">
              <i data-lucide="trash-2" style="width:15px; height:15px; color:var(--rose);"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  runSimulation() {
    const initialInput = document.getElementById('sim-initial');
    const monthlyInput = document.getElementById('sim-monthly');
    const rateInput = document.getElementById('sim-rate');
    const periodInput = document.getElementById('sim-period');

    const initial = parseFloat(initialInput ? initialInput.value : 5000) || 5000;
    const monthly = parseFloat(monthlyInput ? monthlyInput.value : 500) || 500;
    const rateAnnual = parseFloat(rateInput ? rateInput.value : 10.75) || 10.75;
    const periodMonths = parseInt(periodInput ? periodInput.value : 36) || 36;

    const rateMonthly = Math.pow(1 + (rateAnnual / 100), 1 / 12) - 1;

    let total = initial;
    let totalInvested = initial;

    for (let i = 1; i <= periodMonths; i++) {
      total = total * (1 + rateMonthly) + monthly;
      totalInvested += monthly;
    }

    const totalInterest = total - totalInvested;

    const resTotal = document.getElementById('sim-result-total');
    const resInvested = document.getElementById('sim-result-invested');
    const resInterest = document.getElementById('sim-result-interest');

    if (resTotal) resTotal.textContent = AppState.formatCurrency(total);
    if (resInvested) resInvested.textContent = AppState.formatCurrency(totalInvested);
    if (resInterest) resInterest.textContent = AppState.formatCurrency(totalInterest);
  },

  edit(id) {
    const inv = AppState.investments.find(i => i.id === id);
    if (!inv) return;

    const name = prompt('Nome do Ativo / Investimento:', inv.name);
    if (name === null) return;
    if (!name.trim()) {
      AppState.showToast('O nome do ativo não pode ser vazio.', 'error');
      return;
    }

    const type = prompt('Tipo (ex: Renda Fixa, CDB, FIIs, Ações):', inv.type);
    if (type === null) return;

    const investedStr = prompt('Valor Investido (R$):', inv.invested);
    if (investedStr === null) return;
    const invested = parseFloat(investedStr);
    if (isNaN(invested) || invested < 0) {
      AppState.showToast('Valor investido inválido.', 'error');
      return;
    }

    const currentStr = prompt('Saldo Atual (R$):', inv.current);
    if (currentStr === null) return;
    const current = parseFloat(currentStr);
    if (isNaN(current) || current < 0) {
      AppState.showToast('Saldo atual inválido.', 'error');
      return;
    }

    const yieldRate = prompt('Rentabilidade Estimada (ex: 11.55% a.a.):', inv.yieldRate || '10% a.a.');
    if (yieldRate === null) return;

    inv.name = name.trim();
    inv.type = type.trim() || inv.type;
    inv.invested = invested;
    inv.current = current;
    inv.yieldRate = yieldRate.trim() || inv.yieldRate;

    AppState.save('investments');
    this.render();
    DashboardModule.render();
    AppState.showToast(`Investimento "${inv.name}" atualizado com sucesso!`);
  },

  openNewModal() {
    const name = prompt('Nome do Novo Ativo / Investimento (ex: CDB Banco Inter, FII HGLG11):');
    if (!name || !name.trim()) return;

    const type = prompt('Tipo (ex: Renda Fixa, CDB, FIIs, Cripto):', 'Renda Fixa');
    if (type === null) return;

    const investedStr = prompt('Valor Investido Inicial (R$):', '5000');
    if (investedStr === null) return;
    const invested = parseFloat(investedStr);
    if (isNaN(invested) || invested <= 0) return;

    const currentStr = prompt('Saldo Atual (R$):', investedStr);
    if (currentStr === null) return;
    const current = parseFloat(currentStr);
    if (isNaN(current) || current < 0) return;

    const yieldRate = prompt('Rentabilidade Estimada (ex: 12% a.a.):', '10.5% a.a.');
    if (yieldRate === null) return;

    AppState.investments.push({
      id: 'inv-' + Date.now(),
      name: name.trim(),
      type: type.trim() || 'Renda Fixa',
      invested,
      current,
      yieldRate: yieldRate.trim() || '10% a.a.'
    });

    AppState.save('investments');
    this.render();
    DashboardModule.render();
    AppState.showToast(`Ativo "${name}" adicionado à carteira!`);
  },

  delete(id) {
    if (!confirm('Deseja realmente remover este ativo da carteira?')) return;
    const idx = AppState.investments.findIndex(i => i.id === id);
    if (idx !== -1) {
      AppState.investments.splice(idx, 1);
      AppState.save('investments');
      this.render();
      DashboardModule.render();
      AppState.showToast('Ativo removido da carteira.');
    }
  }
};
