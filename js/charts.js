/* ===================================================================
   SD FINANÇAS PRO — MÓDULO DE GRÁFICOS INTERATIVOS (CHART.JS)
   =================================================================== */

const ChartsManager = {
  cashflowChartInstance: null,
  categoryChartInstance: null,
  projectionChartInstance: null,

  // Inicializa ou atualiza o gráfico de fluxo de caixa (Receitas x Despesas)
  initCashflowChart(transactions) {
    const canvas = document.getElementById('cashflowChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Agrupamento dos últimos 6 meses
    const months = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'];
    const incomeData = [8200, 9100, 8900, 11500, 10200, 13415];
    const expenseData = [4500, 4800, 5200, 6100, 4950, 3402];

    if (this.cashflowChartInstance) {
      this.cashflowChartInstance.destroy();
    }

    // Gradientes de preenchimento
    const gradIncome = ctx.createLinearGradient(0, 0, 0, 300);
    gradIncome.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    gradIncome.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const gradExpense = ctx.createLinearGradient(0, 0, 0, 300);
    gradExpense.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
    gradExpense.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    this.cashflowChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Receitas (R$)',
            data: incomeData,
            borderColor: '#10b981',
            backgroundColor: gradIncome,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Despesas (R$)',
            data: expenseData,
            borderColor: '#ef4444',
            backgroundColor: gradExpense,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: { family: 'Plus Jakarta Sans', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#101626',
            titleColor: '#ffffff',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += Storage.formatCurrency(context.parsed.y);
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.04)',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans' }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#64748b',
              font: { family: 'Plus Jakarta Sans' },
              callback: function(val) {
                return 'R$ ' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val);
              }
            }
          }
        }
      }
    });
  },

  // Inicializa o gráfico de pizza/donut de despesas por categoria
  initCategoryDonut(transactions) {
    const canvas = document.getElementById('categoryDonutChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Extrai totais por categoria
    const categoryTotals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    // Paleta sofisticada
    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#06b6d4'];

    if (this.categoryChartInstance) {
      this.categoryChartInstance.destroy();
    }

    this.categoryChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: '#0a0e17',
            borderWidth: 3,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 12,
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          },
          tooltip: {
            backgroundColor: '#101626',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                return ` ${context.label}: ${Storage.formatCurrency(val)}`;
              }
            }
          }
        },
        cutout: '72%'
      }
    });
  },

  // Gráfico da Projeção de Investimentos (Simulador)
  renderInvestmentProjection(years, investedData, totalData) {
    const canvas = document.getElementById('projectionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (this.projectionChartInstance) {
      this.projectionChartInstance.destroy();
    }

    const gradTotal = ctx.createLinearGradient(0, 0, 0, 300);
    gradTotal.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    gradTotal.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    this.projectionChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: years.map(y => `Ano ${y}`),
        datasets: [
          {
            label: 'Patrimônio Total (com Juros)',
            data: totalData,
            borderColor: '#6366f1',
            backgroundColor: gradTotal,
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#6366f1'
          },
          {
            label: 'Total Investido do Bolso',
            data: investedData,
            borderColor: '#94a3b8',
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
            borderWidth: 2,
            pointBackgroundColor: '#94a3b8'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8' }
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ` ${ctx.dataset.label}: ${Storage.formatCurrency(ctx.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#64748b' } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#64748b',
              callback: val => 'R$ ' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
            }
          }
        }
      }
    });
  }
};
