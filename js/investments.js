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
        </div>
      `;
    }).join('');
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
  }
};
