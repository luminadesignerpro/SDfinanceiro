/* ===================================================================
   SD FINANÇAS PRO — METAS FINANCEIRAS & ORÇAMENTOS POR CATEGORIA
   =================================================================== */

const BudgetsManager = {
  init() {
    this.renderBudgets();
    this.renderGoals();
    this.setupEventListeners();
  },

  // Renderiza os tetos orçamentários por categoria
  renderBudgets() {
    const container = document.getElementById('budgetsContainer');
    if (!container) return;

    const budgets = Storage.getBudgets();
    const transactions = Storage.getTransactions().filter(t => t.type === 'expense');

    // Calcula gastos reais em cada categoria
    const spentByCategory = {};
    transactions.forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });

    container.innerHTML = budgets.map(b => {
      const spent = spentByCategory[b.category] || 0;
      const percent = Math.min(Math.round((spent / b.limit) * 100), 100);
      const isOver = spent > b.limit;
      const statusColor = isOver ? '#ef4444' : (percent > 80 ? '#f59e0b' : '#10b981');

      return `
        <div class="card" style="padding: 18px 22px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:34px; height:34px; border-radius:8px; background:rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; color:${statusColor}">
                <i data-lucide="${b.icon || 'tag'}"></i>
              </div>
              <h4 style="font-size:0.95rem; font-weight:600;">${b.category}</h4>
            </div>
            <span style="font-size:0.8rem; font-weight:700; color:${statusColor}">${percent}%</span>
          </div>

          <div class="goal-progress-bar" style="margin-bottom: 10px;">
            <div class="goal-progress-fill" style="width: ${percent}%; background: ${statusColor};"></div>
          </div>

          <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-secondary);">
            <span>Gasto: <strong style="color:var(--text-primary)">${Storage.formatCurrency(spent)}</strong></span>
            <span>Limite: <strong style="color:var(--text-primary)">${Storage.formatCurrency(b.limit)}</strong></span>
          </div>
          ${isOver ? `<p style="font-size:0.72rem; color:#ef4444; margin-top:6px; font-weight:600;">⚠️ Atenção: Orçamento estourado em ${Storage.formatCurrency(spent - b.limit)}!</p>` : ''}
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  // Renderiza as Metas / Cofrinhos
  renderGoals() {
    const container = document.getElementById('goalsContainer');
    if (!container) return;

    const goals = Storage.getGoals();

    container.innerHTML = goals.map(g => {
      const percent = Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100);
      const remaining = Math.max(g.targetAmount - g.currentAmount, 0);

      return `
        <div class="goal-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:44px; height:44px; border-radius:12px; background:${g.color}22; color:${g.color}; display:flex; align-items:center; justify-content:center;">
                <i data-lucide="${g.icon || 'target'}"></i>
              </div>
              <div>
                <h4 style="font-size:1rem; font-weight:600; color:var(--text-white);">${g.name}</h4>
                <p style="font-size:0.75rem; color:var(--text-secondary);">Prazo: ${Storage.formatDate(g.deadline)}</p>
              </div>
            </div>
            <span class="badge" style="background:${g.color}22; color:${g.color};">${percent}%</span>
          </div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:6px;">
              <span style="color:var(--text-secondary)">Acumulado: <strong style="color:var(--text-white)">${Storage.formatCurrency(g.currentAmount)}</strong></span>
              <span style="color:var(--text-secondary)">Alvo: <strong style="color:var(--text-white)">${Storage.formatCurrency(g.targetAmount)}</strong></span>
            </div>
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width:${percent}%; background: linear-gradient(90deg, ${g.color}, var(--primary));"></div>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">Faltam ${Storage.formatCurrency(remaining)} para atingir a meta.</p>
          </div>

          <div style="display:flex; gap:8px; margin-top:4px;">
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="BudgetsManager.quickDeposit('${g.id}', 100)">+ R$ 100</button>
            <button class="btn btn-secondary btn-sm" style="flex:1" onclick="BudgetsManager.quickDeposit('${g.id}', 500)">+ R$ 500</button>
            <button class="btn btn-primary btn-sm" onclick="BudgetsManager.customDeposit('${g.id}')">Aportar</button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  // Aporte rápido
  quickDeposit(goalId, amount) {
    const goals = Storage.getGoals();
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      goal.currentAmount += amount;
      Storage.saveGoals(goals);
      this.renderGoals();
      App.showToast(`Aporte de ${Storage.formatCurrency(amount)} adicionado à meta "${goal.name}"!`);
    }
  },

  // Aporte com valor customizado
  customDeposit(goalId) {
    const amountStr = prompt('Informe o valor a ser aportado nesta meta (R$):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      alert('Valor inválido!');
      return;
    }
    this.quickDeposit(goalId, amount);
  },

  openNewGoalModal() {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    if (form) form.reset();
    if (modal) modal.classList.add('active');
  },

  closeGoalModal() {
    const modal = document.getElementById('goalModal');
    if (modal) modal.classList.remove('active');
  },

  saveGoalFromForm(e) {
    e.preventDefault();
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value) || 0;
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const deadline = document.getElementById('goalDeadline').value;
    const icon = document.getElementById('goalIcon').value;

    if (!name || target <= 0) {
      alert('Preencha o nome da meta e o valor alvo.');
      return;
    }

    const colors = ['#10b981', '#6366f1', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newGoal = {
      id: 'goal-' + Date.now(),
      name: name,
      targetAmount: target,
      currentAmount: current,
      deadline: deadline || '2027-12-31',
      icon: icon || 'target',
      color: randomColor
    };

    const goals = Storage.getGoals();
    goals.push(newGoal);
    Storage.saveGoals(goals);

    this.closeGoalModal();
    this.renderGoals();
    App.showToast('Nova meta financeira criada!');
  },

  setupEventListeners() {
    const form = document.getElementById('goalForm');
    if (form) {
      form.addEventListener('submit', (e) => this.saveGoalFromForm(e));
    }
  }
};
