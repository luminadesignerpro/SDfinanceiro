/**
 * SDFINANCEIRO — Bills & Utilities Management Module
 * Gestão de Contas Fixas & Consumo (Água, Energia, Internet, Aluguel, etc.)
 */

const Bills = {
  activeStatusFilter: 'all',
  activeTypeFilter: 'all',

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Open Modal to Add Bill
    const addBtn = document.getElementById('btn-add-bill');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openBillModal();
      });
    }

    // Quick bill from header action if exists
    const quickBillBtn = document.getElementById('btn-quick-bill');
    if (quickBillBtn) {
      quickBillBtn.addEventListener('click', () => {
        this.openBillModal();
      });
    }

    // Bill Form Submit
    const form = document.getElementById('form-bill');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveBill();
      });
    }

    // Status Filter Chips
    const statusTabs = document.querySelectorAll('#bill-status-filters .filter-tab');
    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeStatusFilter = tab.dataset.status;
        this.render();
      });
    });

    // Type Filter Select
    const typeSelect = document.getElementById('bill-filter-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.activeTypeFilter = e.target.value;
        this.render();
      });
    }
  },

  openBillModal(billId = null) {
    const modal = document.getElementById('modal-bill');
    const form = document.getElementById('form-bill');
    const title = document.getElementById('modal-bill-title');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('bill-id').value = '';

    // Populate Account select
    const accountSelect = document.getElementById('form-bill-account');
    if (accountSelect) {
      const accounts = Storage.getAccounts().filter(a => a.type === 'debit' || a.type === 'cash' || a.type === 'credit');
      accountSelect.innerHTML = accounts.map(a => `
        <option value="${a.id}">${a.name} (${a.type === 'credit' ? 'Cartão Crédito' : 'Saldo: R$ ' + a.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</option>
      `).join('');
    }

    if (billId) {
      const bills = Storage.getBills();
      const b = bills.find(item => item.id === billId);
      if (b) {
        if (title) title.textContent = 'Editar Conta de Consumo';
        document.getElementById('bill-id').value = b.id;
        document.getElementById('form-bill-title').value = b.title || '';
        document.getElementById('form-bill-type').value = b.type || 'energy';
        document.getElementById('form-bill-provider').value = b.provider || '';
        document.getElementById('form-bill-amount').value = b.amount || '';
        document.getElementById('form-bill-due-date').value = b.dueDate || '';
        document.getElementById('form-bill-ref-month').value = b.refMonth || '';
        document.getElementById('form-bill-barcode').value = b.barcode || '';
        document.getElementById('form-bill-pix').value = b.pixKey || '';
        document.getElementById('form-bill-status').value = b.status || 'pending';
        if (document.getElementById('form-bill-notes')) {
          document.getElementById('form-bill-notes').value = b.notes || '';
        }
        if (accountSelect && b.accountId) {
          accountSelect.value = b.accountId;
        }
      }
    } else {
      if (title) title.textContent = 'Cadastrar Nova Conta (Água, Luz, Internet...)';
      // Default today/next due date
      const today = new Date();
      const nextDue = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);
      document.getElementById('form-bill-due-date').value = nextDue.toISOString().split('T')[0];
      
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      document.getElementById('form-bill-ref-month').value = `${mm}/${today.getFullYear()}`;
    }

    modal.classList.add('active');
  },

  saveBill() {
    const id = document.getElementById('bill-id').value;
    const title = document.getElementById('form-bill-title').value.trim();
    const type = document.getElementById('form-bill-type').value;
    const provider = document.getElementById('form-bill-provider').value.trim();
    const amount = parseFloat(document.getElementById('form-bill-amount').value) || 0;
    const dueDate = document.getElementById('form-bill-due-date').value;
    const refMonth = document.getElementById('form-bill-ref-month').value.trim();
    const barcode = document.getElementById('form-bill-barcode').value.trim();
    const pixKey = document.getElementById('form-bill-pix').value.trim();
    const status = document.getElementById('form-bill-status').value;
    const accountId = document.getElementById('form-bill-account')?.value || '';
    const notes = document.getElementById('form-bill-notes')?.value.trim() || '';

    if (!title || !amount || !dueDate) {
      App.showToast('Preencha os campos obrigatórios (Título, Valor e Vencimento).', 'error');
      return;
    }

    const bills = Storage.getBills();

    if (id) {
      const idx = bills.findIndex(b => b.id === id);
      if (idx !== -1) {
        bills[idx] = {
          ...bills[idx],
          title, type, provider, amount, dueDate, refMonth, barcode, pixKey, status, accountId, notes
        };
        App.showToast('Conta atualizada com sucesso!', 'success');
      }
    } else {
      const newBill = {
        id: `bill_${Date.now()}`,
        title, type, provider, amount, dueDate, refMonth, barcode, pixKey, status, accountId, notes
      };
      bills.unshift(newBill);
      App.showToast('Nova conta cadastrada com sucesso!', 'success');
    }

    Storage.saveBills(bills);
    App.closeModals();
    App.refreshAll();
  },

  togglePayBill(billId) {
    const bills = Storage.getBills();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    if (bill.status === 'pending') {
      if (confirm(`Deseja marcar a conta "${bill.title}" (R$ ${bill.amount.toFixed(2)}) como PAGA?`)) {
        bill.status = 'paid';
        bill.paidAt = new Date().toISOString().split('T')[0];

        // Also optionally register as transaction in transactions
        const transactions = Storage.getTransactions();
        transactions.unshift({
          id: `tx_${Date.now()}`,
          type: 'expense',
          amount: bill.amount,
          date: bill.paidAt,
          desc: `Pagamento: ${bill.title} (${bill.refMonth || 'Consumo'})`,
          category: bill.type === 'energy' || bill.type === 'water' || bill.type === 'internet' ? 'Moradia' : 'Serviços',
          accountId: bill.accountId || 'acc_debit_1',
          installments: 1,
          status: 'completed',
          notes: `Baixa automática de conta. Autenticação/Pix: ${bill.pixKey || bill.barcode || 'Liquidado'}`
        });
        Storage.saveTransactions(transactions);

        App.showToast(`Conta "${bill.title}" marcada como PAGA e debitada!`, 'success');
      }
    } else {
      if (confirm(`Deseja reabrir a conta "${bill.title}" e marcá-la como PENDENTE?`)) {
        bill.status = 'pending';
        delete bill.paidAt;
        App.showToast(`Conta "${bill.title}" retornada para Pendente.`, 'info');
      }
    }

    Storage.saveBills(bills);
    App.refreshAll();
  },

  deleteBill(billId) {
    const bills = Storage.getBills();
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;

    if (confirm(`Tem certeza que deseja excluir a conta "${bill.title}"?`)) {
      const filtered = bills.filter(b => b.id !== billId);
      Storage.saveBills(filtered);
      App.showToast('Conta excluída com sucesso.', 'info');
      App.refreshAll();
    }
  },

  copyToClipboard(text, label = 'Código') {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      App.showToast(`${label} copiado para a área de transferência!`, 'success');
    }).catch(() => {
      prompt(`Copie o ${label}:`, text);
    });
  },

  getTypeIconAndName(type) {
    switch (type) {
      case 'water':
        return { icon: 'droplet', color: '#06b6d4', name: 'Água / Saneamento' };
      case 'energy':
        return { icon: 'zap', color: '#f59e0b', name: 'Energia / Luz' };
      case 'internet':
        return { icon: 'wifi', color: '#3b82f6', name: 'Internet / Fibra' };
      case 'phone':
        return { icon: 'smartphone', color: '#8b5cf6', name: 'Telefonia' };
      case 'rent':
        return { icon: 'home', color: '#ec4899', name: 'Aluguel / Imóvel' };
      case 'gas':
        return { icon: 'flame', color: '#f97316', name: 'Gás Encanado' };
      default:
        return { icon: 'file-text', color: '#64748b', name: 'Outras Contas' };
    }
  },

  render() {
    const bills = Storage.getBills();
    const tbody = document.getElementById('bills-table-body');
    const cardsGrid = document.getElementById('bills-cards-grid');
    if (!tbody && !cardsGrid) return;

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter list
    const filtered = bills.filter(b => {
      const isOverdue = b.status === 'pending' && b.dueDate < todayStr;
      
      let matchStatus = true;
      if (this.activeStatusFilter === 'pending') matchStatus = (b.status === 'pending');
      else if (this.activeStatusFilter === 'paid') matchStatus = (b.status === 'paid');
      else if (this.activeStatusFilter === 'overdue') matchStatus = isOverdue;

      let matchType = true;
      if (this.activeTypeFilter !== 'all') matchType = (b.type === this.activeTypeFilter);

      return matchStatus && matchType;
    });

    // Update KPI counters
    const totalPending = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
    const overdueCount = bills.filter(b => b.status === 'pending' && b.dueDate < todayStr).length;
    const pendingCount = bills.filter(b => b.status === 'pending').length;

    const elKpiPending = document.getElementById('bills-kpi-pending');
    const elKpiPaid = document.getElementById('bills-kpi-paid');
    const elKpiOverdue = document.getElementById('bills-kpi-overdue');
    const elBadgePending = document.getElementById('badge-bills-count');

    if (elKpiPending) elKpiPending.textContent = `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elKpiPaid) elKpiPaid.textContent = `R$ ${totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elKpiOverdue) elKpiOverdue.textContent = `${overdueCount} contas`;
    if (elBadgePending) elBadgePending.textContent = pendingCount;

    // Render Quick Visual Cards (top 4 or active)
    if (cardsGrid) {
      if (bills.length === 0) {
        cardsGrid.innerHTML = `<div class="empty-state-small" style="grid-column: 1/-1;">Nenhuma conta cadastrada ainda. Clique em "+ Adicionar Conta".</div>`;
      } else {
        cardsGrid.innerHTML = bills.slice(0, 4).map(b => {
          const typeInfo = this.getTypeIconAndName(b.type);
          const isOverdue = b.status === 'pending' && b.dueDate < todayStr;
          const isPaid = b.status === 'paid';
          
          let statusBadge = isPaid
            ? `<span class="badge badge-success"><i data-lucide="check"></i> Paga</span>`
            : isOverdue
              ? `<span class="badge badge-danger"><i data-lucide="alert-triangle"></i> Vencida</span>`
              : `<span class="badge badge-warning"><i data-lucide="clock"></i> A Vencer</span>`;

          const [y, m, d] = (b.dueDate || '').split('-');
          const formattedDate = (d && m) ? `${d}/${m}/${y}` : b.dueDate;

          return `
            <div class="bill-quick-card ${isPaid ? 'is-paid' : ''} ${isOverdue ? 'is-overdue' : ''}">
              <div class="bill-card-top">
                <div class="bill-type-icon" style="background: ${typeInfo.color}22; color: ${typeInfo.color};">
                  <i data-lucide="${typeInfo.icon}"></i>
                </div>
                <div>
                  <h4 class="bill-title">${b.title}</h4>
                  <small class="bill-provider">${b.provider || typeInfo.name}</small>
                </div>
                <div style="margin-left: auto;">
                  ${statusBadge}
                </div>
              </div>
              <div class="bill-card-body">
                <div class="bill-value">R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div class="bill-due"><i data-lucide="calendar"></i> Vence: <b>${formattedDate}</b></div>
              </div>
              <div class="bill-card-actions">
                ${b.barcode ? `<button class="btn-action-pill" onclick="Bills.copyToClipboard('${b.barcode}', 'Código de Barras')" title="Copiar Linha Digitável"><i data-lucide="barcode"></i> Código</button>` : ''}
                ${b.pixKey ? `<button class="btn-action-pill" onclick="Bills.copyToClipboard('${b.pixKey}', 'Chave Pix')" title="Copiar Chave Pix"><i data-lucide="qr-code"></i> Pix</button>` : ''}
                <button class="btn-action-pill ${isPaid ? 'btn-paid' : 'btn-pay'}" onclick="Bills.togglePayBill('${b.id}')">
                  <i data-lucide="${isPaid ? 'rotate-ccw' : 'check-circle-2'}"></i> ${isPaid ? 'Reabrir' : 'Pagar'}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Render Table Body
    if (tbody) {
      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center" style="padding: 32px; color: var(--text-muted);">
              <i data-lucide="inbox" style="width: 32px; height: 32px; margin-bottom: 8px; opacity: 0.5;"></i>
              <p>Nenhuma conta de consumo encontrada para os filtros selecionados.</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = filtered.map(b => {
          const typeInfo = this.getTypeIconAndName(b.type);
          const isOverdue = b.status === 'pending' && b.dueDate < todayStr;
          const isPaid = b.status === 'paid';

          const [y, m, d] = (b.dueDate || '').split('-');
          const formattedDate = (d && m) ? `${d}/${m}/${y}` : b.dueDate;

          return `
            <tr class="${isPaid ? 'row-paid' : ''}">
              <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="table-icon-wrap" style="background: ${typeInfo.color}22; color: ${typeInfo.color};">
                    <i data-lucide="${typeInfo.icon}"></i>
                  </div>
                  <div>
                    <div style="font-weight: 600; color: var(--text-primary);">${b.title}</div>
                    <small style="color: var(--text-muted);">${b.provider || typeInfo.name} • Ref: ${b.refMonth || '-'}</small>
                  </div>
                </div>
              </td>
              <td><span class="badge-category">${typeInfo.name}</span></td>
              <td>
                <b>${formattedDate}</b>
                ${isOverdue ? '<span class="text-rose text-xs" style="display:block;"><i data-lucide="alert-circle" style="width:12px; height:12px;"></i> Atrasada</span>' : ''}
              </td>
              <td class="text-right" style="font-family: 'Outfit'; font-weight: 700; font-size: 1.05rem; color: ${isPaid ? 'var(--text-muted)' : 'var(--text-primary)'};">
                R$ ${b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td class="text-center">
                ${isPaid 
                  ? `<span class="badge badge-success"><i data-lucide="check"></i> Paga</span>` 
                  : isOverdue 
                    ? `<span class="badge badge-danger"><i data-lucide="alert-triangle"></i> Vencida</span>` 
                    : `<span class="badge badge-warning"><i data-lucide="clock"></i> Pendente</span>`
                }
              </td>
              <td>
                <div style="display: flex; gap: 6px; justify-content: center;">
                  ${b.barcode ? `<button class="btn-icon btn-sm" onclick="Bills.copyToClipboard('${b.barcode}', 'Código de Barras')" title="Copiar Código de Barras"><i data-lucide="barcode"></i></button>` : ''}
                  ${b.pixKey ? `<button class="btn-icon btn-sm" onclick="Bills.copyToClipboard('${b.pixKey}', 'Chave Pix')" title="Copiar Chave Pix"><i data-lucide="qr-code"></i></button>` : ''}
                </div>
              </td>
              <td class="text-center no-print">
                <div style="display: flex; gap: 6px; justify-content: center;">
                  <button class="btn btn-sm ${isPaid ? 'btn-secondary' : 'btn-primary'}" onclick="Bills.togglePayBill('${b.id}')" title="${isPaid ? 'Marcar como Pendente' : 'Marcar como Paga'}">
                    <i data-lucide="${isPaid ? 'rotate-ccw' : 'check'}"></i> ${isPaid ? 'Desfazer' : 'Pagar'}
                  </button>
                  <button class="btn-icon btn-sm" onclick="Bills.openBillModal('${b.id}')" title="Editar"><i data-lucide="edit-3"></i></button>
                  <button class="btn-icon btn-sm text-rose" onclick="Bills.deleteBill('${b.id}')" title="Excluir"><i data-lucide="trash-2"></i></button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    lucide.createIcons();
  }
};
