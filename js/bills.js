/**
 * SD FINANÇAS ENTERPRISE - Accounts Payable & Receivable (Contas a Pagar / Receber)
 */

const BillsModule = {
  currentTab: 'all',

  render() {
    this.renderSummary();
    this.renderList();
  },

  renderSummary() {
    const summary = AppState.getPendingBillsSummary();
    const payEl = document.getElementById('bills-total-payable');
    const recEl = document.getElementById('bills-total-receivable');

    if (payEl) payEl.textContent = AppState.formatCurrency(summary.payable);
    if (recEl) recEl.textContent = AppState.formatCurrency(summary.receivable);
  },

  renderList() {
    const tbody = document.getElementById('bills-table-body');
    if (!tbody) return;

    let list = [...AppState.bills];
    if (this.currentTab === 'payable') {
      list = list.filter(b => b.type === 'payable');
    } else if (this.currentTab === 'receivable') {
      list = list.filter(b => b.type === 'receivable');
    }

    // Sort by due date
    list.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">Nenhuma conta encontrada nesta categoria.</td></tr>';
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    tbody.innerHTML = list.map(b => {
      const isPayable = b.type === 'payable';
      const isPaid = b.status === 'paid';
      const isOverdue = !isPaid && b.dueDate < todayStr;

      let statusBadge = '<span class="badge badge-pending">Pendente</span>';
      if (isPaid) statusBadge = '<span class="badge badge-gold">Liquidado</span>';
      else if (isOverdue) statusBadge = '<span class="badge badge-expense">Atrasado</span>';

      return `
        <tr>
          <td>
            <div style="font-weight:600; color:#fff;">${b.title}</div>
            <div style="font-size:0.75rem; color:#64748b;">${b.category || 'Geral'}</div>
          </td>
          <td><span class="badge ${isPayable ? 'badge-expense' : 'badge-income'}">${isPayable ? 'A Pagar' : 'A Receber'}</span></td>
          <td style="color:${isOverdue ? 'var(--rose-light)' : '#94a3b8'}; font-weight:${isOverdue ? '700' : '500'};">
            ${AppState.formatDate(b.dueDate)}
          </td>
          <td style="font-weight:800; font-family:var(--font-heading); color:${isPayable ? 'var(--rose)' : 'var(--emerald)'};">
            ${AppState.formatCurrency(b.amount)}
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display:flex; gap:6px;">
              ${!isPaid ? `
                <button class="btn btn-sm btn-outline" style="color:var(--emerald); border-color:rgba(16,185,129,0.3);" onclick="BillsModule.markAsPaid('${b.id}')" title="Dar Baixa">
                  <i data-lucide="check"></i> Baixar
                </button>
              ` : ''}
              <button class="btn-icon" onclick="BillsModule.delete('${b.id}')" title="Excluir">
                <i data-lucide="trash-2" style="width:14px; height:14px; color:var(--rose);"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  markAsPaid(billId) {
    const bill = AppState.bills.find(b => b.id === billId);
    if (!bill || bill.status === 'paid') return;

    const isPayable = bill.type === 'payable';
    const acc = AppState.accounts[0];

    if (acc) {
      if (isPayable) acc.balance -= bill.amount;
      else acc.balance += bill.amount;
      AppState.save('accounts');

      AppState.transactions.unshift({
        id: 'tx-' + Date.now(),
        desc: `[Baixa] ${bill.title}`,
        amount: bill.amount,
        type: isPayable ? 'expense' : 'income',
        category: bill.category || 'Contas Fixas',
        accountId: acc.id,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      });
      AppState.save('transactions');
    }

    bill.status = 'paid';
    AppState.save('bills');

    this.render();
    DashboardModule.render();
    AccountsModule.render();
    TransactionsModule.render();
    AppState.showToast(`Conta "${bill.title}" liquidada com sucesso!`);
  },

  openNewBillModal() {
    const title = prompt('Título / Descrição da Conta (ex: Aluguel, Provedor, Fatura Cliente):');
    if (!title || !title.trim()) return;

    const amount = parseFloat(prompt('Valor (R$):', '500'));
    if (isNaN(amount) || amount <= 0) return;

    const typeChoice = confirm('Clique em OK para "A PAGAR" ou CANCELAR para "A RECEBER":');
    const type = typeChoice ? 'payable' : 'receivable';

    const dueDate = prompt('Data de Vencimento (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);

    AppState.bills.push({
      id: 'bill-' + Date.now(),
      title: title.trim(),
      amount,
      type,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      status: 'pending',
      category: 'Geral'
    });

    AppState.save('bills');
    this.render();
    DashboardModule.render();
    AppState.showToast(`Lançamento programado de "${title}" adicionado!`);
  },

  delete(id) {
    if (!confirm('Deseja excluir este agendamento?')) return;
    const idx = AppState.bills.findIndex(b => b.id === id);
    if (idx !== -1) {
      AppState.bills.splice(idx, 1);
      AppState.save('bills');
      this.render();
      DashboardModule.render();
      AppState.showToast('Agendamento removido.');
    }
  }
};
