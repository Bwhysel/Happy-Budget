document.addEventListener('DOMContentLoaded', () => {
  const savingsGoals = ['🚨 Emergency Fund','💳 Debt Reduction','🏠 Down Payment','📚 Education','👩‍💼 New Business','🔧 Repairs','👵 Comfortable Old Age','✨ Other'];
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

  let currentRow = 0;

  const budgetApp = {
    selectedGoals: [], 
    takeHomePay: 0, 
    otherInput: null,
    expenseState: { 
      allocations: {},
      getTotal() { 
        return Object.values(this.allocations).reduce((sum,val)=>sum+(parseFloat(val)||0),0); 
      }
    },
    goToStep(n) { 
      document.querySelectorAll('.step').forEach(s=>s.classList.remove('active')); 
      document.getElementById(`step${n}`).classList.add('active'); 
    }
  };

  function getRemaining() {
    return budgetApp.takeHomePay - budgetApp.expenseState.getTotal();
  }

  function updateUnexpectedPlaceholder() {
    const unexpectedInput = document.getElementById('unexpectedInput');
    const remainingLabel = document.getElementById('remainingLabel');
    const match = remainingLabel.textContent.match(/\$([\d,]+)/);
    if (match && unexpectedInput) {
      const remaining = parseInt(match[1].replace(/,/g, ''));
      unexpectedInput.placeholder = `e.g. ${remaining}`;
    }
  }

  function updateProgress() {
    const continueBtn = document.getElementById('continueTo2_5');
    const totalAlloc = budgetApp.expenseState.getTotal();
    const remaining = getRemaining();

    if (budgetApp.otherInput) {
      budgetApp.otherInput.placeholder = `e.g. ${Math.max(0,Math.round(remaining))}`;
    }

    const bp = document.getElementById('budgetProgress');
    if (remaining < 0) {
      bp.classList.add('negative');
      document.getElementById('remainingLabel').innerHTML = `<span class="overspent-label">⚠️ ($${Math.abs(Math.round(remaining)).toLocaleString()} overspent)</span>`;    } else {
      bp.classList.remove('negative');
      document.getElementById('remainingLabel').textContent = `($${Math.max(0,Math.round(remaining)).toLocaleString()} remaining)`;
    }

    bp.value = Math.min(100, Math.round((totalAlloc / budgetApp.takeHomePay) * 100));

    const rows = document.querySelectorAll('#expenseGrid .expense-row');
    let completed = 0;
    rows.forEach(row => {
      const sel = row.querySelector('select');
      const inp = row.querySelector('input');
      if (sel && inp && sel.value !== '' && inp.value.trim() !== '') completed++;
    });
    document.getElementById('categoryProgress').value = completed;
    document.getElementById('categoryLabel').textContent = completed;
    continueBtn.disabled = !(remaining === 0 && completed === categories.length);

    updateUnexpectedPlaceholder();
  }

  function renderSavingsGoals() {
    const ctr = document.getElementById('savingsGoalsList');
    ctr.innerHTML = '';
    savingsGoals.forEach(goal => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = goal;
      chip.onclick = () => {
        chip.classList.toggle('active');
        const sel = [...document.querySelectorAll('#savingsGoalsList .chip.active')].map(el => el.textContent);
        budgetApp.selectedGoals = sel;
        document.getElementById('continueButtonSavings').disabled = sel.length === 0;
      };
      ctr.appendChild(chip);
    });
  }

function tryNext(input, select, name) {
  if (input.value.trim() !== '' && select.value !== '') {
    budgetApp.expenseState.allocations[name] = parseFloat(input.value) || 0;
    input.classList.add('filled');
    select.classList.add('filled');
    updateProgress();

    if (currentRow < categories.length - 1) {
      currentRow++;
      renderRow(currentRow);
      document.querySelectorAll('#expenseGrid .expense-row')[currentRow]?.querySelector('select')?.focus();
    }
  }
}

  function renderRow(idx) {
    const { name, emoji, defaultPct } = categories[idx];
    const container = document.getElementById('expenseGrid');
    if (idx === 0) container.innerHTML = '';

    const row = document.createElement('div');
    row.className = 'expense-row';
    row.dataset.category = name;

    const label = document.createElement('label');
    label.textContent = `${emoji} ${name}`;

    const select = document.createElement('select');
    select.innerHTML = '<option value="">Pick a value...</option>';
    ['Autonomy','Basic Needs','Empowerment','Financial Security','Fun & Leisure','Giving & Helping Others','Health','Learning','None','Respect','Social Connectedness'].forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
    select.classList.add('untouched');

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.step = '10';
    input.classList.add('untouched');

    if (name === 'Unexpected & Miscellaneous') {
      input.id = 'unexpectedInput';
    }

    input.placeholder = name === 'Unexpected & Miscellaneous'
      ? `e.g. ${Math.max(0, Math.round(getRemaining()))}`
      : `e.g. ${Math.round(budgetApp.takeHomePay * defaultPct)}`;

    input.addEventListener('focus', () => input.classList.remove('untouched'));
    input.addEventListener('input', updateProgress);

    select.addEventListener('keydown', e => {
      if (e.key === 'Enter' && select.value) {
        e.preventDefault();
        input.focus();
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
    });

    input.addEventListener('blur', () => tryNext(input, select, name));

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.append(select, input);
    row.append(label, inputGroup);
    container.appendChild(row);
  }

  const takeHomePayInput = document.getElementById('takeHomePayInput');
  takeHomePayInput.classList.add('untouched');

  takeHomePayInput.addEventListener('focus', () => {
    takeHomePayInput.classList.remove('untouched');
  });

  takeHomePayInput.addEventListener('blur', function () {
    const pay = parseFloat(this.value);
    if (!isNaN(pay) && pay >= 0) {
      budgetApp.takeHomePay = pay;
      currentRow = 0;
      document.getElementById('progressBars').style.display = 'flex';
      renderRow(currentRow);
      const firstRow = document.querySelector('#expenseGrid .expense-row');
      if (firstRow) {
        const select = firstRow.querySelector('select');
        if (select) select.focus();
      }
    }
    if (this.value.trim() !== '') {
      takeHomePayInput.classList.add('filled');
    }
  });

  takeHomePayInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') this.blur();
  });

  document.getElementById('backTo1').addEventListener('click', () => {
    budgetApp.goToStep(1);
  });

  document.getElementById('continueButtonSavings').addEventListener('click', () => {
    if (budgetApp.selectedGoals.length > 0) {
      budgetApp.goToStep(2);
    }
  });

  renderSavingsGoals();
});
