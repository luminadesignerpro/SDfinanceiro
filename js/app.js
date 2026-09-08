/**
 * SDFINANCEIRO — Core Application Controller
 * (Coordenação Geral, Filtro Avançado por Dia, Semana, Mês, Ano e Busca por Data)
 */

const App = {
  currentTab: 'home',
  currentLang: 'pt-BR',
  currentPeriod: 'current_month',

  i18n: {
    'pt-BR': {
      nav_section_main: 'PRINCIPAL',
      nav_dashboard: 'Dashboard Geral',
      nav_accounts: 'Cartões & Contas',
      nav_transactions: 'Lançamentos',
      nav_checks: 'Gestão de Cheques',
      nav_section_plan: 'PLANEJAMENTO',
      nav_agenda: 'Agenda & Lembretes',
      nav_reports: 'Relatórios & Gráficos',
      nav_section_settings: 'SISTEMA',
      nav_language_settings: 'Idioma & Configurações',
      total_available: 'Disponível Total',
      role_admin: 'Administrador'
    },
    'en-US': {
      nav_section_main: 'MAIN',
      nav_dashboard: 'Dashboard',
      nav_accounts: 'Cards & Accounts',
      nav_transactions: 'Transactions',
      nav_checks: 'Check Management',
      nav_section_plan: 'PLANNING',
      nav_agenda: 'Agenda & Reminders',
      nav_reports: 'Reports & Analytics',
      nav_section_settings: 'SYSTEM',
      nav_language_settings: 'Language & Settings',
      total_available: 'Total Available',
      role_admin: 'Administrator'
    },
    'es-ES': {
      nav_section_main: 'PRINCIPAL',
      nav_dashboard: 'Panel General',
      nav_accounts: 'Tarjetas y Cuentas',
      nav_transactions: 'Movimientos',
      nav_checks: 'Gestión de Cheques',
      nav_section_plan: 'PLANIFICACIÓN',
      nav_agenda: 'Agenda y Recordatorios',
      nav_reports: 'Informes y Gráficos',
      nav_section_settings: 'SISTEMA',
      nav_language_settings: 'Idioma y Ajustes',
      total_available: 'Total Disponible',
      role_admin: 'Administrador'
    }
  },

  // Sanitização anti-XSS de inputs do usuário
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  init() {
    this.bindNavigation();
    this.bindModals();
    this.bindSettings();
    this.bindPeriodSelector();
    this.bindGlobalInputAutoSelect();
    this.bindLanguageSwitcher();
    this.bindQuickButtons();

    // Initial modules bootstrap
    Auth.init();
    Users.init();
    Accounts.init();
    Bills.init();
    Transactions.init();
    Checks.init();
    Agenda.init();
    Charts.init();

    if (typeof Comparativo !== 'undefined') {
      Comparativo.init();
    }
    this.bindImage2Header();

    this.refreshAll();
    this.syncQuickNavBadges();
    this.switchTab('comparativo');
    lucide.createIcons();
  },

  bindQuickButtons() {
    const quickTx = document.getElementById('btn-quick-transaction');
    if (quickTx) {
      quickTx.addEventListener('click', () => {
        Transactions.openModal();
      });
    }

    const quickApt = document.getElementById('btn-quick-appointment');
    if (quickApt) {
      quickApt.addEventListener('click', () => {
        Agenda.openAppointmentModal();
      });
    }

    const printTx = document.getElementById('btn-print-transactions');
    if (printTx) {
      printTx.addEventListener('click', () => {
        window.print();
      });
    }
  },

  bindGlobalInputAutoSelect() {
    // Auto selects text on click for inputs with specific attribute or modals
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'number' || e.target.type === 'password')) {
        if (!e.target.dataset.noAutoSelect) {
          setTimeout(() => e.target.select(), 50);
        }
      }
    });
  },

  bindLanguageSwitcher() {
    // Load stored language preference or default to pt-BR
    const savedLang = localStorage.getItem('sdfinanceiro_lang') || 'pt-BR';
    this.setLanguage(savedLang);

    const langRadios = document.querySelectorAll('input[name="app-language"]');
    langRadios.forEach(radio => {
      if (radio.value === savedLang) radio.checked = true;

      radio.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
        this.showToast(`Idioma alterado para: ${e.target.value === 'pt-BR' ? 'Português (Brasil)' : e.target.value}`, 'success');
      });
    });
  },

  setLanguage(langCode) {
    this.currentLang = langCode;
    localStorage.setItem('sdfinanceiro_lang', langCode);

    const dict = this.i18n[langCode] || this.i18n['pt-BR'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update active style on language card
    document.querySelectorAll('.language-card').forEach(card => {
      const isCurrent = card.getAttribute('data-lang') === langCode;
      card.classList.toggle('active', isCurrent);
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = isCurrent;
    });
  },

  bindNavigation() {
    // Sidebar Navigation
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        this.switchTab(tab);
        document.getElementById('sidebar')?.classList.remove('open');
      });
    });

    // Home Menu Navigation (Menu da Imagem 1 com design PRO da Imagem 2)
    const homeItems = document.querySelectorAll('.home-menu-card-pro .home-menu-item-pro[data-tab]');
    homeItems.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    const homeUsersBtn = document.getElementById('btn-home-users');
    if (homeUsersBtn) {
      homeUsersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof Users !== 'undefined' && Users.openModal) {
          Users.openModal('list');
        }
      });
    }

    // Botão Voltar ao Menu Principal
    const backToHomeBtn = document.getElementById('btn-back-to-home');
    if (backToHomeBtn) {
      backToHomeBtn.addEventListener('click', () => {
        this.switchTab('home');
      });
    }

    this.setupBadgesObserver();

    // Sidebar settings button
    const sidebarSettingsBtn = document.getElementById('btn-sidebar-settings');
    if (sidebarSettingsBtn) {
      sidebarSettingsBtn.addEventListener('click', () => {
        document.getElementById('modal-settings')?.classList.add('active');
        document.getElementById('sidebar')?.classList.remove('open');
      });
    }

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('btn-toggle-sidebar');
    const closeBtn = document.getElementById('btn-close-sidebar');
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sidebar?.classList.add('open');
        backdrop?.classList.add('active');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        backdrop?.classList.remove('active');
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        sidebar?.classList.remove('open');
        backdrop?.classList.remove('active');
      });
    }
  },

  syncHomeBadges() {
    const pairs = [
      ['badge-accounts-count', 'home-badge-accounts'],
      ['badge-bills-count', 'home-badge-bills'],
      ['badge-pending-checks', 'home-badge-checks'],
      ['badge-agenda-today', 'home-badge-agenda']
    ];
    pairs.forEach(([sourceId, targetId]) => {
      const src = document.getElementById(sourceId);
      const tgt = document.getElementById(targetId);
      if (src && tgt) {
        tgt.textContent = src.textContent;
      }
    });
  },

  syncQuickNavBadges() {
    this.syncHomeBadges();
  },

  setupBadgesObserver() {
    this.syncHomeBadges();
    const sourceIds = ['badge-accounts-count', 'badge-bills-count', 'badge-pending-checks', 'badge-agenda-today'];
    sourceIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && window.MutationObserver) {
        const observer = new MutationObserver(() => {
          this.syncHomeBadges();
        });
        observer.observe(el, { childList: true, characterData: true, subtree: true });
      }
    });
  },

  switchTab(tabId) {
    if (tabId === 'home') tabId = 'comparativo';
    this.currentTab = tabId;

    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-backdrop')?.classList.remove('active');

    document.body.classList.remove('home-menu-active');

    // Mostra/oculta subtoolbar de período dependendo da aba
    const subtoolbar = document.getElementById('main-pro-subtoolbar');
    if (subtoolbar) {
      subtoolbar.style.display = tabId === 'comparativo' ? 'none' : 'flex';
    }

    // Update views
    document.querySelectorAll('.tab-view').forEach(view => {
      if (view.id === `view-${tabId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Update sidebar nav buttons
    document.querySelectorAll('.sidebar-nav .nav-item[data-tab]').forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update category pills in Image 2 header
    document.querySelectorAll('#pro-category-pills .cat-pill').forEach(pill => {
      if (pill.dataset.tab === tabId) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    // Update active dropdown item
    document.querySelectorAll('#menu-sub-nav-dropdown .dropdown-item').forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update Active Pill in Sub-header
    const textActivePill = document.getElementById('text-active-pill');
    const iconActivePill = document.getElementById('icon-active-pill');

    const pillMeta = {
      comparativo: { label: 'Comparativo (2)', icon: 'bar-chart-2' },
      dashboard: { label: 'Dashboard Geral', icon: 'layout-dashboard' },
      accounts: { label: 'Cartões & Contas', icon: 'credit-card' },
      bills: { label: 'Contas Fixas', icon: 'receipt' },
      transactions: { label: 'Lançamentos', icon: 'arrow-left-right' },
      checks: { label: 'Gestão de Cheques', icon: 'scroll-text' },
      agenda: { label: 'Agenda & Lembretes', icon: 'calendar-clock' },
      reports: { label: 'Relatórios & Gráficos', icon: 'pie-chart' }
    };

    const meta = pillMeta[tabId] || { label: 'Comparativo (2)', icon: 'bar-chart-2' };
    if (textActivePill) textActivePill.textContent = meta.label;
    if (iconActivePill) iconActivePill.setAttribute('data-lucide', meta.icon);

    // Update header title & subtitle if elements exist
    const titleEl = document.getElementById('current-page-title');
    const subEl = document.getElementById('current-page-subtitle');
    if (titleEl) titleEl.textContent = meta.label;

    // Trigger charts resize/render if switching to reports or dashboard
    if (tabId === 'dashboard' || tabId === 'reports') {
      setTimeout(() => {
        Charts.renderAll();
      }, 100);
    }

    // Trigger comparativo render if switching to comparativo
    if (tabId === 'comparativo' && typeof Comparativo !== 'undefined') {
      Comparativo.render();
    }

    this.updateMiniKpis();
    lucide.createIcons();
  },

  updateMiniKpis() {
    const kpi1Title = document.querySelector('.mini-kpi-card:nth-child(1) .mini-kpi-title');
    const kpi1Val = document.getElementById('mini-kpi-prod-count');
    const kpi2Title = document.querySelector('.mini-kpi-card:nth-child(2) .mini-kpi-title');
    const kpi2Val = document.getElementById('mini-kpi-savings');
    const kpi3Title = document.querySelector('.mini-kpi-card:nth-child(3) .mini-kpi-title');
    const kpi3Val = document.getElementById('mini-kpi-best-supplier');

    if (this.currentTab === 'comparativo') {
      const items = typeof Comparativo !== 'undefined' ? Comparativo.getItems() : [];
      if (kpi1Title) kpi1Title.textContent = 'PROD...';
      if (kpi1Val) kpi1Val.textContent = items.length;

      if (kpi2Title) kpi2Title.textContent = 'ECON...';
      if (kpi2Val) kpi2Val.textContent = 'R$ 5...';

      if (kpi3Title) kpi3Title.textContent = 'MAIS ...';
      if (kpi3Val) kpi3Val.textContent = 'ITAI...';
    } else {
      const accounts = Storage.getAccounts();
      const transactions = Storage.getTransactions();
      const periodTransactions = transactions.filter(t => this.isDateInSelectedPeriod(t.date));

      const available = accounts.filter(a => a.type !== 'credit').reduce((s, a) => s + (a.balance || 0), 0);
      const income = periodTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = periodTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      if (kpi1Title) kpi1Title.textContent = 'SALDO';
      if (kpi1Val) kpi1Val.textContent = `R$ ${Math.round(available)}`;

      if (kpi2Title) kpi2Title.textContent = 'RECEITAS';
      if (kpi2Val) kpi2Val.textContent = `R$ ${Math.round(income)}`;

      if (kpi3Title) kpi3Title.textContent = 'DESPESAS';
      if (kpi3Val) kpi3Val.textContent = `R$ ${Math.round(expense)}`;
    }
  },

  bindImage2Header() {
    // 1. Botão Sair / Bloquear
    const topLogoutBtn = document.getElementById('btn-top-logout');
    if (topLogoutBtn) {
      topLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.lockSystem();
      });
    }

    // 2. Pílula de Usuário (abre modal de gestão de usuários)
    const topUserPill = document.getElementById('btn-top-user-profile');
    if (topUserPill) {
      topUserPill.addEventListener('click', () => {
        if (typeof Users !== 'undefined') Users.openModal('list');
      });
    }

    // 3. Dropdown do Módulo Ativo
    const navPill = document.getElementById('btn-nav-active-pill');
    const navDropdown = document.getElementById('menu-sub-nav-dropdown');
    if (navPill && navDropdown) {
      navPill.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navDropdown.style.display === 'block';
        this.closeHeaderDropdowns();
        navDropdown.style.display = isOpen ? 'none' : 'block';
      });

      navDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const tab = item.dataset.tab;
          this.switchTab(tab);
          navDropdown.style.display = 'none';
        });
      });
    }

    // 4. Dropdown do Seletor de Contas / Projeto
    const accPill = document.getElementById('btn-top-account-selector');
    const accDropdown = document.getElementById('menu-top-accounts-dropdown');
    const accText = document.getElementById('text-current-account-filter');

    if (accPill && accDropdown) {
      accPill.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = accDropdown.style.display === 'block';
        this.closeHeaderDropdowns();
        accDropdown.style.display = isOpen ? 'none' : 'block';
      });

      accDropdown.querySelectorAll('.account-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          accDropdown.querySelectorAll('.account-dropdown-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          if (accText) accText.textContent = item.textContent.trim().toUpperCase();
          accDropdown.style.display = 'none';
          this.showToast(`Contexto: ${item.textContent.trim()}`, 'info');
        });
      });
    }

    // 5. Fechar dropdowns ao clicar fora
    document.addEventListener('click', () => {
      this.closeHeaderDropdowns();
    });

    // 6. Abas de Categoria em Pílula
    const catPills = document.querySelectorAll('#pro-category-pills .cat-pill');
    catPills.forEach(pill => {
      pill.addEventListener('click', () => {
        catPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const tab = pill.dataset.tab || 'comparativo';
        const cat = pill.dataset.cat;
        this.switchTab(tab);
        if (tab === 'comparativo' && typeof Comparativo !== 'undefined') {
          Comparativo.activeCategory = cat || 'Todos';
          Comparativo.render();
        }
      });
    });

    // 7. Barra de Busca em Pílula
    const searchInput = document.getElementById('input-global-pro-search');
    const clearBtn = document.getElementById('btn-clear-pro-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (clearBtn) clearBtn.style.display = val ? 'inline-flex' : 'none';

        if (this.currentTab === 'comparativo' && typeof Comparativo !== 'undefined') {
          Comparativo.setSearch(val);
        } else if (this.currentTab === 'transactions') {
          const tableInput = document.getElementById('input-search-transactions');
          if (tableInput) {
            tableInput.value = val;
            tableInput.dispatchEvent(new Event('input'));
          }
        }
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        if (typeof Comparativo !== 'undefined') Comparativo.setSearch('');
      });
    }

    // 8. Chips de Fornecedores / Contas
    const chips = document.querySelectorAll('#top-quick-chips .chip-store');
    chips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        if (e.target.classList.contains('chip-close')) {
          e.stopPropagation();
          chip.classList.toggle('active');
        } else {
          chip.classList.toggle('active');
        }
        const chipName = chip.querySelector('span')?.textContent || '';
        if (typeof Comparativo !== 'undefined') {
          Comparativo.setSearch(chip.classList.contains('active') ? chipName : '');
        }
      });
    });
  },

  closeHeaderDropdowns() {
    const navDropdown = document.getElementById('menu-sub-nav-dropdown');
    const accDropdown = document.getElementById('menu-top-accounts-dropdown');
    if (navDropdown) navDropdown.style.display = 'none';
    if (accDropdown) accDropdown.style.display = 'none';
  },

  bindModals() {
    // Close modal on click of close button or clicking overlay outside card
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModals();
        }
      });
    });

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeModals();
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModals();
      }
    });
  },

  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.classList.remove('active');
    });
  },

  /* ==========================================================================
     ADVANCED PERIOD SELECTOR & DATE SEARCH (DIA, SEMANA, MÊS, ANO, BUSCA)
     ========================================================================== */
  bindPeriodSelector() {
    const periodSelect = document.getElementById('select-global-period');
    const pills = document.querySelectorAll('.period-pill');
    const wrapCustom = document.getElementById('wrap-custom-date-inputs');
    const boxSingleDate = document.getElementById('box-single-date');
    const boxSingleMonth = document.getElementById('box-single-month');
    const boxDateRange = document.getElementById('box-date-range');
    const applyBtn = document.getElementById('btn-apply-custom-date');

    const inputSingleDate = document.getElementById('input-filter-single-date');
    const inputSingleMonth = document.getElementById('input-filter-single-month');
    const inputFrom = document.getElementById('input-filter-date-from');
    const inputTo = document.getElementById('input-filter-date-to');

    // Default dates for custom pickers
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const monthISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    if (inputSingleDate) inputSingleDate.value = todayISO;
    if (inputSingleMonth) inputSingleMonth.value = monthISO;
    if (inputFrom) inputFrom.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    if (inputTo) inputTo.value = todayISO;

    // 1. Quick Pill Buttons (Dia, Semana, Mês, Ano)
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const period = pill.dataset.period;
        this.currentPeriod = period;
        if (periodSelect) periodSelect.value = period;

        // Hide custom date picker if switching to preset
        if (wrapCustom) wrapCustom.style.display = 'none';

        this.refreshAll();
      });
    });

    // 2. Global Dropdown Select
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.currentPeriod = val;

        // Sync pill buttons
        pills.forEach(p => {
          p.classList.toggle('active', p.dataset.period === val);
        });

        // Handle custom date pickers
        if (val === 'custom_date') {
          wrapCustom.style.display = 'flex';
          boxSingleDate.style.display = 'flex';
          boxSingleMonth.style.display = 'none';
          boxDateRange.style.display = 'none';
        } else if (val === 'custom_month') {
          wrapCustom.style.display = 'flex';
          boxSingleDate.style.display = 'none';
          boxSingleMonth.style.display = 'flex';
          boxDateRange.style.display = 'none';
        } else if (val === 'custom_range') {
          wrapCustom.style.display = 'flex';
          boxSingleDate.style.display = 'none';
          boxSingleMonth.style.display = 'none';
          boxDateRange.style.display = 'flex';
        } else {
          if (wrapCustom) wrapCustom.style.display = 'none';
          this.refreshAll();
        }
      });
    }

    // 3. Custom Date Apply Button & Instant Inputs
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        this.refreshAll();
        this.showToast('Filtro por data aplicado!', 'success');
      });
    }

    [inputSingleDate, inputSingleMonth, inputFrom, inputTo].forEach(input => {
      if (input) {
        input.addEventListener('change', () => {
          this.refreshAll();
        });
      }
    });
  },

  // Evaluates whether a date (YYYY-MM-DD) matches the active period filter
  isDateInSelectedPeriod(dateStr) {
    if (!dateStr) return false;
    if (this.currentPeriod === 'all') return true;

    const [y, m, d] = dateStr.split('-').map(Number);
    const txDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayISO = now.toISOString().split('T')[0];

    switch (this.currentPeriod) {
      case 'today':
        return dateStr === todayISO;

      case 'yesterday': {
        const yest = new Date();
        yest.setDate(now.getDate() - 1);
        return dateStr === yest.toISOString().split('T')[0];
      }

      case 'this_week': {
        // Current week Monday to Sunday
        const dayOfWeek = now.getDay();
        const diffToMon = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(now.getFullYear(), now.getMonth(), diffToMon);
        const sunday = new Date(now.getFullYear(), now.getMonth(), diffToMon + 6);

        const monISO = monday.toISOString().split('T')[0];
        const sunISO = sunday.toISOString().split('T')[0];
        return dateStr >= monISO && dateStr <= sunISO;
      }

      case 'last_7_days': {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        const d7ISO = d7.toISOString().split('T')[0];
        return dateStr >= d7ISO && dateStr <= todayISO;
      }

      case 'last_week': {
        const dayOfWeek = now.getDay();
        const diffToLastMon = now.getDate() - dayOfWeek - 6 + (dayOfWeek === 0 ? -6 : 1);
        const lastMon = new Date(now.getFullYear(), now.getMonth(), diffToLastMon);
        const lastSun = new Date(now.getFullYear(), now.getMonth(), diffToLastMon + 6);
        return dateStr >= lastMon.toISOString().split('T')[0] && dateStr <= lastSun.toISOString().split('T')[0];
      }

      case 'current_month':
        return y === now.getFullYear() && (m - 1) === now.getMonth();

      case 'last_month': {
        const lastMDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return y === lastMDate.getFullYear() && (m - 1) === lastMDate.getMonth();
      }

      case 'next_month': {
        const nextMDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return y === nextMDate.getFullYear() && (m - 1) === nextMDate.getMonth();
      }

      case 'last_30_days': {
        const d30 = new Date();
        d30.setDate(d30.getDate() - 30);
        return dateStr >= d30.toISOString().split('T')[0] && dateStr <= todayISO;
      }

      case 'current_year':
        return y === now.getFullYear();

      case 'last_year':
        return y === (now.getFullYear() - 1);

      case 'custom_date': {
        const single = document.getElementById('input-filter-single-date')?.value;
        return single ? dateStr === single : true;
      }

      case 'custom_month': {
        const singleMonth = document.getElementById('input-filter-single-month')?.value; // "YYYY-MM"
        if (!singleMonth) return true;
        const [targetY, targetM] = singleMonth.split('-').map(Number);
        return y === targetY && m === targetM;
      }

      case 'custom_range': {
        const from = document.getElementById('input-filter-date-from')?.value;
        const to = document.getElementById('input-filter-date-to')?.value;
        let matchFrom = from ? dateStr >= from : true;
        let matchTo = to ? dateStr <= to : true;
        return matchFrom && matchTo;
      }

      default:
        return true;
    }
  },

  getPeriodLabel() {
    switch (this.currentPeriod) {
      case 'today': return 'Hoje';
      case 'yesterday': return 'Ontem';
      case 'this_week': return 'Esta Semana';
      case 'last_7_days': return 'Últimos 7 Dias';
      case 'last_week': return 'Semana Anterior';
      case 'current_month': return 'Mês Atual';
      case 'last_month': return 'Mês Anterior';
      case 'next_month': return 'Próximo Mês';
      case 'last_30_days': return 'Últimos 30 Dias';
      case 'current_year': return 'Ano Vigente (2026)';
      case 'last_year': return 'Ano Anterior (2025)';
      case 'custom_date': return 'Dia Selecionado';
      case 'custom_month': return 'Mês Selecionado';
      case 'custom_range': return 'Período Personalizado';
      default: return 'Todo o Período';
    }
  },

  bindSettings() {
    const settingsBtn = document.getElementById('btn-open-settings');
    const settingsModal = document.getElementById('modal-settings');
    const exportBtn = document.getElementById('btn-export-backup');
    const importInput = document.getElementById('input-import-backup');
    const resetBtn = document.getElementById('btn-reset-demo');
    const clearBtn = document.getElementById('btn-clear-all');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        settingsModal?.classList.add('active');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        Storage.exportJSON();
        this.showToast('Backup JSON exportado com sucesso!', 'success');
      });
    }

    if (importInput) {
      importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Segurança: validação rigorosa de extensão e tamanho máximo (5MB)
        if (!file.name.toLowerCase().endsWith('.json')) {
          this.showToast('Segurança: Apenas arquivos com formato .json são permitidos.', 'error');
          importInput.value = '';
          return;
        }

        const MAX_BYTES = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_BYTES) {
          this.showToast('Segurança: O arquivo excede o limite máximo permitido de 5MB.', 'error');
          importInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const success = Storage.importJSON(event.target.result);
          if (success) {
            this.showToast('Dados restaurados com sucesso!', 'success');
            this.closeModals();
            this.refreshAll();
          } else {
            this.showToast('Arquivo de backup inválido ou com formato corrompido.', 'error');
          }
          importInput.value = '';
        };
        reader.onerror = () => {
          this.showToast('Erro de leitura no arquivo enviado.', 'error');
          importInput.value = '';
        };
        reader.readAsText(file);
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Deseja recarregar os dados de exemplo padrão?')) {
          Storage.resetDemoData();
          this.showToast('Dados de demonstração restaurados!', 'success');
          this.closeModals();
          this.refreshAll();
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('ATENÇÃO: Deseja apagar TODOS os dados do sistema?')) {
          Storage.clearAll();
          this.showToast('Todos os dados foram apagados.', 'info');
          this.closeModals();
          this.refreshAll();
        }
      });
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';

    toast.innerHTML = `
      <i data-lucide="${iconName}" style="width: 18px; height: 18px;"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Calculate & Refresh all Dashboard KPIs & Components
  refreshAll() {
    Accounts.recalculateBalances();
    const accounts = Storage.getAccounts();
    const transactions = Storage.getTransactions();
    const checks = Storage.getChecks();

    const periodLabel = this.getPeriodLabel();

    // 1. Saldo Disponível em Contas e Dinheiro
    const availableBalance = accounts
      .filter(a => a.type !== 'credit')
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    // 2. Limite Utilizado e Limite Total em Cartões
    const creditCards = accounts.filter(a => a.type === 'credit');
    const totalCreditLimit = creditCards.reduce((sum, a) => sum + (a.limit || 0), 0);
    const totalUsedCredit = creditCards.reduce((sum, a) => sum + (a.usedLimit || 0), 0);
    const creditUtilizationPct = totalCreditLimit > 0 ? Math.round((totalUsedCredit / totalCreditLimit) * 100) : 0;

    // 3. Receitas e Despesas Filtradas pelo Período Ativo (Dia, Semana, Mês, Ano, Custom)
    const periodTransactions = transactions.filter(t => this.isDateInSelectedPeriod(t.date));

    const periodIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const periodExpenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const periodNet = periodIncome - periodExpenses;

    // 4. Update Dashboard KPI DOM Elements
    const elAvailable = document.getElementById('kpi-available-balance');
    const elUsedCredit = document.getElementById('kpi-used-credit');
    const elLimitInfo = document.getElementById('kpi-credit-limit-info');
    const elIncome = document.getElementById('kpi-month-income');
    const elExpenses = document.getElementById('kpi-month-expenses');
    const elDifference = document.getElementById('kpi-balance-difference');

    if (elAvailable) elAvailable.textContent = `R$ ${availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elUsedCredit) elUsedCredit.textContent = `R$ ${totalUsedCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elLimitInfo) elLimitInfo.textContent = `de R$ ${totalCreditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} total (${creditUtilizationPct}%)`;
    
    if (elIncome) {
      elIncome.textContent = `R$ ${periodIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const label = elIncome.previousElementSibling;
      if (label) label.textContent = `Receitas (${periodLabel})`;
    }
    
    if (elExpenses) {
      elExpenses.textContent = `R$ ${periodExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      const label = elExpenses.previousElementSibling;
      if (label) label.textContent = `Total de Gastos (${periodLabel})`;
    }
    
    if (elDifference) {
      elDifference.textContent = `Balanço Líquido: ${periodNet >= 0 ? '+' : ''} R$ ${periodNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      elDifference.className = `kpi-meta ${periodNet >= 0 ? 'positive' : 'negative'}`;
    }

    // 5. Secondary Payment Ribbon
    const debitBalance = accounts.filter(a => a.type === 'debit' || a.type === 'savings').reduce((s, a) => s + (a.balance || 0), 0);
    const cashBalance = accounts.filter(a => a.type === 'cash').reduce((s, a) => s + (a.balance || 0), 0);
    const pendingChecksAmount = checks.filter(c => c.type === 'issued' && c.status === 'pending').reduce((s, c) => s + c.amount, 0);

    const elPtCredit = document.getElementById('pt-val-credit');
    const elPtDebit = document.getElementById('pt-val-debit');
    const elPtChecks = document.getElementById('pt-val-checks');
    const elPtCash = document.getElementById('pt-val-cash');

    if (elPtCredit) elPtCredit.textContent = `R$ ${totalUsedCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elPtDebit) elPtDebit.textContent = `R$ ${debitBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elPtChecks) elPtChecks.textContent = `R$ ${pendingChecksAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elPtCash) elPtCash.textContent = `R$ ${cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    // 6. Sidebar Quick Balance
    const elSidebarBalance = document.getElementById('sidebar-quick-balance');
    const elSidebarCredit = document.getElementById('sidebar-credit-utilization');
    if (elSidebarBalance) elSidebarBalance.textContent = `R$ ${availableBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (elSidebarCredit) elSidebarCredit.textContent = `Uso de limite: ${creditUtilizationPct}%`;

    // 7. Refresh modules views
    Accounts.render();
    Bills.render();
    Transactions.render();
    Checks.render();
    Agenda.renderAppointments();
    Agenda.renderCalendar();
    Charts.renderAll();
    Users.updateSidebarProfile();
    lucide.createIcons();
  }
};

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
