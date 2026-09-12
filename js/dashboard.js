/**
 * SD FINANÇAS ENTERPRISE - Executive Dashboard & Analytics
 */

const DashboardModule = {
  cashFlowChart: null,
  categoryChart: null,

  render() {
    this.renderKPIs();
    this.renderCharts();
    this.renderRecentTransactions();
    this.renderPendingAlerts();
  },

  renderKPIs() {
    const totalBalance = AppState.getTotalBalance();
    const totalInvestments = AppState.getTotalInvestments();
    const monthlyIncome = AppState.getMonthlyIncome();
    const monthlyExpenses = AppState.getMonthlyExpenses();
    const netBalance = monthlyIncome - monthlyExpenses;

    // Header Total
    const headerEl = document.getElementById('header-total-disponivel');
    if (headerEl) headerEl.textContent = AppState.formatCurrency(totalBalance);

    // KPI Cards
    const kpiBalance = document.getElementById('kpi-saldo-total');
    if (kpiBalance) kpiBalance.textContent = AppState.formatCurrency(totalBalance);

    const kpiIncome = document.getElementById('kpi-receitas-mes');
    if (kpiIncome) kpiIncome.textContent = AppState.formatCurrency(monthlyIncome);

    const kpiExpense = document.getElementById('kpi-despesas-mes');
    if (kpiExpense) kpiExpense.textContent = AppState.formatCurrency(monthlyExpenses);

    const kpiNet = document.getElementById('kpi-balanco-liquido');
    if (kpiNet) {
      kpiNet.textContent = AppState.formatCurrency(netBalance);
      kpiNet.style.color = netBalance >= 0 ? 'var(--emerald-light)' : 'var(--rose-light)';
    }

    const kpiInvest = document.getElementById('kpi-patrimonio-invest');
    if (kpiInvest) kpiInvest.textContent = AppState.formatCurrency(totalInvestments);
  },

  renderCharts() {
    // 1. Cash Flow Bar/Line Chart
    const flowCtx = document.getElementById('chart-fluxo-caixa');
    if (flowCtx && window.Chart) {
      if (this.cashFlowChart) this.cashFlowChart.destroy();

      const months = ['Mai', 'Jun', 'Jul', 'Ago', 'Set'];
      const incomes = [12500, 14200, 13800, 16500, AppState.getMonthlyIncome()];
      const expenses = [8900, 9400, 10200, 8900, AppState.getMonthlyExpenses()];

      this.cashFlowChart = new Chart(flowCtx, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [
            {
              label: 'Receitas (R$)',
              data: incomes,
              backgroundColor: 'rgba(16, 185, 129, 0.75)',
              borderRadius: 6
            },
            {
              label: 'Despesas (R$)',
              data: expenses,
              backgroundColor: 'rgba(244, 63, 94, 0.75)',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { family: 'Outfit' } }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                callback: v => 'R$ ' + (v / 1000) + 'k'
              }
            }
          }
        }
      });
    }

    // 2. Category Doughnut Chart
    const catCtx = document.getElementById('chart-categorias-despesas');
    if (catCtx && window.Chart) {
      if (this.categoryChart) this.categoryChart.destroy();

      const expenses = AppState.transactions.filter(t => t.type === 'expense');
      const catMap = {};
      expenses.forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + parseFloat(t.amount);
      });

      const labels = Object.keys(catMap);
      const data = Object.values(catMap);

      this.categoryChart = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['Sem despesas'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: [
              '#d4af37', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899'
            ],
            borderWidth: 2,
            borderColor: '#111827'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } }
            }
          }
        }
      });
    }
  },

  renderRecentTransactions() {
    const tbody = document.getElementById('dashboard-recent-txs');
    if (!tbody) return;

    const recent = [...AppState.transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recent.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">Nenhum lançamento registrado.</td></tr>';
      return;
    }

    tbody.innerHTML = recent.map(tx => {
      const isIncome = tx.type === 'income';
      const acc = AppState.accounts.find(a => a.id === tx.accountId);
      return `
        <tr>
          <td>
            <div style="font-weight:600; color: #fff;">${tx.desc}</div>
            <div style="font-size:0.75rem; color:#64748b;">${AppState.formatDate(tx.date)}</div>
          </td>
          <td><span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">${tx.category}</span></td>
          <td style="color:#94a3b8;">${acc ? acc.name : 'Conta Padrão'}</td>
          <td style="font-weight:700; font-family:var(--font-heading); color:${isIncome ? 'var(--emerald)' : 'var(--rose)'};">
            ${isIncome ? '+' : '-'} ${AppState.formatCurrency(tx.amount)}
          </td>
          <td><span class="badge badge-gold">Concluído</span></td>
        </tr>
      `;
    }).join('');
  },

  renderPendingAlerts() {
    const container = document.getElementById('dashboard-pending-alerts');
    if (!container) return;

    const pendingBills = AppState.bills.filter(b => b.status === 'pending').slice(0, 3);
    if (pendingBills.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding: 10px 0;">Nenhuma conta pendente para hoje!</div>';
      return;
    }

    container.innerHTML = pendingBills.map(b => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md); margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <i data-lucide="${b.type === 'payable' ? 'arrow-up-right' : 'arrow-down-left'}" style="color:${b.type === 'payable' ? 'var(--rose)' : 'var(--emerald)'}; width:18px; height:18px;"></i>
          <div>
            <div style="font-weight:600; font-size:0.86rem; color:#fff;">${b.title}</div>
            <div style="font-size:0.75rem; color:#94a3b8;">Vencimento: ${AppState.formatDate(b.dueDate)}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; color:#fff; font-family:var(--font-heading);">${AppState.formatCurrency(b.amount)}</div>
          <button class="btn btn-outline btn-sm" onclick="BillsModule.markAsPaid('${b.id}')" style="margin-top:4px; padding:3px 8px; font-size:0.72rem;">Dar Baixa</button>
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  }
};
