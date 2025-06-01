    document.addEventListener('DOMContentLoaded', () => {
      const savingsGoals = ['🚨 Emergency Fund','💳 Debt Reduction','🏠 Down Payment','📚 Education','👩‍💼 New Business','🔧 Repairs','👵 Comfortable Old Age','✨ Other'];      const categories = [
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
      let currentRow = 0;      const budgetApp = {
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

      function updateProgress() {
        const continueBtn = document.getElementById('continueTo2_5');
        const totalAlloc = budgetApp.expenseState.getTotal();
        const remaining = budgetApp.takeHomePay - totalAlloc;
        if (budgetApp.otherInput) {
          budgetApp.otherInput.placeholder = `e.g. ${Math.max(0,Math.round(remaining))}`;
        }
        const bp = document.getElementById('budgetProgress');
        if (remaining<0) {
          bp.classList.add('negative');
          document.getElementById('remainingLabel').innerHTML = `<span class="overspent-label">⚠️ ($${Math.abs(Math.round(remaining)).toLocaleString()} overspent)</span>`;
        } else {
          bp.classList.remove('negative');
          document.getElementById('remainingLabel').textContent = `$${Math.max(0,Math.round(remaining)).toLocaleString()} remaining`;
        }
        bp.value = Math.min(100,Math.round((totalAlloc/budgetApp.takeHomePay)*100));
        const rows = document.querySelectorAll('#expenseGrid .expense-row');
        let completed = 0;
        rows.forEach(row=>{
          const sel=row.querySelector('select'); const inp=row.querySelector('input');
          if(sel&&inp&&sel.value!==''&&inp.value.trim()!=='') completed++;
        });
        document.getElementById('categoryProgress').value = completed;
        document.getElementById('categoryLabel').textContent = completed;
        continueBtn.disabled = !(remaining===0 && completed===categories.length);
      }

      function renderSavingsGoals(){ const ctr=document.getElementById('savingsGoalsList'); ctr.innerHTML=''; savingsGoals.forEach(goal=>{ const chip=document.createElement('div'); chip.className='chip'; chip.textContent=goal; chip.onclick=()=>{ chip.classList.toggle('active'); const sel=[...document.querySelectorAll('#savingsGoalsList .chip.active')].map(el=>el.textContent); budgetApp.selectedGoals=sel; document.getElementById('continueButtonSavings').disabled=sel.length===0; }; ctr.appendChild(chip);} ); }
      function renderRow(idx){ 
        const {name,emoji,defaultPct}=categories[idx]; 
        const container=document.getElementById('expenseGrid'); 
        if(idx===0) container.innerHTML=''; 
        const row=document.createElement('div'); 
        row.className='expense-row'; 
        const label=document.createElement('label'); 
        label.textContent=`${emoji} ${name}`; 
        const select=document.createElement('select'); 
        select.innerHTML='<option value="">Pick a value...</option>'; 
        ['Autonomy','Basic Needs','Empowerment','Financial Security','Fun & Leisure','Giving & Helping Others','Health','Learning','None','Respect','Social Connectedness'].forEach(val=>{ 
          const opt=document.createElement('option'); 
          opt.value=val; 
          opt.textContent=val; 
          select.appendChild(opt);
        }); 
        select.classList.add('untouched');
        
        const input=document.createElement('input'); 
        input.type='number'; 
        input.min='0'; 
        input.step='10'; 
        input.classList.add('untouched'); 
        
        // Update placeholder for Unexpected & Miscellaneous based on remaining amount
        if(name === 'Unexpected & Miscellaneous') {
          const remaining = budgetApp.takeHomePay - budgetApp.expenseState.getTotal();
          input.placeholder = `e.g. ${Math.max(0, Math.round(remaining))}`;
        } else {
          input.placeholder = `e.g. ${Math.round(budgetApp.takeHomePay * defaultPct)}`;
        }
        
        input.addEventListener('focus',()=>input.classList.remove('untouched'));          input.addEventListener('input',()=>{
            updateProgress();
            // Update Unexpected & Miscellaneous placeholder when any amount changes
            const unexpectedRow = document.querySelector('.expense-row label[textContent*="Unexpected & Miscellaneous"]')?.closest('.expense-row');
            if (unexpectedRow) {
              const unexpectedInput = unexpectedRow.querySelector('input');
              if (unexpectedInput) {
                const remaining = budgetApp.takeHomePay - budgetApp.expenseState.getTotal();
                unexpectedInput.placeholder = `e.g. ${Math.max(0, Math.round(remaining))}`;
              }
            }
          });

          // When Enter is pressed in select, focus the input
          select.addEventListener('keydown', e => {
            if(e.key === 'Enter' && select.value) {
              e.preventDefault();
              input.focus();
            }
          });          input.addEventListener('keydown',e=>{
            if(e.key==='Enter'){
              e.preventDefault();
              input.blur();
            }
          });          function tryNext(){ 
            if(input.value.trim() !== '') {
              if(currentRow<categories.length-1){
                currentRow++;
                // First render the new row
                renderRow(currentRow);
                // Get reference to the new row's select
                const newSelect = document.querySelectorAll('#expenseGrid .expense-row')[currentRow].querySelector('select');
                
                // Now update the current row's state
                budgetApp.expenseState.allocations[name]=parseFloat(input.value)||0; 
                input.classList.add('filled');
                if (select.value !== '') {
                  select.classList.add('filled');
                }
                updateProgress();
                
                // Finally, focus the new select
                if (newSelect) newSelect.focus();
              } else {
                // If this is the last row, just update its state
                budgetApp.expenseState.allocations[name]=parseFloat(input.value)||0; 
                input.classList.add('filled');
                if (select.value !== '') {
                  select.classList.add('filled');
                }
                updateProgress();
              }
            }
          }

          input.addEventListener('blur', tryNext); 
          
          // Add the elements to the row and container
          const inputGroup = document.createElement('div');
          inputGroup.className = 'input-group';
          inputGroup.append(select, input);
          row.append(label, inputGroup); 
          container.appendChild(row);
      }  // End of renderRow function      // Setup event listeners for navigation and inputs
      const takeHomePayInput = document.getElementById('takeHomePayInput');
      takeHomePayInput.classList.add('untouched');
      
      takeHomePayInput.addEventListener('focus', () => {
        takeHomePayInput.classList.remove('untouched');
      });
        takeHomePayInput.addEventListener('blur', function() {
        const pay = parseFloat(this.value);
        if (!isNaN(pay) && pay >= 0) {
          budgetApp.takeHomePay = pay;
          currentRow = 0;
          document.getElementById('progressBars').style.display = 'flex';
          renderRow(currentRow);
          // Focus the first value selector
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
      
      // Initial setup
      renderSavingsGoals();
    });
