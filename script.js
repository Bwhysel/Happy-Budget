document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // Step 1: Savings Goals
  // =======================
  const savingsGoals = [
    "🚨 Emergency Fund",
    "💳 Debt Reduction",
    "🏠 Down Payment",
    "📚 Education",
    "👩‍💼 New Business",
    "🔧 Repairs",
    "👵 Comfortable Old Age",
    "✨ Other",
  ];
  const categories = [
    { name: "Savings & Debt Reduction", emoji: "💰", defaultPct: 0.1 },
    { name: "Housing", emoji: "🏠", defaultPct: 0.3 },
    { name: "Utilities & Internet", emoji: "💡", defaultPct: 0.05 },
    { name: "Groceries & Essentials", emoji: "🛒", defaultPct: 0.1 },
    { name: "Transportation", emoji: "🚌", defaultPct: 0.05 },
    { name: "Health & Insurance", emoji: "❤️", defaultPct: 0.07 },
    { name: "Social, Dining & Entertainment", emoji: "🎉", defaultPct: 0.05 },
    { name: "Phone, Subscriptions & Tech", emoji: "📱", defaultPct: 0.03 },
    { name: "Gifts & Giving", emoji: "🎁", defaultPct: 0.02 },
    { name: "Education & Training", emoji: "📚", defaultPct: 0.05 },
    { name: "Clothing & Self-Care", emoji: "👕", defaultPct: 0.03 },
    { name: "Children & Pets", emoji: "👶", defaultPct: 0.05 },
    { name: "Unexpected & Miscellaneous", emoji: "✨", defaultPct: 0.1 },
  ];
  const personalValues = [
    "Autonomy",
    "Basic Needs",
    "Empowerment",
    "Financial Security",
    "Fun & Leisure",
    "Giving & Helping Others",
    "Health",
    "Learning",
    "None",
    "Respect",
    "Social Connectedness",
  ];
  const unexpectedCategoryName = "Unexpected & Miscellaneous";
  let continueReasonRequested = false;

  // Safely set a property (like textContent or value) on an element, if it exists
  function safeSet(id, prop, value) {
    const el = document.getElementById(id);
    if (el) el[prop] = value;
  }

  const budgetApp = {
    selectedGoals: [],
    takeHomePay: 0,
    happinessLevel: null, // 0–4 representing the selected emoji
    commitment: "", // stores user's commitment

    expenseState: {
      allocations: {},
      getTotal() {
        return Object.values(this.allocations).reduce(
          (sum, val) => sum + (parseFloat(val) || 0),
          0,
        );
      },
    },

    goToStep(n) {
      document.querySelectorAll(".step-segment").forEach((seg) => {
        const stepNum = parseInt(seg.getAttribute("data-step"), 10);
        if (stepNum <= n) {
          seg.classList.add("active");
        } else {
          seg.classList.remove("active");
        }
      });
      // Show or hide the intro message based on the current step
      document.getElementById("introMessage").style.display =
        n === 1 ? "block" : "none";

      document
        .querySelectorAll(".step")
        .forEach((s) => s.classList.remove("active"));

      const nextStep = document.getElementById(`step${n}`);
      nextStep.classList.add("active");

      if (n === 3) {
        renderValueChart();
        renderFeedback();

        const takeHomeSpan = document.getElementById("takeHomeAmount");
        if (takeHomeSpan) {
          takeHomeSpan.textContent = budgetApp.takeHomePay.toLocaleString();
        }

        if (typeof budgetApp.happinessLevel === "number") {
          setEmojiRating(budgetApp.happinessLevel);
        } else {
          document.getElementById("emojiHint").textContent =
            "👉 Tap an emoji to share how your plan feels.";
          document.getElementById("continueTo4").disabled = true;
        }
      } else if (n === 4) {
        renderStep4Summary();
      }
      // Smooth scroll to top of next step after rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(`step${n}`)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      });
    },
  };

  // Calculates remaining unallocated income
  function getRemaining() {
    return budgetApp.takeHomePay - budgetApp.expenseState.getTotal();
  }

  function getPlaceholder(categoryName, defaultPct = 0) {
    if (categoryName === unexpectedCategoryName) {
      return `e.g. ${Math.max(0, Math.round(getRemaining()))}`;
    }
    return `e.g. ${Math.round(budgetApp.takeHomePay * defaultPct)}`;
  }

  function formatCurrency(value) {
    return `$${Math.abs(Math.round(value)).toLocaleString()}`;
  }

  function hasValidTakeHomePay() {
    return Number.isFinite(budgetApp.takeHomePay) && budgetApp.takeHomePay > 0;
  }

  function isRowComplete(row) {
    const sel = row.querySelector("select");
    const inp = row.querySelector("input");
    return !!(sel && inp && sel.value !== "" && inp.value.trim() !== "");
  }

  function setAutoFillStatus(message) {
    safeSet("autoFillStatus", "textContent", message || "");
  }

  function clearAutoFillStatusOnManualEdit() {
    setAutoFillStatus("");
  }

  function setAutoFillHelpVisibility(visible) {
    const helpText = document.getElementById("autoFillHelpText");
    const helpToggle = document.getElementById("autoFillHelpToggle");
    if (!helpText || !helpToggle) return;

    helpText.hidden = !visible;
    helpToggle.setAttribute("aria-expanded", visible ? "true" : "false");
  }

  function setContinueReason(remaining, completed) {
    const continueBtn = document.getElementById("continueTo2_5");
    const reasonEl = document.getElementById("continueReason");
    if (!continueBtn || !reasonEl) return;

    if (!continueBtn.disabled) {
      reasonEl.textContent = "";
      continueReasonRequested = false;
      return;
    }

    if (!continueReasonRequested) {
      reasonEl.textContent = "";
      return;
    }

    const roundedRemaining = Math.round(remaining);
    if (roundedRemaining < 0) {
      reasonEl.textContent = `Continue is disabled: overspent by ${formatCurrency(
        roundedRemaining,
      )}. Reduce one or more category amounts.`;
      return;
    }

    if (roundedRemaining > 0) {
      reasonEl.textContent = `Continue is disabled: ${formatCurrency(
        roundedRemaining,
      )} still unallocated. Add this to a category to continue.`;
      return;
    }

    const incompleteCount = categories.length - completed;
    if (incompleteCount > 0) {
      reasonEl.textContent = `Continue is disabled: ${incompleteCount} categories still need an amount or value.`;
      return;
    }

    reasonEl.textContent = "";
  }

  function syncAutoFillAvailability() {
    const controls = document.getElementById("autoFillControls");
    const autoFillBtn = document.getElementById("autoFillBtn");
    if (!controls || !autoFillBtn) return;

    const rows = document.querySelectorAll("#expenseGrid .expense-row");
    const isAvailable = hasValidTakeHomePay() && rows.length > 0;
    controls.classList.toggle("visible", isAvailable);

    if (!isAvailable) {
      setAutoFillStatus("");
      setAutoFillHelpVisibility(false);
    }
  }

  function applyAutoFill() {
    if (!hasValidTakeHomePay()) {
      return;
    }

    const rows = [...document.querySelectorAll("#expenseGrid .expense-row")];
    if (rows.length === 0) {
      return;
    }

    let amountCount = 0;
    let valueCount = 0;
    let unexpectedAdjusted = false;
    let unexpectedRow = null;

    // Align allocations with current row input values before applying auto-fill.
    rows.forEach((row) => {
      const categoryName = row.dataset.category;
      const input = row.querySelector("input");
      if (!categoryName || !input) return;

      const currentVal = parseFloat(input.value);
      if (input.value.trim() !== "" && !isNaN(currentVal)) {
        budgetApp.expenseState.allocations[categoryName] = currentVal;
        input.classList.add("filled");
        input.classList.remove("untouched");
      } else {
        delete budgetApp.expenseState.allocations[categoryName];
      }
    });

    // First pass: fill empty non-unexpected categories and blank value selections.
    rows.forEach((row) => {
      const categoryName = row.dataset.category;
      const input = row.querySelector("input");
      const select = row.querySelector("select");
      const category = categories.find((c) => c.name === categoryName);
      if (!categoryName || !input || !select || !category) return;

      if (categoryName === unexpectedCategoryName) {
        unexpectedRow = row;
      }

      if (select.value.trim() === "") {
        select.value = "None";
        select.classList.add("filled");
        select.classList.remove("untouched");
        valueCount++;
      }

      if (categoryName === unexpectedCategoryName) return;

      if (input.value.trim() === "") {
        const defaultAmount = Math.round(
          budgetApp.takeHomePay * category.defaultPct,
        );
        input.value = defaultAmount;
        input.classList.add("filled");
        input.classList.remove("untouched");
        budgetApp.expenseState.allocations[categoryName] = defaultAmount;
        amountCount++;
      }
    });

    // Handle Unexpected & Miscellaneous after other categories are finalized.
    if (unexpectedRow) {
      const unexpectedInput = unexpectedRow.querySelector("input");
      if (unexpectedInput) {
        if (unexpectedInput.value.trim() === "") {
          const fillAmount = Math.max(0, Math.round(getRemaining()));
          unexpectedInput.value = fillAmount;
          unexpectedInput.classList.add("filled");
          unexpectedInput.classList.remove("untouched");
          budgetApp.expenseState.allocations[unexpectedCategoryName] =
            fillAmount;
          amountCount++;
        }

        const allRowsFilled = rows.every((row) => isRowComplete(row));
        const roundedRemaining = Math.round(getRemaining());

        if (allRowsFilled && roundedRemaining !== 0) {
          const currentUnexpected = parseFloat(unexpectedInput.value);
          if (!isNaN(currentUnexpected)) {
            const rebalancedUnexpected = Math.max(
              0,
              currentUnexpected + roundedRemaining,
            );
            if (rebalancedUnexpected !== currentUnexpected) {
              unexpectedInput.value = rebalancedUnexpected;
              budgetApp.expenseState.allocations[unexpectedCategoryName] =
                rebalancedUnexpected;
              unexpectedAdjusted = true;
            }
          }
        }
      }
    }

    updateProgress();
    updateExpensePlaceholders();
    syncAutoFillAvailability();

    if (amountCount === 0 && valueCount === 0 && !unexpectedAdjusted) {
      setAutoFillStatus("No changes made. All categories already had amounts.");
      return;
    }

    let statusMessage = `Auto-Fill set ${valueCount} values to None and set ${amountCount} amounts to defaults.`;
    if (unexpectedAdjusted) {
      statusMessage += " Unexpected & Misc was adjusted to rebalance.";
    }
    setAutoFillStatus(statusMessage);
  }

  function updateExpensePlaceholders() {
    const rows = document.querySelectorAll("#expenseGrid .expense-row");
    rows.forEach((row) => {
      const categoryName = row.dataset.category;
      const input = row.querySelector("input");
      const category = categories.find((c) => c.name === categoryName);

      if (input && category) {
        input.placeholder = getPlaceholder(category.name, category.defaultPct);
      }
    });
  }
  // =======================
  // Step 2: Income & Expense Grid
  // =======================

  // Updates category and budget progress bars and button states
  function updateProgress() {
    const continueBtn = document.getElementById("continueTo2_5");
    const totalAlloc = budgetApp.expenseState.getTotal();
    const remaining = getRemaining();

    const bp = document.getElementById("budgetProgress");
    if (remaining < 0) {
      bp.classList.add("negative");
      document.getElementById("remainingLabel").innerHTML =
        `<span class="overspent-label">⚠️ ($${Math.abs(
          Math.round(remaining),
        ).toLocaleString()} overspent)</span>`;
    } else {
      bp.classList.remove("negative");
      document.getElementById("remainingLabel").textContent = `($${Math.max(
        0,
        Math.round(remaining),
      ).toLocaleString()} remaining)`;
    }

    bp.value = hasValidTakeHomePay()
      ? Math.min(100, Math.round((totalAlloc / budgetApp.takeHomePay) * 100))
      : 0;

    const rows = document.querySelectorAll("#expenseGrid .expense-row");
    let completed = 0;
    rows.forEach((row) => {
      const sel = row.querySelector("select");
      const inp = row.querySelector("input");
      if (sel && inp && sel.value !== "" && inp.value.trim() !== "")
        completed++;
    });
    document.getElementById("categoryProgress").value = completed;
    document.getElementById("categoryLabel").textContent = completed;
    const roundedRemaining = Math.round(remaining);
    continueBtn.disabled = !(
      roundedRemaining === 0 && completed === categories.length
    );

    //update the final placeholder for unexpected expenses
    const lastInput = document.querySelector(
      '.expense-row[data-category="Unexpected & Miscellaneous"] input',
    );
    if (lastInput) {
      lastInput.placeholder = getPlaceholder("Unexpected & Miscellaneous");
    }

    setContinueReason(remaining, completed);
    syncAutoFillAvailability();
  }

  function renderSavingsGoals() {
    const ctr = document.getElementById("savingsGoalsList");
    ctr.innerHTML = "";
    savingsGoals.forEach((goal) => {
      const chip = document.createElement("div");
      chip.className = "chip";
      chip.textContent = goal;
      chip.onclick = () => {
        chip.classList.toggle("active");
        const sel = [
          ...document.querySelectorAll("#savingsGoalsList .chip.active"),
        ].map((el) => el.textContent);
        budgetApp.selectedGoals = sel;
        document.getElementById("continueButtonSavings").disabled =
          sel.length === 0;
      };
      ctr.appendChild(chip);
    });
  }
  // Handles input focus and blur to manage untouched state
  function renderRow(idx) {
    const { name, emoji, defaultPct } = categories[idx];
    const container = document.getElementById("expenseGrid");
    const row = document.createElement("div");
    row.className = "expense-row";
    row.dataset.category = name;

    const label = document.createElement("label");
    label.textContent = `${emoji} ${name}`;

    const select = document.createElement("select");
    select.innerHTML = '<option value="">Why this matters...</option>';
    personalValues.forEach((val) => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
    select.classList.add("untouched");

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "10";
    input.classList.add("untouched");

    if (name === "Unexpected & Miscellaneous") {
      input.id = "unexpectedInput";
    }

    input.placeholder = getPlaceholder(name, defaultPct);

    // 🔁 Event: Select changed
    select.addEventListener("change", () => {
      clearAutoFillStatusOnManualEdit();
      if (select.value.trim() !== "") {
        select.classList.add("filled");
      } else {
        select.classList.remove("filled");
      }
      updateProgress();
    });

    select.addEventListener("keydown", (e) => {
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        select.value.trim() !== ""
      ) {
        e.preventDefault();
        input.focus();
      }
    });

    // 🔁 Event: Dollar input changed
    input.addEventListener("input", () => {
      clearAutoFillStatusOnManualEdit();
      updateProgress();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    input.addEventListener("blur", () => {
      clearAutoFillStatusOnManualEdit();
      const val = parseFloat(input.value);
      if (!isNaN(val)) {
        budgetApp.expenseState.allocations[name] = val;
        input.classList.add("filled");
      } else {
        input.classList.remove("filled");
        delete budgetApp.expenseState.allocations[name];
      }
      updateProgress();

      // only move forward if both select and input filled
      if (select.value && input.value.trim() !== "") {
        focusNextSelect(row);
      }
    });

    input.addEventListener("focus", () => input.classList.remove("untouched"));
    select.addEventListener("focus", () =>
      select.classList.remove("untouched"),
    );

    const inputGroup = document.createElement("div");
    inputGroup.className = "input-group";
    inputGroup.append(select, input);
    row.append(label, inputGroup);
    container.appendChild(row);

    // ✅ Focus first select on first row
    if (idx === 0) {
      // Desktop: move focus to the first select for faster entry.
      // Mobile: only scroll into view to avoid auto‑opening the picker.
      if (window.innerWidth > 768) {
        select.focus();
      } else {
        select.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }
  // Focuses the next select element in the grid
  function focusNextSelect(currentRow) {
    const allRows = [...document.querySelectorAll("#expenseGrid .expense-row")];
    const currentIdx = allRows.indexOf(currentRow);
    const nextRow = allRows[currentIdx + 1];

    if (nextRow) {
      const nextSelect = nextRow.querySelector("select");
      if (window.innerWidth > 768) {
        // On desktop, move focus to the next select
        nextSelect?.focus();
      } else {
        // On mobile, scroll the next select into view without opening it
        nextSelect?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      document.getElementById("continueTo2_5")?.focus();
    }
  }

  const takeHomePayInput = document.getElementById("takeHomePayInput");
  const autoFillBtn = document.getElementById("autoFillBtn");
  const autoFillHelpToggle = document.getElementById("autoFillHelpToggle");
  const step2 = document.getElementById("step2");
  takeHomePayInput.classList.add("untouched");

  takeHomePayInput.addEventListener("focus", () => {
    takeHomePayInput.classList.remove("untouched");
  });

  takeHomePayInput.addEventListener("blur", function () {
    const pay = parseFloat(this.value);
    if (!isNaN(pay) && pay >= 0) {
      budgetApp.takeHomePay = pay;
      document.getElementById("progressBars").classList.add("visible");

      const container = document.getElementById("expenseGrid");
      if (container.children.length === 0) {
        categories.forEach((_, idx) => renderRow(idx));
      } else {
        updateExpensePlaceholders();
      }
      updateProgress();
      syncAutoFillAvailability();

      // 👉 Show the reflection reminder
      const reminder = document.getElementById("valuesReminder");
      reminder.style.display = "block";
      setTimeout(() => reminder.classList.add("show"), 10);
    }
    if (this.value.trim() !== "") {
      takeHomePayInput.classList.add("filled");
    }
  });

  // Add event listener for the input field to update progress
  takeHomePayInput.addEventListener("input", () => {
    clearAutoFillStatusOnManualEdit();
    const pay = parseFloat(takeHomePayInput.value);
    if (!isNaN(pay) && pay >= 0) {
      budgetApp.takeHomePay = pay;
      updateProgress();
      syncAutoFillAvailability();
    }
  });
  takeHomePayInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // ← this is now valid
      this.blur(); // triggers the blur handler
    }
  });

  if (autoFillBtn) {
    autoFillBtn.addEventListener("click", applyAutoFill);
  }

  if (step2) {
    step2.addEventListener("pointerdown", (e) => {
      const continueBtn = document.getElementById("continueTo2_5");
      if (!continueBtn || !continueBtn.disabled) return;

      const rect = continueBtn.getBoundingClientRect();
      const clickedWithinContinue =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (clickedWithinContinue) {
        continueReasonRequested = true;
        updateProgress();
      }
    });
  }

  if (autoFillHelpToggle) {
    autoFillHelpToggle.addEventListener("click", () => {
      const expanded =
        autoFillHelpToggle.getAttribute("aria-expanded") === "true";
      setAutoFillHelpVisibility(!expanded);
    });

    autoFillHelpToggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const expanded =
          autoFillHelpToggle.getAttribute("aria-expanded") === "true";
        setAutoFillHelpVisibility(!expanded);
      }
    });
  }

  const backTo1Btn = document.getElementById("backTo1");
  if (backTo1Btn) {
    backTo1Btn.addEventListener("click", () => {
      budgetApp.goToStep(1);
    });
  }

  document
    .getElementById("continueButtonSavings")
    .addEventListener("click", () => {
      if (budgetApp.selectedGoals.length > 0) {
        budgetApp.goToStep(2);
      }
    });

  renderSavingsGoals();
  document
    .querySelector('.step-segment[data-step="1"]')
    ?.classList.add("active");

  // =======================
  // Step 3: Reflect & Feedback
  // =======================

  // Displays value-based spending chart with interactive breakdown
  function renderValueChart() {
    const chart = document.getElementById("valueChart");
    chart.innerHTML = "";
    const values = {};

    const rows = document.querySelectorAll("#expenseGrid .expense-row");
    rows.forEach((row) => {
      const val = row.querySelector("select")?.value;
      const amt = parseFloat(row.querySelector("input")?.value || 0);
      if (val && amt) {
        values[val] = (values[val] || 0) + amt;
      }
    });

    const total = Object.values(values).reduce((a, b) => a + b, 0);
    Object.entries(values).forEach(([label, amount]) => {
      const pct = Math.round((amount / total) * 100);
      const bar = document.createElement("div");
      const barContainer = document.createElement("div");
      barContainer.className = "value-bar-container";

      // Create the value bar
      const valueBar = document.createElement("div");
      valueBar.className = "value-bar";
      valueBar.style.width = `${pct}%`;
      valueBar.textContent = `$${amount.toLocaleString()}`;
      barContainer.appendChild(valueBar);

      // Create expandable details section
      const details = document.createElement("div");
      details.className = "value-details";

      // Get all expenses for this value
      let valueDetails = [];
      let totalForValue = 0;
      document.querySelectorAll("#expenseGrid .expense-row").forEach((row) => {
        if (row.querySelector("select")?.value === label) {
          const category = row.dataset.category;
          const amount = parseFloat(row.querySelector("input")?.value || 0);
          if (amount > 0) {
            valueDetails.push({ category, amount });
            totalForValue += amount;
          }
        }
      });

      // Add expense details
      valueDetails.forEach(({ category, amount }) => {
        const item = document.createElement("div");
        item.className = "value-details-item";
        item.innerHTML = `
          <span>${category}</span>
          <span>$${amount.toLocaleString()}</span>
        `;
        details.appendChild(item);
      });

      // Add total
      const totalItem = document.createElement("div");
      totalItem.className = "value-details-item";
      totalItem.innerHTML = `
        <span>Total for ${label}</span>
        <span>$${totalForValue.toLocaleString()}</span>
      `;
      details.appendChild(totalItem);

      bar.innerHTML = `<strong>${label}</strong>`;
      bar.appendChild(barContainer);
      bar.appendChild(details);

      barContainer.addEventListener("click", () => {
        // Toggle details visibility
        const wasVisible = details.classList.contains("visible");
        document
          .querySelectorAll(".value-details")
          .forEach((d) => d.classList.remove("visible"));
        if (!wasVisible) {
          details.classList.add("visible");
        }
      });

      chart.appendChild(bar);
    });
  }

  // Provides personalized feedback based on budget allocation
  function renderFeedback() {
    const savings =
      budgetApp.expenseState.allocations["Savings & Debt Reduction"] || 0;
    const housing = budgetApp.expenseState.allocations["Housing"] || 0;
    const takeHome = budgetApp.takeHomePay;

    const savingsPct = (savings / takeHome) * 100;
    const savingsGoals = budgetApp.selectedGoals.join(", ") || "your goals";
    document.getElementById("savingsFeedback").textContent =
      savingsPct < 10
        ? `⚠️ You're saving just ${Math.round(
            savingsPct,
          )}% of your take-home pay. Your savings goals include ${savingsGoals}. Would you like to revisit your budget to save a bit more and reach your goals sooner?`
        : `🎉 Great job saving ${Math.round(
            savingsPct,
          )}% of your take-home pay! Your savings goals include ${savingsGoals}. Would you still like to revisit your budget to save a bit more and reach your goals sooner?`;

    const housingPct = (housing / takeHome) * 100;
    document.getElementById("housingFeedback").textContent =
      housingPct > 35
        ? `⚠️ Housing takes up ${Math.round(
            housingPct,
          )}% of your income. Is this sustainable? Can you reduce housing costs or increase income?`
        : `💡 Housing is ${Math.round(
            housingPct,
          )}% of income. That looks reasonable.`;

    const used = new Set();
    document.querySelectorAll("#expenseGrid .expense-row").forEach((row) => {
      const val = row.querySelector("select")?.value;
      const amt = parseFloat(row.querySelector("input")?.value || 0);
      if (val && amt > 0) used.add(val);
    });
    const all = [
      "Autonomy",
      "Basic Needs",
      "Empowerment",
      "Financial Security",
      "Fun & Leisure",
      "Giving & Helping Others",
      "Health",
      "Learning",
      "None",
      "Respect",
      "Social Connectedness",
    ];
    const unused = all.filter((v) => !used.has(v));
    document.getElementById("zeroValueFeedback").textContent = unused.length
      ? `💡 You didn’t allocate anything to: ${unused.join(", ")}.`
      : `✅ You allocated something to every value.`;
  }
  // Visually selects the emoji rating and updates UI feedback
  function setEmojiRating(idx) {
    const emojis = document.querySelectorAll(
      "#satisfactionCheck .emoji-rating span",
    );
    emojis.forEach((e) => e.classList.remove("active"));
    emojis[idx]?.classList.add("active");

    budgetApp.happinessLevel = idx;

    const hint = document.getElementById("emojiHint");
    const backButton = document.getElementById("backTo2From3");

    if (idx <= 2) {
      hint.textContent = "🔄 Consider going back to make a happier plan.";
      backButton.classList.add("pulse");
    } else {
      hint.textContent = "👍🏻 Great! Your plan aligns with your happiness.";
      backButton.classList.remove("pulse");
    }

    document.getElementById("continueTo4").disabled = false;
  }

  // Prepares and downloads the user's budget data as a JSON file

  function saveFinalData() {
    // Get the current date for the filename
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const data = {
      savedOn: now.toISOString(),
      goals: budgetApp.selectedGoals,
      takeHomePay: budgetApp.takeHomePay,
      allocations: budgetApp.expenseState.allocations,
      values: {}, // Store values for each category
      goalReflection: document.getElementById("goalReflection")?.value || "",
      commitment: document.getElementById("commitmentText")?.value || "",
      happinessLevel: budgetApp.happinessLevel,
    };

    try {
      // Collect values for each category
      document.querySelectorAll(".expense-row").forEach((row) => {
        const category = row.dataset.category;
        const value = row.querySelector("select")?.value;
        if (category && value) {
          data.values[category] = value;
        }
      });

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // download as Happy-Budget-Helper-YYYY-MM-DD.json
      a.download = `Happy-Budget-Helper-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Show success message
      const saveBtn = document.getElementById("saveBudgetBtn");
      const originalText = saveBtn.textContent;
      saveBtn.textContent = "Saved! ✅";
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error("Error saving budget:", err);
      alert("Error saving budget. Please try again.");
    }
  }
  document
    .querySelectorAll("#satisfactionCheck .emoji-rating span")
    .forEach((span, idx) => {
      span.addEventListener("click", () => setEmojiRating(idx));
    });

  document
    .getElementById("continueTo2_5")
    .addEventListener("click", () => budgetApp.goToStep(3));

  document
    .getElementById("backTo2From3")
    ?.addEventListener("click", () => budgetApp.goToStep(2));

  document.getElementById("continueTo4").addEventListener("click", () => {
    budgetApp.goToStep(4);
    renderStep4Summary();
  });
  // =======================
  // Step 4: Final Summary & Commit
  // =======================
  function updateSummaryDisplay() {
    // Update savings goals
    const goalsList = document.getElementById("selectedGoalsList");
    if (goalsList) {
      goalsList.innerHTML = "";
      budgetApp.selectedGoals.forEach((goal) => {
        const chip = document.createElement("div");
        chip.className = "goal-chip";
        chip.textContent = goal;
        goalsList.appendChild(chip);
      });
    }

    // Update goal text
    let rawText = document.getElementById("goalReflection")?.value || "";
    let trimmed = rawText.trim();
    safeSet("goalTextDisplay", "textContent", trimmed ? `“${trimmed}”` : "");
    const el = document.getElementById("goalTextDisplay");
    if (el) el.style.display = trimmed ? "block" : "none";

    // Update commitment text
    safeSet("commitmentDisplay", "textContent", budgetApp.commitment || "");

    // Update emoji
    const emojiMap = ["😢", "😕", "😐", "😊", "😁"];
    const emoji = emojiMap[budgetApp.happinessLevel] || "";
    safeSet("happinessEmoji", "textContent", emoji);
  }

  // Shows final savings, values, and budget summary on Step 4
  function renderStep4Summary() {
    // Render savings goals
    updateSummaryDisplay();

    // Render budget categories table
    const tableBody = document.querySelector("#budgetSummaryTable tbody");
    tableBody.innerHTML = "";
    const totalMonthly = budgetApp.expenseState.getTotal();

    categories.forEach(({ name, emoji }) => {
      const amount = budgetApp.expenseState.allocations[name] || 0;
      const pct = ((amount / totalMonthly) * 100).toFixed(1);

      // Find associated value
      const row = document.querySelector(
        `.expense-row[data-category="${name}"]`,
      );
      const value = row ? row.querySelector("select")?.value || "None" : "None";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emoji} ${name}</td>
        <td>${value}</td>
        <td>$${amount.toLocaleString()}</td>
        <td>${pct}%</td>
      `;
      tableBody.appendChild(tr);
    });

    // Update total
    document.getElementById("totalMonthlyBudget").textContent =
      `$${totalMonthly.toLocaleString()}`;
  }

  document
    .getElementById("loadBudgetInput")
    .addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);

          // 🔄 Clear previous data and UI before loading new budget
          budgetApp.expenseState.allocations = {};
          budgetApp.selectedGoals = [];
          budgetApp.goalReflection = "";
          budgetApp.commitment = "";
          budgetApp.happinessLevel = null;

          safeSet("takeHomePayInput", "value", "");
          safeSet("goalReflection", "value", "");
          safeSet("commitmentText", "value", "");

          // Remove all category rows from both grid and summary
          document.getElementById("expenseGrid")?.replaceChildren();

          // Validate the data
          if (!data.goals || !data.takeHomePay || !data.allocations) {
            throw new Error("Invalid budget file format");
          }

          // Load savings goals
          budgetApp.selectedGoals = data.goals;
          document
            .querySelectorAll("#savingsGoalsList .chip")
            .forEach((chip) => {
              if (data.goals.includes(chip.textContent)) {
                chip.classList.add("active");
              } else {
                chip.classList.remove("active");
              }
            });
          document.getElementById("continueButtonSavings").disabled =
            data.goals.length === 0;

          // Load take home pay
          budgetApp.takeHomePay = data.takeHomePay;
          const takeHomePayInput = document.getElementById("takeHomePayInput");
          takeHomePayInput.value = data.takeHomePay;
          takeHomePayInput.classList.add("filled"); // Load allocations and values
          const reminder = document.getElementById("valuesReminder");
          if (reminder) {
            reminder.style.display = "block";
            setTimeout(() => reminder.classList.add("show"), 10);
          }

          budgetApp.expenseState.allocations = data.allocations;
          document.getElementById("progressBars").classList.add("visible");

          // Render all rows first
          categories.forEach((_, idx) => {
            renderRow(idx);
          });

          // Now populate all rows with saved data
          categories.forEach((cat, idx) => {
            const row = document.querySelectorAll("#expenseGrid .expense-row")[
              idx
            ];
            if (row) {
              const select = row.querySelector("select");
              const input = row.querySelector("input");
              const value = data.values?.[cat.name];
              const amount = data.allocations[cat.name];

              if (select && value) {
                select.classList.remove("untouched");
                select.value = value;
                select.classList.add("filled");
              }

              if (input && amount !== undefined && amount !== null) {
                input.classList.remove("untouched");
                input.value = amount;
                input.classList.add("filled");
              }
            }
          });

          // Update all progress
          updateProgress(); // If commitment exists, prepare it
          syncAutoFillAvailability();
          setAutoFillStatus("");
          if (data.goalReflection) {
            safeSet("goalReflection", "value", data.goalReflection);
            budgetApp.goalReflection = data.goalReflection;
          }

          if (data.commitment) {
            safeSet("commitmentText", "value", data.commitment);
          }

          // Restore happiness level if it exists
          if (typeof data.happinessLevel === "number") {
            setEmojiRating(data.happinessLevel);
          }

          // Show success message
          alert("Budget loaded successfully! 📊");
        } catch (err) {
          console.error("Error loading budget:", err);
          alert(
            "Error loading budget file. Please make sure you selected a valid Happy Budget file.",
          );
        }
      };
      reader.readAsText(file);
    });
  // Add print, save, and load button event listeners
  const printBtn = document.getElementById("printBudgetBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  const saveBtn = document.getElementById("saveBudgetBtn");
  if (saveBtn) {
    saveBtn.addEventListener("click", saveFinalData);
  }

  const loadBtn = document.getElementById("loadBudgetBtn");
  const loadInput = document.getElementById("loadBudgetInput");

  if (loadBtn && loadInput) {
    loadBtn.addEventListener("click", () => {
      loadInput.click();
    });
  }

  document.getElementById("commitmentText")?.addEventListener("input", (e) => {
    budgetApp.commitment = e.target.value;
  });

  window.budgetApp = budgetApp;
  document.querySelector(".toolkit-btn")?.addEventListener("click", () => {
    window.open(
      "https://decisionfish.com/toolkit",
      "_blank",
      "noopener,noreferrer",
    );
  });

  // End of the DOMContentLoaded event listener
});
