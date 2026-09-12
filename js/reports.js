/**
 * SD FINANÇAS ENTERPRISE - Reports & Analytics (DRE & Export)
 */

const ReportsModule = {
  render() {
    this.renderDRE();
  },

  renderDRE() {
    const container = document.getElementById('reports-dre-container');
    if (!container) return;

    const incomeTotal = AppState.transactions
      .filter(t => t.type === 'income')
      .reduce((a, t) => a + parseFloat(t.amount), 0);

    const expenseTotal = AppState.transactions
      .filter(t => t.type === 'expense')
      .reduce((a, t) => a + parseFloat(t.amount), 0);

    const netResult = incomeTotal - expenseTotal;

    // Group expenses by category
    const catExpenses = {};
    AppState.transactions.filter(t => t.type === 'expense').forEach(t => {
      catExpenses[t.category] = (catExpenses[t.category] || 0) + parseFloat(t.amount);
    });

    container.innerHTML = `
      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:14px; margin-bottom:16px;">
          <div>
            <h3 style="font-family:var(--font-heading); font-size:1.2rem; color:var(--gold-light);">Demonstrativo de Resultado do Exercício (DRE)</h3>
            <p style="font-size:0.8rem; color:var(--text-muted);">Consolidado do período corrente</p>
          </div>
          <button class="btn btn-outline btn-sm" onclick="ReportsModule.exportCSV()">
            <i data-lucide="download"></i> Exportar CSV / Excel
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(255,255,255,0.08);">
            <span style="font-weight:700; color:var(--emerald-light);">(+) RECEITA BRUTA TOTAL</span>
            <span style="font-weight:800; font-family:var(--font-heading); color:var(--emerald-light);">${AppState.formatCurrency(incomeTotal)}</span>
          </div>

          <div style="padding-left:14px;">
            <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:6px;">(-) DESPESAS OPERACIONAIS POR CATEGORIA:</div>
            ${Object.entries(catExpenses).map(([cat, val]) => `
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; padding:4px 0; color:#cbd5e1;">
                <span>• ${cat}</span>
                <span style="color:var(--rose-light);">${AppState.formatCurrency(val)}</span>
              </div>
            `).join('')}
          </div>

          <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(255,255,255,0.08); font-weight:700; color:var(--rose-light);">
            <span>(-) TOTAL DE DESPESAS</span>
            <span style="font-weight:800; font-family:var(--font-heading);">${AppState.formatCurrency(expenseTotal)}</span>
          </div>

          <div style="display:flex; justify-content:space-between; padding:12px 16px; background:rgba(212,175,55,0.08); border:1px solid rgba(212,175,55,0.25); border-radius:var(--radius-md); margin-top:8px;">
            <span style="font-weight:800; font-size:1.05rem; color:var(--gold-light);">(=) RESULTADO LÍQUIDO DO PERÍODO</span>
            <span style="font-weight:800; font-size:1.25rem; font-family:var(--font-heading); color:${netResult >= 0 ? 'var(--emerald-light)' : 'var(--rose-light)'};">
              ${AppState.formatCurrency(netResult)}
            </span>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) lucide.createIcons();
  },

  exportCSV() {
    let csv = 'ID;Data;Descricao;Categoria;Conta;Tipo;Valor\n';
    AppState.transactions.forEach(t => {
      const acc = AppState.accounts.find(a => a.id === t.accountId);
      csv += `"${t.id}";"${t.date}";"${t.desc.replace(/"/g, '""')}";"${t.category}";"${acc ? acc.name : ''}";"${t.type}";"${t.amount.toFixed(2)}"\n`;
    });

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_Financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    AppState.showToast('Relatório CSV exportado com sucesso!');
  }
};
