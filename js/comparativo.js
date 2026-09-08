/**
 * SDFINANCEIRO — Módulo de Comparativo de Preços & Cotações
 * Inspirado diretamente no layout da Imagem 2 (SD Comparativos)
 */

const Comparativo = {
  STORAGE_KEY: 'sdfinanceiro_comparativos_v1',
  activeCategory: 'Todos',
  searchQuery: '',

  defaultData: [
    {
      id: 'comp_1',
      category: 'MDF/MDP',
      name: 'Mdf 06 branco tx',
      quotes: [
        { supplier: 'ITAIPU', price: 230.00, url: '#' },
        { supplier: 'RIO BRANCO', price: 235.00, url: '#' },
        { supplier: 'GMAD', price: 238.00, url: '#' },
        { supplier: 'FLG', price: 240.00, url: '#' }
      ]
    },
    {
      id: 'comp_2',
      category: 'MDF/MDP',
      name: 'Mdf 15 branco tx',
      quotes: [
        { supplier: 'ITAIPU', price: 285.00, url: '#' },
        { supplier: 'GMAD', price: 292.00, url: '#' },
        { supplier: 'FLG', price: 295.00, url: '#' },
        { supplier: 'RIO BRANCO', price: 299.00, url: '#' }
      ]
    },
    {
      id: 'comp_3',
      category: 'Ferragens',
      name: 'Corrediça Oculta c/ Amortecedor 450mm',
      quotes: [
        { supplier: 'FLG', price: 38.50, url: '#' },
        { supplier: 'ITAIPU', price: 42.00, url: '#' },
        { supplier: 'GMAD', price: 44.90, url: '#' },
        { supplier: 'RIO BRANCO', price: 45.00, url: '#' }
      ]
    }
  ],

  getItems() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaultData));
        return this.defaultData;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Erro ao ler comparativos:', e);
      return this.defaultData;
    }
  },

  saveItems(items) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    this.render();
  },

  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Botão de nova cotação
    const btnNew = document.getElementById('btn-new-comparison');
    if (btnNew) {
      btnNew.addEventListener('click', () => {
        this.openModal();
      });
    }

    // Formulário de nova cotação
    const form = document.getElementById('form-new-comparison');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveComparison();
      });
    }

    // Filtro de categorias do comparativo
    document.querySelectorAll('.comparativo-cat-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.comparativo-cat-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeCategory = e.currentTarget.dataset.cat || 'Todos';
        this.render();
      });
    });
  },

  setSearch(query) {
    this.searchQuery = (query || '').toLowerCase().trim();
    this.render();
  },

  render() {
    const container = document.getElementById('comparativo-cards-list');
    if (!container) return;

    let items = this.getItems();

    if (this.activeCategory && this.activeCategory !== 'Todos') {
      items = items.filter(it => it.category.toLowerCase() === this.activeCategory.toLowerCase());
    }

    if (this.searchQuery) {
      items = items.filter(it => 
        it.name.toLowerCase().includes(this.searchQuery) ||
        it.category.toLowerCase().includes(this.searchQuery) ||
        it.quotes.some(q => q.supplier.toLowerCase().includes(this.searchQuery))
      );
    }

    // Atualiza mini badges do topo se existirem
    const badgeProdCount = document.getElementById('comp-stat-products-count');
    if (badgeProdCount) badgeProdCount.textContent = items.length;

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state-pro">
          <i data-lucide="package-search"></i>
          <h4>Nenhum item encontrado</h4>
          <p>Não há cotações cadastradas nesta categoria ou busca.</p>
          <button type="button" class="btn btn-primary btn-sm" onclick="Comparativo.openModal()" style="margin-top: 10px;">
            + Cadastrar Primeira Cotação
          </button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = items.map(item => {
      // Ordena fornecedores pelo menor preço
      const sortedQuotes = [...item.quotes].sort((a, b) => a.price - b.price);
      const lowestPrice = sortedQuotes.length > 0 ? sortedQuotes[0].price : 0;

      return `
        <div class="comp-product-card" id="card-${item.id}">
          <div class="comp-card-top">
            <span class="comp-cat-tag">${App.escapeHTML(item.category)}</span>
            <h3 class="comp-prod-title">${App.escapeHTML(item.name)}</h3>
          </div>

          <div class="comp-quotes-grid">
            ${sortedQuotes.map((q, idx) => {
              const isLowest = idx === 0;
              const diff = q.price - lowestPrice;
              const diffLabel = diff > 0 ? `+R$ ${diff.toFixed(0)}` : '';

              return `
                <div class="comp-supplier-box ${isLowest ? 'is-best-price' : ''}">
                  <div class="comp-supplier-header">
                    <div class="comp-supplier-name">
                      ${isLowest ? '<i data-lucide="medal" class="medal-gold"></i>' : '<i data-lucide="building-2"></i>'}
                      <span>${App.escapeHTML(q.supplier)}</span>
                    </div>
                    ${isLowest 
                      ? '<span class="comp-lowest-badge">MENOR</span>' 
                      : (diffLabel ? `<span class="comp-diff-badge">${diffLabel}</span>` : '')
                    }
                  </div>

                  <div class="comp-price-row">
                    <span class="comp-currency">R$</span>
                    <span class="comp-price-val">${q.price.toFixed(2).replace('.', ',')}</span>
                  </div>

                  <button type="button" class="comp-buy-btn ${isLowest ? 'btn-green' : ''}" onclick="Comparativo.launchToFinance('${item.id}', '${App.escapeHTML(q.supplier)}', ${q.price})">
                    <i data-lucide="shopping-cart"></i>
                    <span>Comprar</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="comp-card-footer">
            <button type="button" class="comp-btn-add-quote" onclick="Comparativo.openAddQuoteModal('${item.id}')">
              <i data-lucide="plus"></i>
              <span>Cotação</span>
            </button>
            <div class="comp-actions-group">
              <button type="button" class="comp-btn-icon" title="Ver Detalhes" onclick="Comparativo.viewDetails('${item.id}')">
                <i data-lucide="eye"></i>
              </button>
              <button type="button" class="comp-btn-icon btn-danger-icon" title="Excluir Cotação" onclick="Comparativo.deleteItem('${item.id}')">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  },

  openModal() {
    const modal = document.getElementById('modal-new-comparison');
    if (modal) {
      modal.classList.add('active');
      const inputName = document.getElementById('input-comp-name');
      if (inputName) inputName.focus();
    }
  },

  closeModal() {
    const modal = document.getElementById('modal-new-comparison');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('form-new-comparison');
    if (form) form.reset();
  },

  handleSaveComparison() {
    const name = document.getElementById('input-comp-name')?.value.trim();
    const category = document.getElementById('select-comp-category')?.value || 'MDF/MDP';
    const supplier1 = document.getElementById('input-comp-sup-1')?.value.trim() || 'ITAIPU';
    const price1 = parseFloat(document.getElementById('input-comp-price-1')?.value) || 0;
    const supplier2 = document.getElementById('input-comp-sup-2')?.value.trim() || 'GMAD';
    const price2 = parseFloat(document.getElementById('input-comp-price-2')?.value) || 0;

    if (!name || price1 <= 0) {
      App.showToast('Preencha o nome do produto e pelo menos uma cotação com valor.', 'warning');
      return;
    }

    const quotes = [{ supplier: supplier1, price: price1 }];
    if (price2 > 0) quotes.push({ supplier: supplier2, price: price2 });

    const newItem = {
      id: 'comp_' + Date.now(),
      category,
      name,
      quotes
    };

    const items = this.getItems();
    items.unshift(newItem);
    this.saveItems(items);
    this.closeModal();
    App.showToast(`✅ Item "${name}" adicionado ao Comparativo!`, 'success');
  },

  deleteItem(id) {
    if (!confirm('Deseja excluir este produto do Comparativo?')) return;
    let items = this.getItems();
    items = items.filter(it => it.id !== id);
    this.saveItems(items);
    App.showToast('Item removido do comparativo.', 'info');
  },

  viewDetails(id) {
    const item = this.getItems().find(it => it.id === id);
    if (!item) return;
    const sorted = [...item.quotes].sort((a, b) => a.price - b.price);
    const lowest = sorted[0];
    alert(`🔍 Cotações para ${item.name}:\n\n` + sorted.map(q => `• ${q.supplier}: R$ ${q.price.toFixed(2)}`).join('\n') + `\n\n🏆 Menor Preço: ${lowest.supplier} (R$ ${lowest.price.toFixed(2)})`);
  },

  launchToFinance(itemId, supplier, price) {
    const item = this.getItems().find(it => it.id === itemId);
    const prodName = item ? item.name : 'Material';

    if (confirm(`Deseja lançar esta compra de R$ ${price.toFixed(2)} (${supplier} - ${prodName}) como Despesa no SD Financeiro?`)) {
      Transactions.openModal();
      setTimeout(() => {
        const descInput = document.getElementById('input-tx-description');
        const amountInput = document.getElementById('input-tx-amount');
        const typeSelect = document.getElementById('select-tx-type');
        const catSelect = document.getElementById('select-tx-category');

        if (descInput) descInput.value = `Compra: ${prodName} (${supplier})`;
        if (amountInput) amountInput.value = price.toFixed(2);
        if (typeSelect) typeSelect.value = 'expense';
        if (catSelect) catSelect.value = 'material';
      }, 150);
    }
  },

  openAddQuoteModal(itemId) {
    const supplier = prompt('Nome do Fornecedor (ex: RIO BRANCO, FLG, ITAIPU):');
    if (!supplier) return;
    const priceStr = prompt(`Valor da cotação para ${supplier} (R$):`);
    const price = parseFloat((priceStr || '').replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      alert('Valor inválido.');
      return;
    }

    let items = this.getItems();
    const target = items.find(it => it.id === itemId);
    if (target) {
      target.quotes.push({ supplier: supplier.toUpperCase(), price });
      this.saveItems(items);
      App.showToast(`Cotação de ${supplier} adicionada com sucesso!`, 'success');
    }
  }
};
