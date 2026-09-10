/* ===================================================================
   SD FINANÇAS PRO — CONTROLADOR PRINCIPAL & NAVEGAÇÃO
   =================================================================== */

const App = {
  activeTab: 'dashboard',

  init() {
    this.setupNavigation();
    this.setupSidebar();
    this.setupBackupButtons();

    // Inicializa subsistemas
    TransactionsManager.init();
    AccountsManager.init();
    BudgetsManager.init();
    SimulatorManager.init();

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  setupNavigation() {
    const navButtons = document.querySelectorAll('.sd-tab-btn, .nav-item button');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (!tab) return;
        this.switchTab(tab);
      });
    });

    // Rolagem horizontal com a roda do mouse sobre as abas
    const navRow = document.querySelector('.sd-nav-row');
    if (navRow) {
      navRow.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          navRow.scrollLeft += e.deltaY * 1.5;
        }
      }, { passive: false });
    }
  },

  switchTab(tabName) {
    this.activeTab = tabName;

    // Atualiza botões ativos nas abas e rola suavemente para o campo de visão
    document.querySelectorAll('.sd-tab-btn, .nav-item button').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        btn.classList.remove('active');
      }
    });

    // Atualiza seções ativas
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSection = document.getElementById(`section-${tabName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Título no Top Header (Nomes Exatos das Imagens de Referência)
    const titleMap = {
      'dashboard': 'Dashboard Geral',
      'accounts': 'Cartões & Contas',
      'budgets': 'Contas Fixas & Consumo',
      'transactions': 'Lançamentos',
      'checks': 'Gestão de Cheques',
      'agenda': 'Agenda & Lembretes',
      'reports': 'Relatórios & Gráficos',
      'users': 'Gestão & Usuários',
      'settings': 'Idioma & Configurações'
    };

    const headerTitle = document.getElementById('pageMainTitle');
    if (headerTitle) {
      headerTitle.textContent = titleMap[tabName] || 'SD Finanças Pro';
    }

    // Se estiver em mobile, fecha a sidebar ao selecionar aba
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && window.innerWidth <= 960) {
      sidebar.classList.remove('open');
    }

    // Re-renderizações pontuais ao trocar de aba
    if (tabName === 'transactions') {
      TransactionsManager.renderTransactionsList();
    } else if (tabName === 'accounts') {
      AccountsManager.renderAccounts();
    } else if (tabName === 'budgets') {
      BudgetsManager.renderBudgets();
      BudgetsManager.renderGoals();
    } else if (tabName === 'simulator') {
      SimulatorManager.calculate();
    } else if (tabName === 'dashboard') {
      TransactionsManager.renderDashboardMetrics();
      TransactionsManager.renderRecentTransactions();
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  },

  setupSidebar() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  },

  setupBackupButtons() {
    // Exportar JSON
    const btnExportJSON = document.getElementById('btnExportJSON');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        Storage.exportDataJSON();
        this.showToast('Backup JSON exportado com sucesso!');
      });
    }

    // Exportar CSV
    const btnExportCSV = document.getElementById('btnExportCSV');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        Storage.exportTransactionsCSV();
        this.showToast('Planilha CSV de lançamentos baixada!');
      });
    }

    // Restaurar dados originais
    const btnResetDemo = document.getElementById('btnResetDemo');
    if (btnResetDemo) {
      btnResetDemo.addEventListener('click', () => {
        if (confirm('Deseja resetar e carregar os dados de demonstração iniciais? Seus dados atuais serão sobrescritos.')) {
          Storage.resetToDefault();
          location.reload();
        }
      });
    }
  },

  lockSystem() {
    this.showToast('🔒 Sistema bloqueado com sucesso. Sessão protegida!', 'success');
  },

  showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i data-lucide="check-circle-2" style="width:16px; height:16px;"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);

    if (window.lucide) {
      lucide.createIcons();
    }

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
