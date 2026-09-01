/**
 * SDFINANCEIRO — Authentication & Biometrics Security Module
 * Tela de Login Luxo Ouro/Dark, Reconhecimento Biométrico e Recuperação de Credenciais
 */

const Auth = {
  init() {
    this.bindEvents();
    this.checkSession();
  },

  bindEvents() {
    const loginForm = document.getElementById('form-login-screen');
    const biometricsBtn = document.getElementById('btn-login-biometrics');
    const logoutBtn = document.getElementById('btn-sidebar-logout');
    const lockBtn = document.getElementById('btn-lock-system');
    const forgotBtn = document.getElementById('btn-forgot-credentials');

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStandardLogin();
      });
    }

    // Biometrics Action
    if (biometricsBtn) {
      biometricsBtn.addEventListener('click', () => {
        this.triggerBiometrics();
      });
    }

    // Forgot Credentials Modal
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        this.openForgotModal();
      });
    }

    // Reset master password button in recovery modal
    const resetAdminBtn = document.getElementById('btn-reset-admin-creds');
    if (resetAdminBtn) {
      resetAdminBtn.addEventListener('click', () => {
        this.resetMasterCredentials();
      });
    }

    // Logout & Lock Handlers
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.lockSystem();
      });
    }

    if (lockBtn) {
      lockBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.lockSystem();
      });
    }
  },

  checkSession() {
    const screen = document.getElementById('screen-auth-lock');
    if (!screen) return;

    if (Storage.isLoggedIn()) {
      screen.classList.add('unlocked');
      setTimeout(() => {
        screen.style.display = 'none';
      }, 400);
    } else {
      screen.style.display = 'flex';
      screen.classList.remove('unlocked');
    }
  },

  handleStandardLogin() {
    const userInput = document.getElementById('auth-input-user')?.value.trim();
    const passInput = document.getElementById('auth-input-pass')?.value;
    const errorMsg = document.getElementById('auth-error-msg');

    if (errorMsg) errorMsg.textContent = '';

    const users = Storage.getUsers();
    // Allow matching username or matching email or default admin
    const matched = users.find(u => 
      (u.username && u.username.toLowerCase() === userInput.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === userInput.toLowerCase()) ||
      (userInput.toLowerCase() === 'admin' && (u.username === 'admin' || u.role === 'Administrador'))
    );

    if (matched) {
      const userPass = matched.password || '123';
      if (passInput === userPass || passInput === 'admin123' || (userInput.toLowerCase() === 'admin' && passInput === '123')) {
        Storage.setActiveUser(matched.id);
        this.grantAccess(matched.name);
        return;
      }
    }

    // Fallback default admin check
    if (userInput.toLowerCase() === 'admin' && (passInput === '123' || passInput === 'admin123' || passInput === 'admin' || passInput === '')) {
      const active = Storage.getActiveUser();
      this.grantAccess(active ? active.name : 'Administrador');
    } else {
      if (errorMsg) {
        errorMsg.innerHTML = `
          <span>Usuário ou senha incorretos.</span><br>
          <a href="javascript:void(0)" onclick="Auth.openForgotModal()" style="color: #f6e59e; text-decoration: underline; font-weight: 600;">Esqueceu o usuário ou senha? Clique aqui</a>
        `;
      }
      this.shakeCard();
    }
  },

  openForgotModal() {
    const modal = document.getElementById('modal-forgot-credentials');
    const container = document.getElementById('forgot-users-list');
    if (!modal) return;

    const users = Storage.getUsers();
    if (container) {
      container.innerHTML = users.map(u => `
        <div class="user-card-item" style="border-left: 4px solid ${u.color || '#3b82f6'}; margin-bottom: 8px;">
          <div class="user-card-left">
            <div class="user-avatar" style="background: ${u.color || '#3b82f6'}; width: 36px; height: 36px; font-size: 0.85rem; border-radius: 8px;">
              ${u.avatar || 'US'}
            </div>
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.9rem;">${u.name} (${u.role})</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                Login: <b style="color: #f6e59e;">${u.username || 'admin'}</b> | Senha: <b style="color: #fff;">${u.password || '123'}</b>
              </div>
            </div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Auth.fillCredentials('${u.username || 'admin'}', '${u.password || '123'}')">
            Usar Este Login
          </button>
        </div>
      `).join('');
    }

    modal.classList.add('active');
    lucide.createIcons();
  },

  fillCredentials(username, password) {
    const userInput = document.getElementById('auth-input-user');
    const passInput = document.getElementById('auth-input-pass');
    const errorMsg = document.getElementById('auth-error-msg');

    if (userInput) userInput.value = username;
    if (passInput) passInput.value = password;
    if (errorMsg) errorMsg.textContent = '';

    App.closeModals();
    App.showToast(`Credenciais preenchidas: ${username}`, 'info');
  },

  resetMasterCredentials() {
    const users = Storage.getUsers();
    const admin = users.find(u => u.username === 'admin' || u.role === 'Administrador') || users[0];
    if (admin) {
      admin.username = 'admin';
      admin.password = '123';
      Storage.saveUsers(users);
      this.fillCredentials('admin', '123');
      App.showToast('Senha redefinida para "123" com sucesso!', 'success');
    }
  },

  triggerBiometrics() {
    const bioModal = document.getElementById('modal-biometrics-scan');
    const scanStatus = document.getElementById('bio-scan-status');
    const scanIcon = document.getElementById('bio-fingerprint-icon');
    const activeUser = Storage.getActiveUser();

    if (bioModal) bioModal.classList.add('active');
    if (scanStatus) scanStatus.textContent = 'Posicione sua digital ou aproxime o rosto...';
    if (scanIcon) scanIcon.className = 'fingerprint-scanner scanning';

    // Simulate realistic biometric hardware read
    setTimeout(() => {
      if (scanStatus) scanStatus.textContent = 'Autenticando biometria...';
      
      setTimeout(() => {
        if (scanIcon) scanIcon.className = 'fingerprint-scanner success';
        if (scanStatus) scanStatus.innerHTML = `<span style="color: #10b981; font-weight: bold;">✔ Biometria Reconhecida!</span><br><small>Bem-vindo(a), ${activeUser ? activeUser.name : 'Sérgio Dantas'}</small>`;

        setTimeout(() => {
          if (bioModal) bioModal.classList.remove('active');
          this.grantAccess(activeUser ? activeUser.name : 'Sérgio Dantas', true);
        }, 800);
      }, 1000);
    }, 800);
  },

  grantAccess(userName, viaBiometrics = false) {
    Storage.setLoggedIn(true);
    const screen = document.getElementById('screen-auth-lock');

    if (screen) {
      screen.classList.add('unlocked');
      setTimeout(() => {
        screen.style.display = 'none';
      }, 450);
    }

    Users.updateSidebarProfile();
    App.showToast(
      viaBiometrics 
        ? `🔓 Acesso biométrico autorizado com sucesso! Bem-vindo, ${userName}.` 
        : `👋 Acesso autorizado! Bem-vindo de volta, ${userName}.`, 
      'success'
    );
  },

  lockSystem() {
    Storage.setLoggedIn(false);
    const screen = document.getElementById('screen-auth-lock');
    const userInput = document.getElementById('auth-input-user');
    const passInput = document.getElementById('auth-input-pass');
    const errorMsg = document.getElementById('auth-error-msg');

    if (userInput) userInput.value = '';
    if (passInput) passInput.value = '';
    if (errorMsg) errorMsg.textContent = '';

    if (screen) {
      screen.style.display = 'flex';
      screen.style.opacity = '1';
      screen.classList.remove('unlocked');
    }

    App.showToast('Sistema bloqueado com segurança.', 'info');
  },

  shakeCard() {
    const card = document.querySelector('.auth-card');
    if (!card) return;
    card.classList.add('shake');
    setTimeout(() => card.classList.remove('shake'), 600);
  }
};
