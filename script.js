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
    happinessLevel: null, // 0-4 representing the selected emoji
    expenseState: { 
      allocations: {},
      getTotal() { 
        return Object.values(this.allocations).reduce((sum,val)=>sum+(parseFloat(val)||0),0); 
      }
    },    goToStep(n) { 
      document.querySelectorAll('.step').forEach(s=>s.classList.remove('active')); 
      const nextStep = document.getElementById(`step${n}`);
      nextStep.classList.add('active');
      if (n === 3) {
        renderValueChart();
        renderFeedback();
      } else if (n === 4) {
        renderStep4Summary();
      }
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
      document.getElementById('progressBars').classList.add('visible');
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

    // --- Step 3 Logic ---  // Step 3 rendering functions

  function renderValueChart() {
    const chart = document.getElementById('valueChart');
    chart.innerHTML = '';
    const values = {};

    const rows = document.querySelectorAll('#expenseGrid .expense-row');
    rows.forEach(row => {
      const val = row.querySelector('select')?.value;
      const amt = parseFloat(row.querySelector('input')?.value || 0);
      if (val && amt) {
        values[val] = (values[val] || 0) + amt;
      }
    });

    const total = Object.values(values).reduce((a,b) => a + b, 0);    Object.entries(values).forEach(([label, amount]) => {      const pct = Math.round((amount / total) * 100);
      const bar = document.createElement('div');
      const barContainer = document.createElement('div');
      barContainer.className = 'value-bar-container';
      
      // Create the value bar
      const valueBar = document.createElement('div');
      valueBar.className = 'value-bar';
      valueBar.style.width = `${pct}%`;
      valueBar.textContent = `$${amount.toLocaleString()}`;
      barContainer.appendChild(valueBar);
      
      // Create expandable details section
      const details = document.createElement('div');
      details.className = 'value-details';
      
      // Get all expenses for this value
      let valueDetails = [];
      let totalForValue = 0;
      document.querySelectorAll('#expenseGrid .expense-row').forEach(row => {
        if (row.querySelector('select')?.value === label) {
          const category = row.dataset.category;
          const amount = parseFloat(row.querySelector('input')?.value || 0);
          if (amount > 0) {
            valueDetails.push({ category, amount });
            totalForValue += amount;
          }
        }
      });
      
      // Add expense details
      valueDetails.forEach(({ category, amount }) => {
        const item = document.createElement('div');
        item.className = 'value-details-item';
        item.innerHTML = `
          <span>${category}</span>
          <span>$${amount.toLocaleString()}</span>
        `;
        details.appendChild(item);
      });
      
      // Add total
      const totalItem = document.createElement('div');
      totalItem.className = 'value-details-item';
      totalItem.innerHTML = `
        <span>Total for ${label}</span>
        <span>$${totalForValue.toLocaleString()}</span>
      `;
      details.appendChild(totalItem);
      
      bar.innerHTML = `<strong>${label}</strong>`;
      bar.appendChild(barContainer);
      bar.appendChild(details);
      
      barContainer.addEventListener('click', () => {
        // Toggle details visibility
        const wasVisible = details.classList.contains('visible');
        document.querySelectorAll('.value-details').forEach(d => d.classList.remove('visible'));
        if (!wasVisible) {
          details.classList.add('visible');
        }
      });
      
      chart.appendChild(bar);
    });
  }

  function renderFeedback() {
    const savings = budgetApp.expenseState.allocations['Savings & Debt Reduction'] || 0;
    const housing = budgetApp.expenseState.allocations['Housing'] || 0;
    const takeHome = budgetApp.takeHomePay;

    const savingsPct = (savings / takeHome) * 100;
    const savingsGoals = budgetApp.selectedGoals.join(', ') || 'your goals';
    document.getElementById('savingsFeedback').textContent =
      savingsPct < 10
      ? `⚠️ You're saving just ${Math.round(savingsPct)}% of your take-home pay. Your savings goals include ${savingsGoals}. Would you like to revisit your budget to save a bit more and reach your goals sooner?`
      : `🎉 Great job saving ${Math.round(savingsPct)}% of your take-home pay! Your savings goals include ${savingsGoals}. Would you still like to revisit your budget to save a bit more and reach your goals sooner?`;

    const housingPct = (housing / takeHome) * 100;
    document.getElementById('housingFeedback').textContent =
      housingPct > 35
        ? `⚠️ Housing takes up ${Math.round(housingPct)}% of your income. Is this sustainable? Can you reduce housing costs or increase income?`
        : `💡 Housing is ${Math.round(housingPct)}% of income. That looks reasonable.`;

    const used = new Set();
    document.querySelectorAll('#expenseGrid .expense-row').forEach(row => {
      const val = row.querySelector('select')?.value;
      const amt = parseFloat(row.querySelector('input')?.value || 0);
      if (val && amt > 0) used.add(val);
    });
    const all = [
      'Autonomy','Basic Needs','Empowerment','Financial Security','Fun & Leisure',
      'Giving & Helping Others','Health','Learning','None','Respect','Social Connectedness'
    ];
    const unused = all.filter(v => !used.has(v));
    document.getElementById('zeroValueFeedback').textContent = unused.length
      ? `💡 You didn’t allocate anything to: ${unused.join(', ')}.`
      : `✅ You allocated something to every value.`;
  }  function saveFinalData() {
    // Get the current date for the filename
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
      const data = {
      savedOn: now.toISOString(),
      goals: budgetApp.selectedGoals,
      takeHomePay: budgetApp.takeHomePay,
      allocations: budgetApp.expenseState.allocations,
      values: {}, // Store values for each category
      commitment: document.getElementById("commitmentText")?.value || "",
      happinessLevel: budgetApp.happinessLevel
    };

    try {
      // Collect values for each category
      document.querySelectorAll('.expense-row').forEach(row => {
        const category = row.dataset.category;
        const value = row.querySelector('select')?.value;
        if (category && value) {
          data.values[category] = value;
        }
      });

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `happy-budget-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show success message
      const saveBtn = document.getElementById('saveBudgetBtn');
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Saved! ✅";
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Error saving budget:', err);
      alert('Error saving budget. Please try again.');
    }
  }
  document.querySelectorAll('#satisfactionCheck .emoji-rating span').forEach((span, idx) => {
    span.addEventListener('click', () => {
      // Remove active class from all emojis
      document.querySelectorAll('#satisfactionCheck .emoji-rating span').forEach(s => 
        s.classList.remove('active'));
      
      // Add active class to selected emoji
      span.classList.add('active');
        // Store happiness level
      budgetApp.happinessLevel = idx;
      const hint = document.getElementById('emojiHint');
      const backButton = document.getElementById('backTo2From3');
      
      if (idx <= 2) {
        hint.textContent = "🔄 Consider going back to make a happier plan.";
        backButton.classList.add('pulse');
      } else {
        hint.textContent = "👍🏻 Great! Your plan aligns with your happiness.";
        backButton.classList.remove('pulse');
      }
      document.getElementById('continueTo4').disabled = false;
    });
  });

  document.getElementById('continueTo2_5').addEventListener('click', () => budgetApp.goToStep(3));
  document.getElementById('backTo2From3').addEventListener('click', () => budgetApp.goToStep(2));    document.getElementById('continueTo4').addEventListener('click', () => {
    budgetApp.goToStep(4);
    renderStep4Summary();
});

  function renderStep4Summary() {
    // Render savings goals
    const goalsList = document.getElementById('selectedGoalsList');
    goalsList.innerHTML = '';
    budgetApp.selectedGoals.forEach(goal => {
      const chip = document.createElement('div');
      chip.className = 'goal-chip';
      chip.textContent = goal;
      goalsList.appendChild(chip);
    });

    // Render budget categories table
    const tableBody = document.querySelector('#budgetSummaryTable tbody');
    tableBody.innerHTML = '';
    const totalMonthly = budgetApp.expenseState.getTotal();

    categories.forEach(({ name, emoji }) => {
      const amount = budgetApp.expenseState.allocations[name] || 0;
      const pct = ((amount / totalMonthly) * 100).toFixed(1);

      // Find associated value
      const row = document.querySelector(`.expense-row[data-category="${name}"]`);
      const value = row ? row.querySelector('select')?.value || 'None' : 'None';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${emoji} ${name}</td>
        <td>${value}</td>
        <td>$${amount.toLocaleString()}</td>
        <td>${pct}%</td>
      `;
      tableBody.appendChild(tr);
    });

    // Update total
    document.getElementById('totalMonthlyBudget').textContent = 
      `$${totalMonthly.toLocaleString()}`;
  }

  // Add this near the end of the DOMContentLoaded event listener
    document.getElementById('loadBudgetInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate the data
        if (!data.goals || !data.takeHomePay || !data.allocations) {
          throw new Error('Invalid budget file format');
        }

        // Load savings goals
        budgetApp.selectedGoals = data.goals;
        document.querySelectorAll('#savingsGoalsList .chip').forEach(chip => {
          if (data.goals.includes(chip.textContent)) {
            chip.classList.add('active');
          } else {
            chip.classList.remove('active');
          }
        });
        document.getElementById('continueButtonSavings').disabled = data.goals.length === 0;

        // Load take home pay
        budgetApp.takeHomePay = data.takeHomePay;
        const takeHomePayInput = document.getElementById('takeHomePayInput');
        takeHomePayInput.value = data.takeHomePay;
        takeHomePayInput.classList.add('filled');        // Load allocations and values
        budgetApp.expenseState.allocations = data.allocations;
        currentRow = 0;
        document.getElementById('progressBars').classList.add('visible');
        
        // Render all rows first
        categories.forEach((_, idx) => {
          renderRow(idx);
        });
        
        // Now populate all rows with saved data
        categories.forEach((cat, idx) => {
          const row = document.querySelectorAll('#expenseGrid .expense-row')[idx];
          if (row) {
            const select = row.querySelector('select');
            const input = row.querySelector('input');
            const value = data.values?.[cat.name];
            const amount = data.allocations[cat.name];
            
            if (select && value) {
              select.classList.remove('untouched');
              select.value = value;
              select.classList.add('filled');
            }
            
            if (input && amount) {
              input.classList.remove('untouched');
              input.value = amount;
              input.classList.add('filled');
            }
          }
        });

        // Update all progress
        updateProgress();        // If commitment exists, prepare it
        if (data.commitment) {
          const commitmentText = document.getElementById('commitmentText');
          if (commitmentText) {
            commitmentText.value = data.commitment;
          }
        }

        // Restore happiness level if it exists
        if (typeof data.happinessLevel === 'number') {
          budgetApp.happinessLevel = data.happinessLevel;
          const emojis = document.querySelectorAll('#satisfactionCheck .emoji-rating span');
          emojis.forEach(s => s.classList.remove('active'));
          if (emojis[data.happinessLevel]) {
            emojis[data.happinessLevel].classList.add('active');
          }
          document.getElementById('continueTo4').disabled = false;
        }

        // Show success message
        alert('Budget loaded successfully! 📊');

      } catch (err) {
        console.error('Error loading budget:', err);
        alert('Error loading budget file. Please make sure you selected a valid Happy Budget file.');
      }
    };
    reader.readAsText(file);
  });
  // Add print, save, and load button event listeners
  document.getElementById('printBudgetBtn')?.addEventListener('click', () => {
    window.print();
  });

  document.getElementById('saveBudgetBtn')?.addEventListener('click', saveFinalData);

  document.getElementById('loadBudgetBtn')?.addEventListener('click', () => {
    document.getElementById('loadBudgetInput').click();
  });

  // End of the DOMContentLoaded event listener
});
