/**
 * SD FINANÇAS ENTERPRISE - Users, Settings & Lockscreen Modules
 */

// 1. GESTÃO & USUÁRIOS
const UsersModal = {
  users: [
    { id: 'usr-1', name: 'Sérgio Dantas', role: 'Administrador', email: 'sergio.dantas@sdfinancas.com', active: true },
    { id: 'usr-2', name: 'samuel david', role: 'Gerente Financeiro', email: 'samuel.david@sdfinancas.com', active: false },
    { id: 'usr-3', name: 'Operador Contábil', role: 'Operador', email: 'contabilidade@sdfinancas.com', active: false }
  ],

  open() {
    this.render();
    const modal = document.getElementById('modal-users');
    if (modal) modal.classList.add('active');
  },

  close() {
    const modal = document.getElementById('modal-users');
    if (modal) modal.classList.remove('active');
  },

  render() {
    const list = document.getElementById('users-list-container');
    if (!list) return;

    list.innerHTML = this.users.map(u => `
      <div class="card" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; margin-bottom: 10px; background: ${u.active ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.02)'}; border: 1px solid ${u.active ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.06)'};">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="user-avatar-sd" style="width: 36px; height: 36px; font-size: 0.82rem;">
            ${u.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.92rem; color: #fff; display: flex; align-items: center; gap: 6px;">
              ${u.name}
              ${u.active ? '<span style="font-size: 0.65rem; background: var(--gold-primary); color: #000; font-weight: 800; padding: 1px 6px; border-radius: var(--radius-full);">ATIVO</span>' : ''}
            </div>
            <div style="font-size: 0.76rem; color: var(--text-secondary);">${u.role} • ${u.email}</div>
          </div>
        </div>

        <div>
          ${u.active 
            ? '<span style="color: var(--emerald); font-size: 0.8rem; font-weight: 600;"><i data-lucide="check" style="width: 14px; height: 14px; vertical-align: middle;"></i> Conectado</span>'
            : `<button class="btn btn-outline btn-sm" onclick="UsersModal.switchUser('${u.id}')">Alternar</button>`
          }
        </div>
      </div>
    `).join('');

    if (window.lucide) lucide.createIcons();
  },

  switchUser(id) {
    this.users.forEach(u => u.active = (u.id === id));
    const active = this.users.find(u => u.id === id);
    if (active) {
      const nameEls = document.querySelectorAll('.user-name, #sb-username');
      nameEls.forEach(el => el.textContent = active.name);
      const roleEls = document.querySelectorAll('.user-role');
      roleEls.forEach(el => el.textContent = active.role);
      AppState.showToast(`Sessão alternada para ${active.name}`);
    }
    this.render();
  },

  addUser(e) {
    e.preventDefault();
    const name = document.getElementById('new-user-name').value.trim();
    const role = document.getElementById('new-user-role').value;
    const email = document.getElementById('new-user-email').value.trim();

    if (!name) return;

    this.users.push({
      id: 'usr-' + Date.now(),
      name,
      role,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@sdfinancas.com`,
      active: false
    });

    document.getElementById('form-add-user').reset();
    this.render();
    AppState.showToast(`Usuário ${name} cadastrado com sucesso!`);
  }
};

// 2. IDIOMA & CONFIGURAÇÕES
const SettingsModal = {
  open() {
    const modal = document.getElementById('modal-settings-lang');
    if (modal) modal.classList.add('active');
  },

  close() {
    const modal = document.getElementById('modal-settings-lang');
    if (modal) modal.classList.remove('active');
  },

  save(e) {
    if (e) e.preventDefault();
    const lang = document.querySelector('input[name="opt-lang"]:checked')?.value || 'pt-BR';
    const currency = document.getElementById('opt-currency')?.value || 'BRL';
    localStorage.setItem('sd_lang', lang);
    localStorage.setItem('sd_currency', currency);
    AppState.showToast('Preferências de idioma e moeda salvas com sucesso!');
    this.close();
  }
};

// 3. BLOQUEAR / TELA LOGIN
const LockscreenModule = {
  isLocked: false,

  lock() {
    this.isLocked = true;
    const screen = document.getElementById('screen-auth-lock');
    if (screen) {
      screen.classList.add('active');
      const pinInput = document.getElementById('lock-pin-input');
      if (pinInput) {
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 200);
      }
    }
  },

  unlock() {
    this.isLocked = false;
    const screen = document.getElementById('screen-auth-lock');
    if (screen) screen.classList.remove('active');
    AppState.showToast('Sistema desbloqueado. Bem-vindo, Sérgio Dantas!');
  },

  handlePinSubmit(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('lock-pin-input');
    const val = input ? input.value : '';
    // Unlock on correct PIN or empty/enter for quick demo
    if (val === '1234' || val === '123' || val === '' || val.length >= 3) {
      this.unlock();
    } else {
      const err = document.getElementById('lock-error-msg');
      if (err) {
        err.textContent = 'Senha incorreta. Dica: use 1234';
        setTimeout(() => err.textContent = '', 3000);
      }
    }
  }
};
