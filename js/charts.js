/**
 * SDFINANCEIRO — Chart.js Visualizations & Analytics Module
 */

const Charts = {
  instances: {},

  init() {
    this.renderAll();
  },

  renderAll() {
    this.renderCashFlow();
    this.renderCategoriesDoughnut('chart-categories');
    this.renderCategoriesDoughnut('chart-categories-report');
    this.renderPaymentMethods();
    this.renderCreditLimits();
  },

  destroyChart(id) {
    if (this.instances[id]) {
      this.instances[id].destroy();
      delete this.instances[id];
    }
  },

  renderCashFlow() {
    const canvas = document.getElementById('chart-cash-flow');
    if (!canvas) return;
    this.destroyChart('cashFlow');

    const transactions = Storage.getTransactions();
    const now = new Date();
    const monthsLabels = [];
    const incomeData = [];
    const expenseData = [];

    // Calculate past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mYear = d.getFullYear();
      const mMonth = d.getMonth() + 1; // 1-12
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      monthsLabels.push(label.charAt(0).toUpperCase() + label.slice(1));

      const monthTx = transactions.filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return y === mYear && m === mMonth;
      });

      const inc = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      incomeData.push(inc);
      expenseData.push(exp);
    }

    const ctx = canvas.getContext('2d');
    this.instances['cashFlow'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: monthsLabels,
        datasets: [
          {
            label: 'Receitas (R$)',
            data: incomeData,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderRadius: 6,
            barPercentage: 0.6
          },
          {
            label: 'Despesas (R$)',
            data: expenseData,
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            borderRadius: 6,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans' },
              callback: (val) => 'R$ ' + val.toLocaleString('pt-BR')
            }
          }
        }
      }
    });
  },

  renderCategoriesDoughnut(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    this.destroyChart(canvasId);

    const transactions = Storage.getTransactions();
    const expenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (typeof App !== 'undefined' && App.isDateInSelectedPeriod) {
        return App.isDateInSelectedPeriod(t.date);
      }
      return true;
    });

    const catTotals = {};
    expenses.forEach(t => {
      const cat = t.category || 'Outros';
      catTotals[cat] = (catTotals[cat] || 0) + t.amount;
    });

    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals);

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', 
      '#06b6d4', '#ef4444', '#6366f1', '#14b8a6', '#f97316'
    ];

    if (labels.length === 0) {
      labels.push('Sem despesas');
      data.push(1);
    }

    const ctx = canvas.getContext('2d');
    this.instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#121a2b'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', boxWidth: 12, padding: 14, font: { family: 'Plus Jakarta Sans', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          }
        }
      }
    });
  },

  renderPaymentMethods() {
    const canvas = document.getElementById('chart-payment-methods');
    if (!canvas) return;
    this.destroyChart('paymentMethods');

    const accounts = Storage.getAccounts();
    const transactions = Storage.getTransactions();
    const checks = Storage.getChecks();

    let creditTotal = 0;
    let debitTotal = 0;
    let cashTotal = 0;
    let checkTotal = checks.filter(c => c.type === 'issued').reduce((s, c) => s + c.amount, 0);

    const filteredExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      if (typeof App !== 'undefined' && App.isDateInSelectedPeriod) {
        return App.isDateInSelectedPeriod(t.date);
      }
      return true;
    });

    filteredExpenses.forEach(t => {
      const acc = accounts.find(a => a.id === t.accountId);
      if (acc) {
        if (acc.type === 'credit') creditTotal += t.amount;
        else if (acc.type === 'cash') cashTotal += t.amount;
        else debitTotal += t.amount;
      }
    });

    const ctx = canvas.getContext('2d');
    this.instances['paymentMethods'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Cartão de Crédito', 'Débito / Conta Bancária', 'Cheques Emitidos', 'Dinheiro em Espécie'],
        datasets: [{
          label: 'Total de Gastos (R$)',
          data: [creditTotal, debitTotal, checkTotal, cashTotal],
          backgroundColor: [
            'rgba(99, 102, 241, 0.85)',
            'rgba(59, 130, 246, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(16, 185, 129, 0.85)'
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
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
              callback: (val) => 'R$ ' + val.toLocaleString('pt-BR')
            }
          }
        }
      }
    });
  },

  renderCreditLimits() {
    const canvas = document.getElementById('chart-credit-limits');
    if (!canvas) return;
    this.destroyChart('creditLimits');

    const creditCards = Storage.getAccounts().filter(a => a.type === 'credit');
    const labels = creditCards.map(c => c.name);
    const usedData = creditCards.map(c => c.usedLimit || 0);
    const availableData = creditCards.map(c => Math.max(0, c.limit - (c.usedLimit || 0)));

    const ctx = canvas.getContext('2d');
    this.instances['creditLimits'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Limite Utilizado (Fatura)',
            data: usedData,
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            borderRadius: 6
          },
          {
            label: 'Limite Restante Disponível',
            data: availableData,
            backgroundColor: 'rgba(59, 130, 246, 0.4)',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              callback: (val) => 'R$ ' + val.toLocaleString('pt-BR')
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: R$ ${ctx.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
            }
          }
        }
      }
    });
  }
};
