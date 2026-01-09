import React, { useEffect, useState, useCallback } from "react";
import { dataManager } from "../../utils/dataManager";
import "./Dashboard.css";

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);

  const [summary, setSummary] = useState({
    totalSavings: 0,
    totalInterest: 0,
    totalLateFees: 0,
    totalLoanAmount: 0,
    totalRemainingLoan: 0,
    totalSavingsIncludingInterest: 0,
  });

  const [memberSummary, setMemberSummary] = useState([]);

  /* ===================== LOAD DATA ===================== */
  useEffect(() => {
    dataManager.getMembers().then(setMembers);
    dataManager.getTransactions().then(setTransactions);
    dataManager.getLoans().then(setLoans);

    const unsubMembers = dataManager.onMembersUpdate(setMembers);
    const unsubTxns = dataManager.onTransactionsUpdate(setTransactions);
    const unsubLoans = dataManager.onLoansUpdate(setLoans);

    return () => {
      unsubMembers();
      unsubTxns();
      unsubLoans();
    };
  }, []);

  /* ===================== SUMMARY LOGIC ===================== */
  const calculateSummary = useCallback(() => {
    let totalSavings = 0;
    let totalInterest = 0;
    let totalLateFees = 0;
    let totalLoanAmount = 0;
    let totalRemainingLoan = 0;

    const memberMap = {};

    /* ================= ACTIVE MEMBERS ================= */
    const activeMemberSet =
      members.length === 0
        ? null
        : new Set(
            members
              .filter((m) => m.Status !== "Inactive")
              .map((m) => m.Name?.trim())
          );

    /* ================= LOAN LOOKUP ================= */
    const loanMap = {};

    loans.forEach((l) => {
      if (!l.Name) return;

      // Only active loans
      if (l.Status && l.Status.toLowerCase() !== "active") return;

      const name = l.Name.trim();

      const loanAmount = Number(l.LoanAmount || 0);
      const remainingLoan = Number(l.RemainingLoan || 0);
      console.log(loanAmount, remainingLoan);

      loanMap[name] = {
        loanAmount,
        remainingLoan,
      };

      totalLoanAmount += loanAmount;
      totalRemainingLoan += remainingLoan;
    });

    members.forEach((m) => {
      if (m.Status === "Inactive") return;

      const name = m.Name?.trim();
      if (!name) return;

      memberMap[name] = {
        savings: 0,
        interest: 0,
        lateFees: 0,
        loanAmount: loanMap[name]?.loanAmount || 0,
        remainingLoan: loanMap[name]?.remainingLoan || 0,
      };
    });

    /* ================= TRANSACTION PROCESS ================= */
    transactions.forEach((t) => {
      const name = t.Name?.trim();
      if (!name) return;

      const isInactive = activeMemberSet && !activeMemberSet.has(name);
      if (isInactive) return;

      // ✅ SAFETY: ensure memberMap exists
      if (!memberMap[name]) {
        memberMap[name] = {
          savings: 0,
          interest: 0,
          lateFees: 0,
          loanAmount: loanMap[name]?.loanAmount || 0,
          remainingLoan: loanMap[name]?.remainingLoan || 0,
        };
      }

      const saving = Number(t.Saving || 0);
      const interest = Number(t.Interest || 0);
      const lateFee = Number(t.LateFee || 0);

      if (saving > 0) {
        memberMap[name].savings += saving;
        totalSavings += saving;
      }

      if (interest > 0) {
        memberMap[name].interest += interest;
        totalInterest += interest;
      }

      if (lateFee > 0) {
        memberMap[name].lateFees += lateFee;
        totalLateFees += lateFee;
      }
    });

    const totalSavingsIncludingInterest =
      totalSavings + totalInterest + totalLateFees;
    /* ================= UPDATE STATE ================= */
    setSummary({
      totalSavings,
      totalInterest,
      totalLateFees,
      totalLoanAmount,
      totalRemainingLoan,
      totalSavingsIncludingInterest,
    });

    setMemberSummary(
      Object.entries(memberMap).map(([name, details]) => ({
        name,
        ...details,
      }))
    );
  }, [transactions, members, loans]);

  /* ===================== RECALCULATE ===================== */
  useEffect(() => {
    calculateSummary();
  }, [calculateSummary]);

  /* ===================== UI ===================== */
  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="summary-cards">
        <div className="card">
          Total Savings
          <br />₹{summary.totalSavings}
        </div>
        <div className="card">
          Total Interest
          <br />₹{summary.totalInterest}
        </div>
        <div className="card">
          Total Late Fees
          <br />₹{summary.totalLateFees}
        </div>
        <div className="card">
          Total Loan
          <br />₹{summary.totalLoanAmount}
        </div>
        <div className="card">
          Remaining Loan
          <br />₹{summary.totalRemainingLoan}
        </div>
        <div className="card">
          Total Savings (Incl. Interest & Late Fees)
          <br />₹{summary.totalSavingsIncludingInterest}
        </div>
      </div>

      <h2>Members Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Savings</th>
            <th>Loan Amount</th>
            <th>Remaining Loan</th>
            <th>Interest</th>
            <th>Late Fees</th>
          </tr>
        </thead>
        <tbody>
          {memberSummary.map((m, i) => (
            <tr key={i}>
              <td>{m.name}</td>
              <td>₹{m.savings}</td>
              <td>₹{m.loanAmount}</td>
              <td>₹{m.remainingLoan}</td>
              <td>₹{m.interest}</td>
              <td>₹{m.lateFees}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Dashboard;
