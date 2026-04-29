// =============================================
// SpendWise — Expense Tracker (Final JS)
// =============================================

// ─── DATA STORE ──────────────────────────────
let transactions = JSON.parse(localStorage.getItem("spendwise_txns") || "[]");

function saveData() {
  localStorage.setItem("spendwise_txns", JSON.stringify(transactions));
}

// ─── CATEGORY EMOJI ──────────────────────────
const categoryEmoji = {
  Food: "🍔",
  Transport: "🚗",
  Shopping: "🛍",
  Health: "💊",
  Entertainment: "🎬",
  Salary: "💼",
  Other: "📦",
};

// ─── SUMMARY ─────────────────────────────────
function updateSummary() {
  let income = 0;
  let expense = 0;

  transactions.forEach(t => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });

  const balance = income - expense;

  const fmt = n =>
    "₹" + Math.abs(n).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  document.getElementById("totalIncome").textContent = fmt(income);
  document.getElementById("totalExpense").textContent = fmt(expense);

  const balEl = document.getElementById("totalBalance");
  balEl.textContent = (balance < 0 ? "-" : "") + fmt(balance);
  balEl.style.color = balance < 0 ? "red" : "blue";

  const navEl = document.getElementById("navBalance");
  navEl.textContent = (balance < 0 ? "-" : "+") + fmt(balance);
  navEl.style.color = balance < 0 ? "red" : "green";
}

// ─── RENDER TRANSACTIONS ─────────────────────
function renderTransactions() {
  const search = (document.getElementById("searchInput").value || "").toLowerCase();
  const typeF = document.getElementById("filterType").value;
  const catF = document.getElementById("filterCategory").value;
  const dateF = document.getElementById("filterDate").value;

  const list = document.getElementById("txnList");
  list.innerHTML = "";

  const filtered = transactions.filter(t => {
    if (search && !t.title.toLowerCase().includes(search)) return false;
    if (typeF !== "all" && t.type !== typeF) return false;
    if (catF !== "all" && t.category !== catF) return false;
    if (dateF && t.date !== dateF) return false;
    return true;
  });

  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state">No transactions found.</div>';
    return;
  }

  [...filtered].reverse().forEach(t => {
    const card = document.createElement("div");
    card.className = "txn-card";

    card.innerHTML = `
      <div class="txn-left">
        <div class="txn-emoji">${categoryEmoji[t.category] || "📦"}</div>
        <div>
          <div class="txn-name">${t.title}</div>
          <div class="txn-meta">${t.category} • ${formatDate(t.date)}</div>
        </div>
      </div>

      <div class="txn-right">
        <div class="txn-amount ${t.type}">
          ${t.type === "income" ? "+" : "-"}₹${t.amount}
        </div>
        <div>
          <button onclick="startEdit('${t.id}')">Edit</button>
          <button onclick="deleteTransaction('${t.id}')">Delete</button>
        </div>
      </div>
    `;

    list.appendChild(card);
  });
}

// ─── DATE FORMAT ─────────────────────────────
function formatDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

// ─── ADD / EDIT TRANSACTION ──────────────────
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("txnDate").value = today;

  document.getElementById("txnForm").addEventListener("submit", e => {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    const title = document.getElementById("txnTitle").value.trim();
    const amount = parseFloat(document.getElementById("txnAmount").value);
    const type = document.getElementById("txnType").value;
    const category = document.getElementById("txnCategory").value;
    const date = document.getElementById("txnDate").value;

    if (!title || !amount || amount <= 0) {
      showToast("Fill all fields correctly", "error");
      return;
    }

    if (id) {
      const index = transactions.findIndex(t => t.id === id);
      transactions[index] = { id, title, amount, type, category, date };
      showToast("Updated!", "success");
    } else {
      transactions.push({
        id: Date.now().toString(),
        title,
        amount,
        type,
        category,
        date,
      });
      showToast("Added!", "success");
    }

    saveData();
    updateSummary();
    renderTransactions();
    resetForm();
  });

  document.getElementById("cancelEdit").addEventListener("click", resetForm);

  ["searchInput", "filterType", "filterCategory", "filterDate"].forEach(id => {
    document.getElementById(id).addEventListener("input", renderTransactions);
  });

  updateSummary();
  renderTransactions();
});

// ─── EDIT ────────────────────────────────────
function startEdit(id) {
  const t = transactions.find(t => t.id === id);
  if (!t) return;

  document.getElementById("editId").value = t.id;
  document.getElementById("txnTitle").value = t.title;
  document.getElementById("txnAmount").value = t.amount;
  document.getElementById("txnType").value = t.type;
  document.getElementById("txnCategory").value = t.category;
  document.getElementById("txnDate").value = t.date;

  document.getElementById("formTitle").textContent = "Edit Transaction";
  document.getElementById("submitBtn").textContent = "Save Changes";
  document.getElementById("cancelEdit").style.display = "inline-block";
}

// ─── DELETE ──────────────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  updateSummary();
  renderTransactions();
  showToast("Deleted!", "success");
}

// ─── RESET FORM ──────────────────────────────
function resetForm() {
  document.getElementById("txnForm").reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "Add Transaction";
  document.getElementById("submitBtn").textContent = "Add Transaction";
  document.getElementById("cancelEdit").style.display = "none";
}

// ─── RESET FILTERS ───────────────────────────
function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterType").value = "all";
  document.getElementById("filterCategory").value = "all";
  document.getElementById("filterDate").value = "";
  renderTransactions();
}

// ─── TOAST ───────────────────────────────────
let toastTimer;

function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast show ${type}`;

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 2500);
}

// ─── CURRENCY CONVERTER ──────────────────────
async function convertCurrency() {
  const amount = parseFloat(document.getElementById("convertAmount").value);
  const to = document.getElementById("convertTo").value;
  const result = document.getElementById("convertResult");

  if (!amount || amount <= 0) {
    result.textContent = "Enter valid amount";
    return;
  }

  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
    const data = await res.json();

    const rate = data.rates[to];
    const converted = (amount * rate).toFixed(2);

    result.innerHTML = `₹${amount} = ${converted} ${to}`;
  } catch {
    result.textContent = "Error fetching rates";
  }
}

