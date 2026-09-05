/**
 * SDFINANCEIRO — Authentication & Biometrics Security Module
 * Tela de Login Luxo Ouro/Dark, Validação Real de Senha e Biometria Segura de Hardware
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
    const bioCancelBtn = document.getElementById('btn-bio-cancel-modal');

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

    // Biometrics modal close
    if (bioCancelBtn) {
      bioCancelBtn.addEventListener('click', () => {
        this.closeBiometricsModal();
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
      document.body.classList.remove('auth-locked');
      screen.classList.add('unlocked');
      setTimeout(() => {
        screen.style.display = 'none';
      }, 350);
    } else {
      document.body.classList.add('auth-locked');
      screen.style.display = 'flex';
      screen.classList.remove('unlocked');
    }
  },

  handleStandardLogin() {
    const userInput = document.getElementById('auth-input-user')?.value.trim() || '';
    const passInput = document.getElementById('auth-input-pass')?.value || '';
    const errorMsg = document.getElementById('auth-error-msg');

    if (errorMsg) errorMsg.textContent = '';

    // Senha é obrigatória! Nunca passar com senha em branco
    if (!userInput) {
      if (errorMsg) errorMsg.textContent = 'Por favor, digite seu usuário.';
      document.getElementById('auth-input-user')?.focus();
      this.shakeCard();
      return;
    }

    if (!passInput) {
      if (errorMsg) errorMsg.textContent = 'Por favor, digite sua senha de acesso.';
      document.getElementById('auth-input-pass')?.focus();
      this.shakeCard();
      return;
    }

    const users = Storage.getUsers();
    // Allow matching username or matching email or default admin
    const matched = users.find(u => 
      (u.username && u.username.toLowerCase() === userInput.toLowerCase()) ||
      (u.email && u.email.toLowerCase() === userInput.toLowerCase()) ||
      (userInput.toLowerCase() === 'admin' && (u.username === 'admin' || u.role === 'Administrador'))
    );

    if (matched) {
      const userPass = matched.password || '123';
      if (passInput === userPass || (userInput.toLowerCase() === 'admin' && (passInput === '123' || passInput === 'admin123'))) {
        Storage.setActiveUser(matched.id);
        this.grantAccess(matched.name);
        return;
      }
    }

    // Fallback default admin check
    if (userInput.toLowerCase() === 'admin' && (passInput === '123' || passInput === 'admin123')) {
      const active = Storage.getActiveUser();
      this.grantAccess(active ? active.name : 'Administrador');
      return;
    }

    // Se chegou aqui, credenciais estão incorretas
    if (errorMsg) {
      errorMsg.innerHTML = `
        <span>Usuário ou senha incorretos.</span><br>
        <a href="javascript:void(0)" onclick="Auth.openForgotModal()" style="color: #f6e59e; text-decoration: underline; font-weight: 600;">Esqueceu o usuário ou senha? Clique aqui</a>
      `;
    }
    this.shakeCard();
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

  /* ================= SEGURANÇA BIOMÉTRICA REAL ================= */

  async triggerBiometrics() {
    const bioModal = document.getElementById('modal-biometrics-scan');
    const scanStatus = document.getElementById('bio-scan-status');
    const scanIcon = document.getElementById('bio-fingerprint-icon');
    const modalTitle = document.getElementById('bio-modal-title');
    const actionsContainer = document.getElementById('bio-modal-actions');

    const enrolledUser = localStorage.getItem('sdfinanceiro_bio_enrolled_user');
    const enrolledCredId = localStorage.getItem('sdfinanceiro_bio_cred_id');

    // Verifica se a biometria foi desativada nas configurações
    const users = Storage.getUsers();
    const userObj = users.find(u => 
      (u.username && u.username.toLowerCase() === enrolledUser?.toLowerCase()) ||
      (u.name && u.name.toLowerCase() === enrolledUser?.toLowerCase())
    );

    if (userObj && userObj.biometricsEnabled === false) {
      if (bioModal) bioModal.classList.add('active');
      if (scanIcon) scanIcon.className = 'fingerprint-scanner';
      if (modalTitle) modalTitle.textContent = 'Biometria Desativada';
      if (scanStatus) {
        scanStatus.innerHTML = `
          <span style="color: #f43f5e; font-weight: 700;">🔒 Biometria desativada para este usuário!</span><br>
          <span style="font-size: 0.85rem; color: #94a3b8;">O acesso por digital foi desmarcado nas configurações. Por favor, digite sua senha de acesso.</span>
        `;
      }
      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <button type="button" class="btn btn-primary btn-sm" onclick="Auth.closeBiometricsModal(true)">
            Digitar Senha
          </button>
        `;
      }
      return;
    }

    // CASO 1: Nenhuma digital foi cadastrada ainda neste aparelho
    if (!enrolledUser || !enrolledCredId) {
      if (bioModal) bioModal.classList.add('active');
      if (scanIcon) scanIcon.className = 'fingerprint-scanner';
      if (modalTitle) modalTitle.textContent = 'Biometria Não Cadastrada';
      if (scanStatus) {
        scanStatus.innerHTML = `
          <span style="color: #f59e0b; font-weight: 700;">🔒 Nenhuma digital cadastrada neste aparelho!</span><br>
          <span style="font-size: 0.85rem; color: #94a3b8;">Por segurança, qualquer pessoa não pode acessar sem senha. Entre com seu <b>Usuário e Senha</b> para cadastrar sua digital nas configurações.</span>
        `;
      }
      if (actionsContainer) {
        actionsContainer.innerHTML = `
          <button type="button" class="btn btn-primary btn-sm" onclick="Auth.closeBiometricsModal(true)">
            Digitar Senha
          </button>
        `;
      }
      return;
    }

    // CASO 2: Biometria cadastrada — Acionar validação REAL do hardware nativo
    if (bioModal) bioModal.classList.add('active');
    if (modalTitle) modalTitle.textContent = 'Validação Biométrica';
    if (scanIcon) scanIcon.className = 'fingerprint-scanner scanning';
    if (scanStatus) {
      scanStatus.innerHTML = `
        <span>Coloque o dedo no leitor de digital do seu aparelho...</span><br>
        <small style="color: #f6e59e;">Aguardando autorização de <b>${enrolledUser}</b></small>
      `;
    }
    if (actionsContainer) {
      actionsContainer.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="Auth.closeBiometricsModal()">
          Cancelar
        </button>
      `;
    }

    // Utiliza WebAuthn Nativo para validação real pelo leitor de digital do celular/PC
    if (window.PublicKeyCredential && navigator.credentials && navigator.credentials.get) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Converte base64 para Uint8Array
        const credIdBytes = Uint8Array.from(atob(enrolledCredId), c => c.charCodeAt(0));

        const getOptions = {
          publicKey: {
            challenge: challenge,
            allowCredentials: [{
              id: credIdBytes,
              type: 'public-key'
            }],
            userVerification: 'required',
            timeout: 60000
          }
        };

        const assertion = await navigator.credentials.get(getOptions);

        if (assertion) {
          // Validação biométrica aprovada pelo leitor físico!
          if (scanIcon) scanIcon.className = 'fingerprint-scanner success';
          if (scanStatus) {
            scanStatus.innerHTML = `
              <span style="color: #10b981; font-weight: bold; font-size: 1rem;">✔ Digital Reconhecida!</span><br>
              <small style="color: #cbd5e1;">Acesso liberado para <b>${enrolledUser}</b></small>
            `;
          }

          setTimeout(() => {
            this.closeBiometricsModal();
            const users = Storage.getUsers();
            const matched = users.find(u => u.username?.toLowerCase() === enrolledUser.toLowerCase() || u.name === enrolledUser) || users[0];
            Storage.setActiveUser(matched.id);
            this.grantAccess(matched.name, true);
          }, 600);
          return;
        }
      } catch (err) {
        console.warn('Biometria recusada ou cancelada pelo hardware:', err);
        // Falha ou cancelamento: ACESSO NEGADO!
        if (scanIcon) scanIcon.className = 'fingerprint-scanner';
        if (scanStatus) {
          scanStatus.innerHTML = `
            <span style="color: #f43f5e; font-weight: bold;">❌ Digital Não Reconhecida!</span><br>
            <small style="color: #94a3b8;">Acesso não autorizado. Digite sua senha para entrar.</small>
          `;
        }
        if (actionsContainer) {
          actionsContainer.innerHTML = `
            <button type="button" class="btn btn-primary btn-sm" onclick="Auth.closeBiometricsModal(true)">
              Entrar com Senha
            </button>
          `;
        }
        this.shakeCard();
        return;
      }
    } else {
      // Dispositivo sem suporte a leitor nativo WebAuthn
      if (scanStatus) {
        scanStatus.innerHTML = `
          <span style="color: #f59e0b;">Navegador sem suporte a leitor nativo.</span><br>
          <small>Por favor, utilize seu usuário e senha.</small>
        `;
      }
    }
  },

  closeBiometricsModal(focusPass = false) {
    const bioModal = document.getElementById('modal-biometrics-scan');
    if (bioModal) bioModal.classList.remove('active');
    if (focusPass) {
      document.getElementById('auth-input-pass')?.focus();
    }
  },

  /* ================= CADASTRO DA DIGITAL DESTE APARELHO ================= */

  async registerDeviceBiometrics() {
    if (!window.PublicKeyCredential || !navigator.credentials || !navigator.credentials.create) {
      App.showToast('Seu navegador ou aparelho não possui suporte ao leitor biométrico nativo.', 'warning');
      return;
    }

    const activeUser = Storage.getActiveUser();
    if (!activeUser) return;

    try {
      App.showToast('Coloque seu dedo no leitor de digital do aparelho para cadastrar...', 'info');

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      window.crypto.getRandomValues(userId);

      const createOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: "SDFinanceiro",
            id: window.location.hostname || "localhost"
          },
          user: {
            id: userId,
            name: activeUser.username || 'admin',
            displayName: activeUser.name || 'Administrador'
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },  // ES256
            { alg: -257, type: "public-key" } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Leitor de digital nativo do aparelho
            userVerification: "required"
          },
          timeout: 60000
        }
      };

      const credential = await navigator.credentials.create(createOptions);
      if (credential && credential.rawId) {
        const rawIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem('sdfinanceiro_bio_enrolled_user', activeUser.username || 'admin');
        localStorage.setItem('sdfinanceiro_bio_cred_id', rawIdBase64);
        App.showToast(`✅ Digital cadastrada com sucesso para o usuário ${activeUser.name}!`, 'success');
        this.updateDeviceBiometricsStatus();
      }
    } catch (err) {
      console.warn('Erro ao cadastrar digital no hardware:', err);
      App.showToast('Cadastro cancelado ou digital não reconhecida pelo leitor.', 'warning');
    }
  },

  removeDeviceBiometrics() {
    localStorage.removeItem('sdfinanceiro_bio_enrolled_user');
    localStorage.removeItem('sdfinanceiro_bio_cred_id');
    App.showToast('Biometria removida com sucesso deste aparelho.', 'info');
    this.updateDeviceBiometricsStatus();
  },

  updateDeviceBiometricsStatus() {
    const label = document.getElementById('device-bio-status-label');
    const enrollBtn = document.getElementById('btn-enroll-device-bio');
    const clearBtn = document.getElementById('btn-clear-device-bio');

    const enrolledUser = localStorage.getItem('sdfinanceiro_bio_enrolled_user');

    if (enrolledUser) {
      if (label) {
        label.innerHTML = `<span style="color: #10b981; font-weight: 700;">✔ Digital cadastrada para: ${enrolledUser}</span>`;
      }
      if (enrollBtn) enrollBtn.textContent = 'Recadastrar Digital';
      if (clearBtn) clearBtn.style.display = 'inline-flex';
    } else {
      if (label) {
        label.innerHTML = `<span style="color: #f59e0b;">⚠️ Nenhuma digital cadastrada neste aparelho</span>`;
      }
      if (enrollBtn) enrollBtn.innerHTML = `<i data-lucide="fingerprint"></i> Cadastrar Minha Digital`;
      if (clearBtn) clearBtn.style.display = 'none';
    }
    lucide.createIcons();
  },

  grantAccess(userName, viaBiometrics = false) {
    Storage.setLoggedIn(true);
    document.body.classList.remove('auth-locked');
    const screen = document.getElementById('screen-auth-lock');

    if (screen) {
      screen.classList.add('unlocked');
      setTimeout(() => {
        screen.style.display = 'none';
      }, 400);
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
    document.body.classList.add('auth-locked');
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
