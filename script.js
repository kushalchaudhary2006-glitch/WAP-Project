// =============================================
//  script.js — SpendWise Expense Tracker
//  Handles: Transactions (CRUD, filter, search)
//           Balance summary cards + navbar
//           Toast notifications
//           Currency Converter (live INR rates)
// =============================================

// ─── DATA STORE ──────────────────────────────
let transactions = JSON.parse(localStorage.getItem("spendwise_txns") || "[]");

function saveData() {
  localStorage.setItem("spendwise_txns", JSON.stringify(transactions));
}

// ─── CATEGORY EMOJI MAP ───────────────────────
const categoryEmoji = {
  Food:          "🍔",
  Transport:     "🚗",
  Shopping:      "🛍",
  Health:        "💊",
  Entertainment: "🎬",
  Salary:        "💼",
  Other:         "📦",
};

// ─── SUMMARY / BALANCE ────────────────────────
function updateSummary() {
  let income  = 0;
  let expense = 0;
  transactions.forEach(t => {
    if (t.type === "income")  income  += t.amount;
    else                      expense += t.amount;
  });
  const balance = income - expense;

  const fmt = n => "₹" + Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  document.getElementById("totalIncome").textContent  = fmt(income);
  document.getElementById("totalExpense").textContent = fmt(expense);

  const balEl = document.getElementById("totalBalance");
  balEl.textContent = (balance < 0 ? "-" : "") + fmt(balance);
  balEl.style.color = balance < 0 ? "var(--red)" : "var(--blue)";

  const navEl = document.getElementById("navBalance");
  navEl.textContent = (balance < 0 ? "-" : "+") + fmt(balance);
  navEl.style.color = balance < 0 ? "var(--red)" : "var(--green)";
}

// ─── RENDER TRANSACTIONS ─────────────────────
function renderTransactions() {
  const search   = (document.getElementById("searchInput").value   || "").toLowerCase();
  const typeF    =  document.getElementById("filterType").value;
  const catF     =  document.getElementById("filterCategory").value;
  const dateF    =  document.getElementById("filterDate").value;

  const list = document.getElementById("txnList");
  list.innerHTML = "";

  const filtered = transactions.filter(t => {
    if (search && !t.title.toLowerCase().includes(search)) return false;
    if (typeF !== "all" && t.type !== typeF)               return false;
    if (catF  !== "all" && t.category !== catF)            return false;
    if (dateF && t.date !== dateF)                         return false;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">No transactions found.</div>';
    return;
  }

  // newest first
  [...filtered].reverse().forEach(t => {
    const card = document.createElement("div");
    card.className = "txn-card";
    card.innerHTML = `
      <div class="txn-left">
        <div class="txn-emoji">${categoryEmoji[t.category] || "📦"}</div>
        <div class="txn-info">
          <div class="txn-name">${escHtml(t.title)}</div>
          <div class="txn-meta">
            <span class="txn-badge badge-${t.type}">${t.type}</span>
            <span>${t.category}</span>
            <span>•</span>
            <span>${formatDate(t.date)}</span>
          </div>
        </div>
      </div>
      <div class="txn-right">
        <div class="txn-amount amount-${t.type}">
          ${t.type === "income" ? "+" : "−"}₹${t.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </div>
        <div class="txn-actions">
          <button class="btn-edit"   onclick="startEdit('${t.id}')">Edit</button>
          <button class="btn-delete" onclick="deleteTransaction('${t.id}')">Delete</button>
        </div>
      </div>
    `;
    list.appendChild(card);
  });
}

function escHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ─── ADD / EDIT TRANSACTION ──────────────────
document.addEventListener("DOMContentLoaded", function () {
  // Set today as default date
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("txnDate").value = today;

  // Form submit
  document.getElementById("txnForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const id     = document.getElementById("editId").value;
    const title  = document.getElementById("txnTitle").value.trim();
    const amount = parseFloat(document.getElementById("txnAmount").value);
    const type   = document.getElementById("txnType").value;
    const cat    = document.getElementById("txnCategory").value;
    const date   = document.getElementById("txnDate").value;

    if (!title || !amount || amount <= 0 || !date) {
      showToast("Please fill in all fields correctly.", "error");
      return;
    }

    if (id) {
      // Edit existing
      const idx = transactions.findIndex(t => t.id === id);
      if (idx !== -1) {
        transactions[idx] = { id, title, amount, type, category: cat, date };
        showToast("Transaction updated!", "success");
      }
    } else {
      // Add new
      transactions.push({
        id:       Date.now().toString(),
        title, amount, type, category: cat, date
      });
      showToast("Transaction added!", "success");
    }

    saveData();
    updateSummary();
    renderTransactions();
    resetForm();
  });

  // Cancel edit button
  document.getElementById("cancelEdit").addEventListener("click", resetForm);

  // Filter inputs → live re-render
  ["searchInput","filterType","filterCategory","filterDate"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderTransactions);
    document.getElementById(id).addEventListener("change", renderTransactions);
  });

  // Currency converter — Enter key
  const cInput = document.getElementById("convertAmount");
  if (cInput) {
    cInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") convertCurrency();
    });
  }

  // Initial render
  updateSummary();
  renderTransactions();
});

function resetForm() {
  document.getElementById("txnForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "Add Transaction";
  document.getElementById("submitBtn").textContent = "Add Transaction";
  document.getElementById("cancelEdit").style.display = "none";
  // Restore default date
  document.getElementById("txnDate").value = new Date().toISOString().split("T")[0];
}

// function startEdit(id) {
//   const t = transactions.find(t => t.id === id);
//   if (!t) return;

//   document.getElementById("editId").value       = t.id;
//   document.getElementById("txnTitle").value     = t.title;
//   document.getElementById("txnAmount").value    = t.amount;
//   document.getElementById("txnType").value      = t.type;
//   document.getElementById("txnCategory").value  = t.category;
//   document.getElementById("txnDate").value      = t.date;

//   document.getElementById("formTitle").textContent  = "Edit Transaction";
//   document.getElementById("submitBtn").textContent  = "Save Changes";
//   document.getElementById("cancelEdit").style.display = "inline-block";

//   document.getElementById("txnForm").scrollIntoView({ behavior: "smooth", block: "start" });
// }

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  updateSummary();
  renderTransactions();
  showToast("Transaction deleted.", "success");
}

// ─── RESET FILTERS ────────────────────────────
function resetFilters() {
  document.getElementById("searchInput").value    = "";
  document.getElementById("filterType").value     = "all";
  document.getElementById("filterCategory").value = "all";
  document.getElementById("filterDate").value     = "";
  renderTransactions();
}

// ─── TOAST ───────────────────────────────────
let toastTimer = null;
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className   = `toast ${type} show`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 2800);
}

// ─── CURRENCY CONVERTER ───────────────────────
const EXCHANGE_API = "https://api.exchangerate-api.com/v4/latest/INR";
let cachedRates    = null;
let cacheTimestamp = null;
const CACHE_TTL    = 10 * 60 * 1000; // 10 minutes

async function fetchExchangeRates() {
  const now = Date.now();
  if (cachedRates && cacheTimestamp && (now - cacheTimestamp < CACHE_TTL)) {
    return cachedRates;
  }
  const response = await fetch(EXCHANGE_API);
  const data     = await response.json();
  cachedRates    = data.rates;
  cacheTimestamp = now;
  return cachedRates;
}

async function convertCurrency() {
  const amount     = parseFloat(document.getElementById("convertAmount").value);
  const toCurrency = document.getElementById("convertTo").value;
  const resultEl   = document.getElementById("convertResult");
  const btn        = document.getElementById("convertBtn");

  if (!amount || amount <= 0) {
    resultEl.textContent = "Enter a valid amount above.";
    resultEl.className   = "convert-result error";
    return;
  }

  btn.disabled         = true;
  btn.textContent      = "Fetching...";
  resultEl.textContent = "Getting live rates...";
  resultEl.className   = "convert-result loading";

  try {
    const rates = await fetchExchangeRates();
    const rate  = rates[toCurrency];
    if (!rate) throw new Error("Currency not found");

    const converted = (amount * rate).toFixed(2);
    const flag      = getCurrencyFlag(toCurrency);

    resultEl.innerHTML = `
      ${flag} <strong>₹${amount.toLocaleString("en-IN")}</strong>
      &nbsp;=&nbsp;
      <strong>${converted} ${toCurrency}</strong>
      <span class="convert-rate">1 INR = ${rate.toFixed(6)} ${toCurrency}</span>
    `;
    resultEl.className = "convert-result success";

  } catch (err) {
    resultEl.textContent = "Failed to fetch rates. Check your connection.";
    resultEl.className   = "convert-result error";
  } finally {
    btn.disabled    = false;
    btn.textContent = "Convert";
  }
}

function getCurrencyFlag(code) {
  const flags = {
    USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧", JPY:"🇯🇵",
    AUD:"🇦🇺", CAD:"🇨🇦", CHF:"🇨🇭", CNY:"🇨🇳",
    SGD:"🇸🇬", AED:"🇦🇪", SAR:"🇸🇦", THB:"🇹🇭",
    MYR:"🇲🇾", IDR:"🇮🇩", BDT:"🇧🇩", PKR:"🇵🇰",
  };
  return flags[code] || "💱";
}