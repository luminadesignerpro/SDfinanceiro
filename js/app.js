/**
 * SD FINANÇAS ENTERPRISE - Main Application Controller
 */

const App = {
  activeTab: 'dashboard',

  init() {
    AppState.init();
    if (window.AgendaModule) AgendaModule.init();
    this.bindEvents();
    this.switchTab('dashboard');
    this.setupKeyboardShortcuts();
    if (window.lucide) lucide.createIcons();
    console.log('SD Financeiro inicializado com sucesso.');
  },

  bindEvents() {
    // Navigation tabs (Top bar Image 1 & Sidebar Image 2)
    document.querySelectorAll('.nav-tab-btn, .sd-sidebar .nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Mobile Sidebar Toggle
    const btnToggle = document.getElementById('btn-toggle-sidebar');
    const btnClose = document.getElementById('btn-close-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar');

    const toggleSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('active');
    };

    const closeSidebar = () => {
      if (!sidebar) return;
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    };

    if (btnToggle) btnToggle.addEventListener('click', toggleSidebar);
    if (btnClose) btnClose.addEventListener('click', closeSidebar);
    if (backdrop) backdrop.addEventListener('click', closeSidebar);

    // Lockscreen PIN form
    const formPin = document.getElementById('form-lock-pin');
    if (formPin) {
      formPin.addEventListener('submit', (e) => LockscreenModule.handlePinSubmit(e));
    }

    // New transaction form
    const formTx = document.getElementById('form-new-tx');
    if (formTx) {
      formTx.addEventListener('submit', e => TransactionsModule.saveFromForm(e));
    }

    // Transfer form
    const formTransfer = document.getElementById('form-transfer');
    if (formTransfer) {
      formTransfer.addEventListener('submit', e => AccountsModule.executeTransfer(e));
    }

    // Search and filter listeners
    const searchInput = document.getElementById('tx-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        TransactionsModule.currentFilter.search = e.target.value;
        TransactionsModule.renderList();
      });
    }

    const typeFilter = document.getElementById('tx-filter-type');
    if (typeFilter) {
      typeFilter.addEventListener('change', e => {
        TransactionsModule.currentFilter.type = e.target.value;
        TransactionsModule.renderList();
      });
    }

    const catFilter = document.getElementById('tx-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', e => {
        TransactionsModule.currentFilter.category = e.target.value;
        TransactionsModule.renderList();
      });
    }

    // Bills filter buttons
    document.querySelectorAll('.btn-bill-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-bill-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        BillsModule.currentTab = btn.getAttribute('data-filter');
        BillsModule.renderList();
      });
    });

    // Investments simulator inputs
    ['sim-initial', 'sim-monthly', 'sim-rate', 'sim-period'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => InvestmentsModule.runSimulation());
    });

    // Backup import input
    const fileInput = document.getElementById('input-backup-file');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
          if (StorageEngine.importBackup(evt.target.result)) {
            AppState.reloadAll();
            this.switchTab(this.activeTab);
            AppState.showToast('Backup restaurado com sucesso!');
          } else {
            AppState.showToast('Erro ao ler arquivo de backup.', 'error');
          }
        };
        reader.readAsText(file);
      });
    }
  },

  switchTab(tabId) {
    this.activeTab = tabId;

    // Update top bar buttons (Image 1)
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } else {
        btn.classList.remove('active');
      }
    });

    // Update sidebar nav items (Image 2)
    document.querySelectorAll('.sd-sidebar .nav-item[data-tab]').forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Auto close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('active');
    }

    // Update panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Render corresponding module
    switch (tabId) {
      case 'dashboard':
        DashboardModule.render();
        break;
      case 'transactions':
        TransactionsModule.render();
        break;
      case 'accounts':
        AccountsModule.render();
        break;
      case 'cards':
        CardsModule.render();
        break;
      case 'bills':
        BillsModule.render();
        break;
      case 'goals':
        GoalsModule.render();
        break;
      case 'investments':
        InvestmentsModule.render();
        break;
      case 'agenda':
        if (window.AgendaModule) AgendaModule.render();
        break;
      case 'reports':
        ReportsModule.render();
        break;
    }

    if (window.lucide) lucide.createIcons();
  },

  setupKeyboardShortcuts() {
    window.addEventListener('keydown', e => {
      // Ignore when inside input/textarea
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        TransactionsModule.openModal();
      } else if (e.key === 'Escape') {
        TransactionsModule.closeModal();
        AccountsModule.closeTransferModal();
      }
    });
  },

  resetData() {
    if (!confirm('Atenção: Todos os dados serão redefinidos para os valores padrão de demonstração. Deseja continuar?')) return;
    StorageEngine.resetAllData();
    AppState.reloadAll();
    this.switchTab(this.activeTab);
    AppState.showToast('Dados restaurados para o padrão de demonstração.');
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
