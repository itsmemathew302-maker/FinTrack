import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import "./App.css";
import { auth, db } from "./firebase";
import Auth from "./Auth";

const defaultBudgets = {
  Food: 3000,
  Travel: 2000,
  Shopping: 5000,
  Bills: 3000,
  Entertainment: 2000,
  Education: 3000,
  Other: 2000,
};

const categories = [
  { name: "Food", icon: "🍔" },
  { name: "Travel", icon: "🚌" },
  { name: "Shopping", icon: "🛒" },
  { name: "Bills", icon: "📄" },
  { name: "Entertainment", icon: "🎮" },
  { name: "Education", icon: "📚" },
  { name: "Other", icon: "💳" },
];

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState(defaultBudgets);

  const [incomeName, setIncomeName] = useState("");
  const [newIncome, setNewIncome] = useState("");

  const [expenseName, setExpenseName] = useState("");
  const [category, setCategory] = useState("Food");
  const [newExpense, setNewExpense] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const [incomeDate, setIncomeDate] = useState(today);
  const [expenseDate, setExpenseDate] = useState(today);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("Food");

  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  /* ---------------- AUTH ---------------- */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------- LOAD FIREBASE DATA ---------------- */

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setDataLoading(false);
      return;
    }

    const loadUserData = async () => {
      setDataLoading(true);

      try {
        const transactionsRef = collection(
          db,
          "users",
          user.uid,
          "transactions",
        );

        const snapshot = await getDocs(transactionsRef);

        const loadedTransactions = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setTransactions(loadedTransactions);

        const budgetRef = doc(db, "users", user.uid, "settings", "budget");

        const budgetSnapshot = await getDoc(budgetRef);

        if (budgetSnapshot.exists()) {
          setBudgets({
            ...defaultBudgets,
            ...budgetSnapshot.data(),
          });
        } else {
          await setDoc(budgetRef, defaultBudgets);
          setBudgets(defaultBudgets);
        }
      } catch (error) {
        console.error("Firebase loading error:", error);
        alert("Unable to load Firebase data.");
      } finally {
        setDataLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  /* ---------------- ADD INCOME ---------------- */

  const addIncome = async () => {
    if (!incomeName.trim() || !newIncome || Number(newIncome) <= 0) {
      alert("Please enter valid income details.");
      return;
    }

    if (!user) return;

    try {
      const transactionData = {
        name: incomeName.trim(),
        category: "Income",
        amount: Number(newIncome),
        type: "income",
        date: incomeDate,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(
        collection(db, "users", user.uid, "transactions"),
        transactionData,
      );

      setTransactions((previous) => [
        ...previous,
        {
          id: ref.id,
          ...transactionData,
        },
      ]);

      setIncomeName("");
      setNewIncome("");
      setIncomeDate(today);
    } catch (error) {
      console.error(error);
      alert("Failed to add income.");
    }
  };

  /* ---------------- ADD EXPENSE ---------------- */

  const addExpense = async () => {
    if (!expenseName.trim() || !newExpense || Number(newExpense) <= 0) {
      alert("Please enter valid expense details.");
      return;
    }

    if (!user) return;

    try {
      const transactionData = {
        name: expenseName.trim(),
        category,
        amount: Number(newExpense),
        type: "expense",
        date: expenseDate,
        createdAt: new Date().toISOString(),
      };

      const ref = await addDoc(
        collection(db, "users", user.uid, "transactions"),
        transactionData,
      );

      setTransactions((previous) => [
        ...previous,
        {
          id: ref.id,
          ...transactionData,
        },
      ]);

      setExpenseName("");
      setNewExpense("");
      setCategory("Food");
      setExpenseDate(today);
    } catch (error) {
      console.error(error);
      alert("Failed to add expense.");
    }
  };

  /* ---------------- DELETE ---------------- */

  const deleteTransaction = async (id) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "transactions", id));

      setTransactions((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Failed to delete transaction.");
    }
  };

  /* ---------------- EDIT ---------------- */

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditName(transaction.name);
    setEditAmount(transaction.amount);
    setEditCategory(
      transaction.type === "income" ? "Food" : transaction.category,
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditAmount("");
    setEditCategory("Food");
  };

  const saveEdit = async (id) => {
    if (!editName.trim() || !editAmount || Number(editAmount) <= 0) {
      alert("Please enter valid details.");
      return;
    }

    if (!user) return;

    try {
      const transaction = transactions.find((item) => item.id === id);

      if (!transaction) return;

      const updatedData = {
        name: editName.trim(),
        amount: Number(editAmount),
        category: transaction.type === "income" ? "Income" : editCategory,
      };

      await updateDoc(
        doc(db, "users", user.uid, "transactions", id),
        updatedData,
      );

      setTransactions((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, ...updatedData } : item,
        ),
      );

      cancelEdit();
    } catch (error) {
      console.error(error);
      alert("Failed to update transaction.");
    }
  };

  /* ---------------- BUDGET ---------------- */

  const updateBudget = async (categoryName, value) => {
    if (!user) return;

    const updatedBudgets = {
      ...budgets,
      [categoryName]: Number(value) || 0,
    };

    setBudgets(updatedBudgets);

    try {
      await setDoc(
        doc(db, "users", user.uid, "settings", "budget"),
        updatedBudgets,
        { merge: true },
      );
    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- MONTHLY CALCULATIONS ---------------- */

  const monthlyTransactions = transactions.filter((transaction) =>
    transaction.date?.startsWith(selectedMonth),
  );

  const income = monthlyTransactions
    .filter((item) => item.type === "income")
    .reduce((total, item) => total + Number(item.amount), 0);

  const expense = monthlyTransactions
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);

  const balance = income - expense;

  const getCategoryTotal = (categoryName) => {
    return monthlyTransactions
      .filter(
        (item) => item.type === "expense" && item.category === categoryName,
      )
      .reduce((total, item) => total + Number(item.amount), 0);
  };

  /* ---------------- FORMAT ---------------- */

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMonth = (month) => {
    return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  };

  /* ---------------- SIX MONTH TREND ---------------- */

  const getLastSixMonths = () => {
    const result = [];

    const [year, month] = selectedMonth.split("-").map(Number);

    for (let i = 5; i >= 0; i--) {
      const date = new Date(year, month - 1 - i, 1);

      const monthString = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}`;

      const monthTransactions = transactions.filter((item) =>
        item.date?.startsWith(monthString),
      );

      const monthIncome = monthTransactions
        .filter((item) => item.type === "income")
        .reduce((total, item) => total + Number(item.amount), 0);

      const monthExpense = monthTransactions
        .filter((item) => item.type === "expense")
        .reduce((total, item) => total + Number(item.amount), 0);

      result.push({
        month: monthString,
        income: monthIncome,
        expense: monthExpense,
        savings: monthIncome - monthExpense,
      });
    }

    return result;
  };

  const lastSixMonths = getLastSixMonths();

  /* ---------------- FINANCIAL HEALTH ---------------- */

  const totalBudget = categories.reduce(
    (total, item) => total + Number(budgets[item.name] || 0),
    0,
  );

  const budgetUsage = totalBudget > 0 ? (expense / totalBudget) * 100 : 0;

  const savingsRate = income > 0 ? (balance / income) * 100 : 0;

  const expenseRatio = income > 0 ? (expense / income) * 100 : 0;

  let financialStatus = "Getting Started";

  let financialMessage =
    "Add some income and expenses to see your financial health.";

  if (income > 0) {
    if (balance < 0) {
      financialStatus = "Needs Attention";
      financialMessage = "Your expenses are higher than your income.";
    } else if (savingsRate >= 30) {
      financialStatus = "Strong Saving";
      financialMessage = "You are keeping a good portion of your income.";
    } else if (savingsRate >= 15) {
      financialStatus = "Balanced";
      financialMessage = "Your income and spending are reasonably balanced.";
    } else {
      financialStatus = "Watch Spending";
      financialMessage = "Consider reducing unnecessary expenses.";
    }
  }

  /* ---------------- FILTER ---------------- */

  const filteredTransactions = monthlyTransactions.filter((transaction) => {
    const search = searchText.toLowerCase();

    const matchesSearch =
      transaction.name?.toLowerCase().includes(search) ||
      transaction.category?.toLowerCase().includes(search);

    const matchesCategory =
      filterCategory === "All" || transaction.category === filterCategory;

    const matchesType = filterType === "All" || transaction.type === filterType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const clearFilters = () => {
    setSearchText("");
    setFilterCategory("All");
    setFilterType("All");
  };

  /* ---------------- NAVIGATION ---------------- */

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  /* ---------------- LOGOUT ---------------- */

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  /* ---------------- LOADING ---------------- */

  if (authLoading) {
    return (
      <div className="loading-screen">
        <h2>Loading FinTrack...</h2>
      </div>
    );
  }

  /* ---------------- LOGIN ---------------- */

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  /* ---------------- FIREBASE LOADING ---------------- */

  if (dataLoading) {
    return (
      <div className="loading-screen">
        <h2>Loading your FinTrack data...</h2>
        <p>Connecting to Firebase ☁️</p>
      </div>
    );
  }

  /* ---------------- DASHBOARD ---------------- */

  return (
    <div className="container">
      <div className="finance-bg" aria-hidden="true">
        <div className="finance-bg-image"></div>
        <div className="finance-glow"></div>

        <div className="finance-particles">
          {Array.from({ length: 18 }).map((_, index) => (
            <span key={index}></span>
          ))}
        </div>
      </div>
      <header className="top-header">
        <div className="header-copy">
          <div className="dashboard-logo">
            <img src="/fintrack-logo.png" alt="FinTrack" />
          </div>

          <p className="subtitle">Personal Finance & Expense Tracker</p>
        </div>

        <div className="header-actions">
          <p className="logged-user">Logged in as: {user.email}</p>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* MONTH */}

      <div className="section">
        <div className="month-selector">
          <div>
            <h2>Monthly Overview</h2>

            <p>View your finances for a selected month.</p>
          </div>

          <div className="month-control">
            <label>Select Month</label>

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            <strong>{formatMonth(selectedMonth)}</strong>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}

      <div className="section">
        <h2>Quick Actions</h2>

        <div className="quick-actions">
          <button onClick={() => scrollToSection("add-income")}>
            + Add Income
          </button>

          <button onClick={() => scrollToSection("add-expense")}>
            + Add Expense
          </button>

          <button onClick={() => scrollToSection("monthly-budget")}>
            💰 Budget
          </button>

          <button onClick={() => scrollToSection("transactions")}>
            📋 Transactions
          </button>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="summary">
        <div className="card income-card">
          <h3>Monthly Income</h3>

          <h2>₹{income.toLocaleString("en-IN")}</h2>
        </div>

        <div className="card expense-card">
          <h3>Monthly Expense</h3>

          <h2>₹{expense.toLocaleString("en-IN")}</h2>
        </div>

        <div className="card balance-card">
          <h3>Balance</h3>

          <h2>₹{balance.toLocaleString("en-IN")}</h2>
        </div>
      </div>

      {/* FINANCIAL HEALTH */}

      <div className="section">
        <h2>Financial Health</h2>

        <div className="category-grid">
          <div className="category-card">
            <div className="category-icon">💰</div>

            <div>
              <p>Status</p>
              <h3>{financialStatus}</h3>
            </div>
          </div>

          <div className="category-card">
            <div className="category-icon">📈</div>

            <div>
              <p>Savings Rate</p>
              <h3>{Math.max(savingsRate, 0).toFixed(1)}%</h3>
            </div>
          </div>

          <div className="category-card">
            <div className="category-icon">💸</div>

            <div>
              <p>Expense Ratio</p>
              <h3>{expenseRatio.toFixed(1)}%</h3>
            </div>
          </div>

          <div className="category-card">
            <div className="category-icon">🎯</div>

            <div>
              <p>Budget Usage</p>
              <h3>{budgetUsage.toFixed(1)}%</h3>
            </div>
          </div>
        </div>

        <p className="health-message">{financialMessage}</p>
      </div>

      {/* OVERVIEW */}

      <div className="section">
        <h2>Financial Overview</h2>

        <div className="overview-chart">
          <div className="bar-item">
            <div className="bar-label">
              <span>Income</span>

              <strong>₹{income.toLocaleString("en-IN")}</strong>
            </div>

            <div className="bar-background">
              <div
                className="income-bar"
                style={{
                  width: income > 0 ? "100%" : "0%",
                }}
              />
            </div>
          </div>

          <div className="bar-item">
            <div className="bar-label">
              <span>Expense</span>

              <strong>₹{expense.toLocaleString("en-IN")}</strong>
            </div>

            <div className="bar-background">
              <div
                className="expense-bar"
                style={{
                  width:
                    income > 0
                      ? `${Math.min((expense / income) * 100, 100)}%`
                      : expense > 0
                        ? "100%"
                        : "0%",
                }}
              />
            </div>
          </div>
        </div>

        <div className="chart-summary">
          <div>
            <span>Income</span>
            <strong>₹{income.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span>Expense</span>
            <strong>₹{expense.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span>Savings</span>
            <strong>₹{balance.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* MONTHLY TREND */}

      <div className="section">
        <h2>Monthly Trend</h2>

        {lastSixMonths.map((item) => {
          const maxValue = Math.max(
            ...lastSixMonths.flatMap((month) => [month.income, month.expense]),
            1,
          );

          return (
            <div className="bar-item" key={item.month}>
              <div className="bar-label">
                <span>{formatMonth(item.month)}</span>

                <strong>
                  Savings: ₹{item.savings.toLocaleString("en-IN")}
                </strong>
              </div>

              <div className="trend-bars">
                <div className="bar-background">
                  <div
                    className="income-bar"
                    style={{
                      width: `${(item.income / maxValue) * 100}%`,
                    }}
                  />
                </div>

                <div className="bar-background">
                  <div
                    className="expense-bar"
                    style={{
                      width: `${(item.expense / maxValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <p className="legend">Green = Income | Navy = Expense</p>
      </div>

      {/* CATEGORY */}

      <div className="section">
        <h2>Expense by Category</h2>

        <div className="category-grid">
          {categories.map((item) => (
            <div className="category-card" key={item.name}>
              <div className="category-icon">{item.icon}</div>

              <div>
                <p>{item.name}</p>

                <h3>₹{getCategoryTotal(item.name).toLocaleString("en-IN")}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="category-chart">
          {categories.map((item) => {
            const amount = getCategoryTotal(item.name);

            const percentage = expense > 0 ? (amount / expense) * 100 : 0;

            return (
              <div className="category-bar-item" key={item.name}>
                <div className="category-bar-header">
                  <span>
                    {item.icon} {item.name}
                  </span>

                  <strong>₹{amount.toLocaleString("en-IN")}</strong>
                </div>

                <div className="category-bar-background">
                  <div
                    className="category-bar-fill"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>

                <small>{percentage.toFixed(1)}%</small>
              </div>
            );
          })}
        </div>
      </div>

      {/* BUDGET */}

      <div className="section" id="monthly-budget">
        <h2>Monthly Budget</h2>

        <p>Set your monthly spending limit for each category.</p>

        {categories.map((item) => {
          const budget = Number(budgets[item.name] || 0);

          const spent = getCategoryTotal(item.name);

          const percentage =
            budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

          const isOver = budget > 0 && spent > budget;

          return (
            <div className="chart-item" key={item.name}>
              <div className="chart-header">
                <span>
                  {item.icon} {item.name}
                </span>

                <strong>
                  ₹{spent.toLocaleString("en-IN")}
                  {" / "}₹{budget.toLocaleString("en-IN")}
                </strong>
              </div>

              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => updateBudget(item.name, e.target.value)}
              />

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>

              <small
                style={{
                  color: isOver ? "#dc3545" : "#718096",
                }}
              >
                {isOver
                  ? `Over budget by ₹${(spent - budget).toLocaleString(
                      "en-IN",
                    )}`
                  : `Remaining ₹${(budget - spent).toLocaleString("en-IN")}`}
              </small>
            </div>
          );
        })}

        <div className="chart-summary">
          <div>
            <span>Total Budget</span>

            <strong>₹{totalBudget.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span>Total Spent</span>

            <strong>₹{expense.toLocaleString("en-IN")}</strong>
          </div>

          <div>
            <span>Remaining</span>

            <strong>₹{(totalBudget - expense).toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </div>

      {/* ADD INCOME */}

      <div className="section" id="add-income">
        <h2>Add Income</h2>

        <input
          type="text"
          placeholder="Income name"
          value={incomeName}
          onChange={(e) => setIncomeName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Amount"
          value={newIncome}
          onChange={(e) => setNewIncome(e.target.value)}
        />

        <input
          type="date"
          value={incomeDate}
          onChange={(e) => setIncomeDate(e.target.value)}
        />

        <button onClick={addIncome}>Add Income</button>
      </div>

      {/* ADD EXPENSE */}

      <div className="section" id="add-expense">
        <h2>Add Expense</h2>

        <input
          type="text"
          placeholder="Expense name"
          value={expenseName}
          onChange={(e) => setExpenseName(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((item) => (
            <option value={item.name} key={item.name}>
              {item.name}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={newExpense}
          onChange={(e) => setNewExpense(e.target.value)}
        />

        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />

        <button onClick={addExpense}>Add Expense</button>
      </div>

      {/* TRANSACTIONS */}

      <div className="section" id="transactions">
        <h2>Transactions</h2>

        <div className="filters">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>

            <option value="Income">Income</option>

            {categories.map((item) => (
              <option value={item.name} key={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>

            <option value="income">Income</option>

            <option value="expense">Expense</option>
          </select>

          <button className="clear-btn" onClick={clearFilters}>
            Clear
          </button>
        </div>

        <p className="transaction-count">
          Showing {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? "s" : ""} for{" "}
          {formatMonth(selectedMonth)}
        </p>

        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <h3>No transactions found</h3>

            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          filteredTransactions
            .slice()
            .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
            .map((transaction) => {
              const icon =
                transaction.type === "income"
                  ? "💰"
                  : categories.find(
                      (item) => item.name === transaction.category,
                    )?.icon || "💳";

              return (
                <div className="transaction" key={transaction.id}>
                  {editingId === transaction.id ? (
                    <div className="edit-box">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />

                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                      />

                      {transaction.type === "expense" && (
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        >
                          {categories.map((item) => (
                            <option value={item.name} key={item.name}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <button onClick={() => saveEdit(transaction.id)}>
                        Save
                      </button>

                      <button className="cancel-btn" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="transaction-row">
                      <div className="transaction-left">
                        <div className="transaction-icon">{icon}</div>

                        <div>
                          <strong>{transaction.name}</strong>

                          <p>{transaction.category}</p>

                          <span className="transaction-date">
                            {formatDate(transaction.date)}
                          </span>
                        </div>
                      </div>

                      <div className="transaction-right">
                        <strong
                          className={
                            transaction.type === "income"
                              ? "income-amount"
                              : "expense-amount"
                          }
                        >
                          {transaction.type === "income" ? "+" : "-"}₹
                          {Number(transaction.amount).toLocaleString("en-IN")}
                        </strong>

                        <button
                          className="edit-btn"
                          onClick={() => startEdit(transaction)}
                        >
                          ✏️
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      <footer>FinTrack • Personal Finance Dashboard</footer>
    </div>
  );
}

export default App;
