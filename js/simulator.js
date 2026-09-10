/* ===================================================================
   SD FINANÇAS PRO — SIMULADOR DE JUROS COMPOSTOS & PATRIMÔNIO
   =================================================================== */

const SimulatorManager = {
  init() {
    this.setupEventListeners();
    this.calculate();
  },

  calculate() {
    const initialDeposit = parseFloat(document.getElementById('simInitial').value) || 0;
    const monthlyDeposit = parseFloat(document.getElementById('simMonthly').value) || 0;
    const annualRate = parseFloat(document.getElementById('simRate').value) || 0;
    const years = parseInt(document.getElementById('simYears').value) || 1;

    // Converte taxa anual para taxa mensal equivalente
    const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const totalMonths = years * 12;

    let balance = initialDeposit;
    let totalInvested = initialDeposit;

    const yearlyPoints = [];
    const investedPoints = [];
    const totalPoints = [];

    for (let m = 1; m <= totalMonths; m++) {
      balance = balance * (1 + monthlyRate) + monthlyDeposit;
      totalInvested += monthlyDeposit;

      if (m % 12 === 0 || m === totalMonths) {
        const currentYear = Math.ceil(m / 12);
        yearlyPoints.push(currentYear);
        investedPoints.push(Math.round(totalInvested));
        totalPoints.push(Math.round(balance));
      }
    }

    const totalInterest = Math.max(balance - totalInvested, 0);

    // Atualiza elementos na tela
    const elFinal = document.getElementById('simTotalFinal');
    const elInvested = document.getElementById('simTotalInvested');
    const elInterest = document.getElementById('simTotalInterest');

    if (elFinal) elFinal.textContent = Storage.formatCurrency(balance);
    if (elInvested) elInvested.textContent = Storage.formatCurrency(totalInvested);
    if (elInterest) elInterest.textContent = Storage.formatCurrency(totalInterest);

    // Atualiza gráfico de projeção
    ChartsManager.renderInvestmentProjection(yearlyPoints, investedPoints, totalPoints);
  },

  setupEventListeners() {
    const inputs = ['simInitial', 'simMonthly', 'simRate', 'simYears'];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calculate());
      }
    });

    const yearsRange = document.getElementById('simYearsRange');
    const yearsInput = document.getElementById('simYears');
    if (yearsRange && yearsInput) {
      yearsRange.addEventListener('input', (e) => {
        yearsInput.value = e.target.value;
        this.calculate();
      });
      yearsInput.addEventListener('input', (e) => {
        yearsRange.value = e.target.value;
      });
    }
  }
};
