/**
 * SDFINANCEIRO — Users Management Module
 * Cadastro, visualização detalhada, edição, exclusão e troca de usuários ativos
 */

const Users = {
  activeTab: 'list', // 'list' or 'form'

  init() {
    this.bindEvents();
    this.updateSidebarProfile();
    this.render();
  },

  bindEvents() {
    // Buttons to open User Management Modal
    const btnSidebar = document.getElementById('btn-sidebar-users');
    const btnTrigger = document.getElementById('btn-open-users-trigger');
    const userPanel = document.getElementById('sidebar-user-panel');

    const openModalHandler = (e) => {
      e.stopPropagation();
      this.openModal('list');
    };

    if (btnSidebar) btnSidebar.addEventListener('click', openModalHandler);
    if (btnTrigger) btnTrigger.addEventListener('click', openModalHandler);
    if (userPanel) userPanel.addEventListener('click', openModalHandler);

    // Modal internal tabs
    const tabListBtn = document.getElementById('tab-btn-users-list');
    const tabFormBtn = document.getElementById('tab-btn-users-form');

    if (tabListBtn) {
      tabListBtn.addEventListener('click', () => {
        this.switchModalTab('list');
      });
    }

    if (tabFormBtn) {
      tabFormBtn.addEventListener('click', () => {
        this.resetForm();
        this.switchModalTab('form');
      });
    }

    // Form submit
    const form = document.getElementById('form-user');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveUser();
      });
    }

    // Cancel edit button
    const cancelBtn = document.getElementById('btn-cancel-user-edit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetForm();
        this.switchModalTab('list');
      });
    }

    // Device biometrics buttons
    const enrollBioBtn = document.getElementById('btn-enroll-device-bio');
    const clearBioBtn = document.getElementById('btn-clear-device-bio');

    if (enrollBioBtn) {
      enrollBioBtn.addEventListener('click', () => {
        Auth.registerDeviceBiometrics();
      });
    }

    if (clearBioBtn) {
      clearBioBtn.addEventListener('click', () => {
        Auth.removeDeviceBiometrics();
      });
    }
  },

  openModal(tab = 'list') {
    const modal = document.getElementById('modal-users');
    if (!modal) return;
    this.switchModalTab(tab);
    this.render();
    Auth.updateDeviceBiometricsStatus();
    modal.classList.add('active');
  },

  switchModalTab(tab) {
    this.activeTab = tab;
    const tabListBtn = document.getElementById('tab-btn-users-list');
    const tabFormBtn = document.getElementById('tab-btn-users-form');
    const paneList = document.getElementById('pane-users-list');
    const paneForm = document.getElementById('pane-users-form');

    if (tab === 'list') {
      tabListBtn?.classList.add('active');
      tabFormBtn?.classList.remove('active');
      if (paneList) paneList.style.display = 'block';
      if (paneForm) paneForm.style.display = 'none';
      this.render();
    } else {
      tabListBtn?.classList.remove('active');
      tabFormBtn?.classList.add('active');
      if (paneList) paneList.style.display = 'none';
      if (paneForm) paneForm.style.display = 'block';
    }
  },

  resetForm() {
    const form = document.getElementById('form-user');
    if (form) form.reset();
    document.getElementById('user-edit-id').value = '';
    const title = document.getElementById('form-user-title');
    if (title) title.textContent = 'Cadastrar Novo Usuário';
    const cancelBtn = document.getElementById('btn-cancel-user-edit');
    if (cancelBtn) cancelBtn.style.display = 'none';
    const saveBtn = document.getElementById('btn-save-user');
    if (saveBtn) saveBtn.textContent = 'Salvar Usuário';
  },

  saveUser() {
    const editId = document.getElementById('user-edit-id').value;
    const name = document.getElementById('form-user-name').value.trim();
    const role = document.getElementById('form-user-role').value;
    const email = document.getElementById('form-user-email')?.value.trim() || '';
    const username = document.getElementById('form-user-username')?.value.trim() || name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const password = document.getElementById('form-user-password')?.value.trim() || '123';
    const colorRadio = document.querySelector('input[name="user-color"]:checked');
    const color = colorRadio ? colorRadio.value : '#3b82f6';
    const biometricsEnabled = document.getElementById('form-user-biometrics')?.checked ?? true;

    if (!name) {
      App.showToast('Por favor, informe o nome completo do usuário.', 'error');
      return;
    }

    if (!username) {
      App.showToast('Por favor, informe um nome de usuário (login).', 'error');
      return;
    }

    // Generate Initials Avatar
    const parts = name.split(' ').filter(Boolean);
    const avatar = parts.length > 1 
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() 
      : (parts[0][0] + (parts[0][1] || '')).toUpperCase();

    const users = Storage.getUsers();

    // Check duplicate username if adding new
    if (!editId) {
      const exists = users.find(u => u.username && u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        App.showToast(`O usuário "${username}" já existe. Escolha outro nome de login.`, 'error');
        return;
      }
    }

    if (editId) {
      const idx = users.findIndex(u => u.id === editId);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          name, role, email, username, color, avatar, biometricsEnabled, password
        };
        App.showToast(`Usuário "${name}" atualizado com sucesso!`, 'success');
      }
    } else {
      const newUser = {
        id: `usr_${Date.now()}`,
        name,
        username,
        password,
        role,
        email,
        color,
        avatar,
        isCurrent: false,
        biometricsEnabled
      };
      users.push(newUser);
      App.showToast(`Usuário "${name}" cadastrado com sucesso! Login: ${username}`, 'success');
    }

    Storage.saveUsers(users);

    if (!biometricsEnabled) {
      const enrolled = localStorage.getItem('sdfinanceiro_bio_enrolled_user');
      if (enrolled && (enrolled.toLowerCase() === username.toLowerCase() || enrolled.toLowerCase() === name.toLowerCase())) {
        Auth.removeDeviceBiometrics();
      }
    }

    this.resetForm();
    this.updateSidebarProfile();
    this.switchModalTab('list');
    Auth.updateDeviceBiometricsStatus();
  },

  editUser(userId) {
    const users = Storage.getUsers();
    const u = users.find(item => item.id === userId);
    if (!u) return;

    document.getElementById('user-edit-id').value = u.id;
    document.getElementById('form-user-name').value = u.name;
    document.getElementById('form-user-role').value = u.role;
    if (document.getElementById('form-user-email')) {
      document.getElementById('form-user-email').value = u.email || '';
    }
    if (document.getElementById('form-user-username')) {
      document.getElementById('form-user-username').value = u.username || '';
    }
    if (document.getElementById('form-user-password')) {
      document.getElementById('form-user-password').value = u.password || '123';
    }
    if (document.getElementById('form-user-biometrics')) {
      document.getElementById('form-user-biometrics').checked = (u.biometricsEnabled !== false);
    }

    // Color
    const colorRadio = document.querySelector(`input[name="user-color"][value="${u.color}"]`);
    if (colorRadio) colorRadio.checked = true;

    // UI state
    document.getElementById('form-user-title').textContent = `Editar Usuário: ${u.name}`;
    document.getElementById('btn-cancel-user-edit').style.display = 'inline-flex';
    document.getElementById('btn-save-user').textContent = 'Salvar Alterações';

    this.switchModalTab('form');
  },

  deleteUser(userId) {
    const users = Storage.getUsers();
    const u = users.find(item => item.id === userId);
    if (!u) return;

    if (u.isCurrent) {
      App.showToast('Não é possível excluir o usuário ativo no momento. Alterne para outro usuário primeiro.', 'error');
      return;
    }

    if (users.length <= 1) {
      App.showToast('O sistema precisa de pelo menos 1 usuário cadastrado.', 'error');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${u.name}" (login: ${u.username})?`)) {
      const filtered = users.filter(item => item.id !== userId);
      Storage.saveUsers(filtered);
      App.showToast(`Usuário "${u.name}" removido com sucesso.`, 'info');
      this.render();
    }
  },

  switchUser(userId) {
    const active = Storage.setActiveUser(userId);
    if (active) {
      this.updateSidebarProfile();
      this.render();
      App.showToast(`Usuário ativo alterado para: ${active.name} (${active.role})`, 'success');
    }
  },

  updateSidebarProfile() {
    const active = Storage.getActiveUser();
    if (!active) return;

    const avatarEl = document.getElementById('current-user-avatar');
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');

    if (avatarEl) {
      avatarEl.textContent = active.avatar || 'SD';
      avatarEl.style.backgroundColor = active.color || '#f59e0b';
    }
    if (nameEl) nameEl.textContent = active.name || 'Usuário';
    if (roleEl) roleEl.textContent = active.role || 'Administrador';
  },

  render() {
    const users = Storage.getUsers();
    const container = document.getElementById('users-list-container');
    const countBadge = document.getElementById('badge-users-total-count');

    if (countBadge) {
      countBadge.textContent = users.length;
    }

    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 28px; color: var(--text-muted);">
          <p>Nenhum usuário cadastrado.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = users.map(u => `
      <div class="user-card-item ${u.isCurrent ? 'is-active-user' : ''}" style="border-left: 4px solid ${u.color || '#3b82f6'};">
        <div class="user-card-left">
          <div class="user-avatar" style="background: ${u.color || '#3b82f6'}; font-weight: bold; width: 44px; height: 44px; font-size: 1rem; border-radius: 12px;">
            ${u.avatar || 'US'}
          </div>
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem; display: flex; align-items: center; gap: 8px;">
              ${u.name}
              ${u.isCurrent ? '<span class="badge badge-success" style="font-size: 0.72rem; padding: 2px 8px;"><i data-lucide="check"></i> Ativo Agora</span>' : ''}
            </div>
            <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 3px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
              <span><b>Cargo:</b> ${u.role}</span>
              <span>•</span>
              <span><b>Login:</b> <code style="background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px; color: #f6e59e;">${u.username || 'admin'}</code></span>
              <span>•</span>
              <span><b>Senha:</b> <code style="background: rgba(255,255,255,0.08); padding: 1px 6px; border-radius: 4px;">${u.password || '123'}</code></span>
              ${u.biometricsEnabled !== false ? '<span style="color: var(--amber); display: inline-flex; align-items: center; gap: 3px;"><i data-lucide="fingerprint" style="width: 14px; height: 14px;"></i> Biometria Ativa</span>' : ''}
            </div>
            ${u.email ? `<small style="color: var(--text-muted); display: block; margin-top: 2px;"><i data-lucide="mail" style="width: 12px; height: 12px; vertical-align: middle;"></i> ${u.email}</small>` : ''}
          </div>
        </div>

        <div class="user-card-actions">
          ${!u.isCurrent ? `
            <button class="btn btn-secondary btn-sm" onclick="Users.switchUser('${u.id}')" title="Alternar para este usuário">
              <i data-lucide="user-check"></i> Usar Esta Conta
            </button>
          ` : ''}
          <button class="btn-icon btn-sm" onclick="Users.editUser('${u.id}')" title="Editar Usuário">
            <i data-lucide="edit-3"></i>
          </button>
          ${!u.isCurrent ? `
            <button class="btn-icon btn-sm text-rose" onclick="Users.deleteUser('${u.id}')" title="Excluir">
              <i data-lucide="trash-2"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `).join('');

    lucide.createIcons();
  }
};
