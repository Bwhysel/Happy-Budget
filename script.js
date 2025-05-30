import { getUnusedValues, calculateBudgetTotals } from './utils.js';
import { ValuesVisualization } from './components.js';

const savingsGoals = ['🚨 Emergency Fund', '💳 Debt Reduction', '🏠 Down Payment', '📚 Education', '👩‍💼 New Business', '🔧 Repairs', '👵 Comfortable Old Age', '✨ Other'];

const categories = [
  { name: 'Savings & Debt Reduction', emoji: '💰', defaultPct: 0.10 },
  { name: 'Housing', emoji: '🏠', defaultPct: 0.30 },
  { name: 'Utilities & Internet', emoji: '💡', defaultPct: 0.05 },
  { name: 'Groceries & Essentials', emoji: '🛒', defaultPct: 0.10 },
  { name: 'Transportation', emoji: '🚌', defaultPct: 0.05 },
  { name: 'Health & Insurance', emoji: '❤️', defaultPct: 0.07 },
  { name: 'Social, Dining & Entertainment', emoji: '🎉', defaultPct: 0.05 },
  { name: 'Phone, Subscriptions & Tech', emoji: '📱', defaultPct: 0.03 },
  { name: 'Gifts & Giving', emoji: '🎁', defaultPct: 0.02 },
  { name: 'Education & Training', emoji: '📚', defaultPct: 0.05 },
  { name: 'Clothing & Self-Care', emoji: '👕', defaultPct: 0.03 },
  { name: 'Children & Pets', emoji: '👶', defaultPct: 0.05 },
  { name: 'Unexpected & Miscellaneous', emoji: '✨', defaultPct: 0.10 }
];

const budgetApp = {
  selectedGoals: [],
  takeHomePay: 0,
  expenseState: {
    allocations: {},
    getTotal() {
      return Object.values(this.allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    }
  },
  goToStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step${n}`).classList.add('active');
  }
};

function updateProgress() {
  const continueBtn = document.getElementById('continueTo3');
  const totalAlloc = budgetApp.expenseState.getTotal();
  const remaining = budgetApp.takeHomePay - totalAlloc;

  const bp = document.getElementById('budgetProgress');
  if (remaining < 0) {
    bp.classList.add('negative');
    document.getElementById('remainingLabel').innerHTML = 
      `<span class="overspent-label">⚠️ ($${Math.abs(Math.round(remaining)).toLocaleString()} overspent)</span>`;
  } else {
    bp.classList.remove('negative');
    document.getElementById('remainingLabel').textContent = 
      `$${Math.max(0, Math.round(remaining)).toLocaleString()} remaining`;
  }
  bp.value = Math.min(100, Math.round((totalAlloc / budgetApp.takeHomePay) * 100));

  const rows = document.querySelectorAll('#expenseGrid .expense-row');
  let completed = 0;
  rows.forEach(row => {
    const sel = row.querySelector('select');
    const inp = row.querySelector('input');
    if (sel && inp && sel.value !== '' && inp.value.trim() !== '') {
      completed++;
    }
  });

  document.getElementById('categoryProgress').value = completed;
  document.getElementById('categoryLabel').textContent = `${completed}/${categories.length}`;
  
  continueBtn.disabled = remaining !== 0 || completed !== categories.length;
}

function renderSavingsGoals() {
  const savingsGoalsList = document.getElementById('savingsGoalsList');
  savingsGoalsList.innerHTML = '';

  savingsGoals.forEach(goal => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.textContent = goal;
    
    if (budgetApp.selectedGoals.includes(goal)) {
      chip.classList.add('active');
    }
    
    chip.onclick = () => {
      chip.classList.toggle('active');
      const selectedGoals = [...document.querySelectorAll('#savingsGoalsList .chip.active')]
        .map(el => el.textContent);
      budgetApp.selectedGoals = selectedGoals;
      document.getElementById('continueButtonSavings').disabled = selectedGoals.length === 0;
    };
    
    savingsGoalsList.appendChild(chip);
  });
}

function renderExpenseRow(category) {
  const { name, emoji, defaultPct } = category;
  const row = document.createElement('div');
  row.className = 'expense-row';

  const label = document.createElement('label');
  label.textContent = `${emoji} ${name}`;

  const select = document.createElement('select');
  select.innerHTML = '<option value="">Pick a value...</option>';
  ['Autonomy', 'Basic Needs', 'Empowerment', 'Financial Security', 'Fun & Leisure',
   'Giving & Helping Others', 'Health', 'Learning', 'None', 'Respect', 'Social Connectedness']
    .forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '10';
  input.placeholder = `e.g. ${Math.round(budgetApp.takeHomePay * defaultPct)}`;

  select.addEventListener('change', () => {
    select.classList.toggle('filled', select.value !== '');
    select.classList.toggle('untouched', select.value === '');
    updateProgress();
  });

  input.addEventListener('input', () => {
    input.classList.add('filled');
    input.classList.remove('untouched');
    budgetApp.expenseState.allocations[name] = parseFloat(input.value) || 0;
    updateProgress();
  });

  row.append(label, select, input);
  return row;
}

function populateStep3() {
  const step3Container = document.getElementById('step3');
  if (!step3Container) return;

  const expenseGrid = document.getElementById('expenseGrid');
  const rows = expenseGrid.querySelectorAll('.expense-row');
  const valueCategories = calculateBudgetTotals(rows);

  new ValuesVisualization(step3Container, budgetApp.takeHomePay, valueCategories);
}

document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  document.getElementById('continueButtonSavings').addEventListener('click', () => {
    budgetApp.goToStep(2);
  });

  document.getElementById('backTo1').addEventListener('click', () => {
    budgetApp.goToStep(1);
  });

  document.getElementById('continueTo3').addEventListener('click', () => {
    populateStep3();
    budgetApp.goToStep(3);
  });

  const takeHomePayInput = document.getElementById('takeHomePayInput');
  takeHomePayInput.addEventListener('change', () => {
    const pay = parseFloat(takeHomePayInput.value);
    if (!isNaN(pay) && pay > 0) {
      budgetApp.takeHomePay = pay;
      document.getElementById('progressBars').style.display = 'flex';
      
      const expenseGrid = document.getElementById('expenseGrid');
      expenseGrid.innerHTML = '';
      categories.forEach(category => {
        expenseGrid.appendChild(renderExpenseRow(category));
      });
    }
    takeHomePayInput.classList.toggle('filled', takeHomePayInput.value.trim() !== '');
  });

  // Initial render
  renderSavingsGoals();
});
