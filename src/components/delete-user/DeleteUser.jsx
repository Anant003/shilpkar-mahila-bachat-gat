import React, { useEffect, useState } from "react";
import { dataManager } from "../../utils/dataManager";
import "./DeleteUser.css";

function DeleteUser() {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedName, setSelectedName] = useState("");
  const [showModal, setShowModal] = useState(false);

  // 🔹 NEW: modal internal state
  const [modalStep, setModalStep] = useState("CONFIRM_DELETE");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  /* ================= LOAD MEMBERS & LOANS ================= */
  useEffect(() => {
    dataManager.getMembers().then(setMembers);
    dataManager.getLoans().then(setLoans);

    const unsubscribe = dataManager.onMembersUpdate(setMembers);
    return unsubscribe;
  }, []);

  /* ================= FETCH MEMBER TRANSACTIONS ================= */
  const fetchTransactions = async (name) => {
    const allTxns = await dataManager.getTransactions();
    const memberTxns = allTxns.filter((t) => t.Name === name);
    setTransactions(memberTxns);
  };

  /* ================= SUMMARY (DELETE MODAL ONLY) ================= */
  const calculateSummary = (transactions = [], loans = [], memberName = "") => {
    const summary = {
      savings: 0,
      loanTaken: 0,
      loanRepaid: 0,
      remainingLoan: 0,
    };

    if (!memberName) return summary;

    transactions.forEach((t) => {
      if (t.Name?.trim() !== memberName) return;
      summary.savings += Number(t.Saving || 0);
    });

    loans.forEach((l) => {
      if (l.Name?.trim() !== memberName) return;
      if (l.Status && l.Status.toLowerCase() !== "active") return;

      summary.loanTaken += Number(l.LoanAmount || 0);
      summary.remainingLoan += Number(l.RemainingLoan || 0);
    });

    summary.loanRepaid = summary.loanTaken - summary.remainingLoan;

    return summary;
  };

  const summary = calculateSummary(transactions, loans, selectedName);

  /* ================= CLEAR LOAN (STEP 2) ================= */
  const handleClearLoan = async () => {
    try {
      const activeLoans = loans.filter(
        (l) =>
          l.Name === selectedName &&
          l.Status &&
          l.Status.toLowerCase() === "active"
      );

      for (const loan of activeLoans) {
        await dataManager.updateLoan(loan.Id, {
          RemainingLoan: 0,
          Status: "Closed",
          ClosedOn: new Date().toISOString(),
        });
      }

      // Refresh loans after clearing
      const updatedLoans = await dataManager.getLoans(true);
      setLoans(updatedLoans);

      // Go back to delete confirmation view
      setModalStep("CONFIRM_DELETE");
      setMessage("Loan cleared successfully. You can now delete the member.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Error while clearing loan.");
      setMessageType("error");
    }
  };

  /* ================= DEACTIVATE MEMBER ================= */
  const handleDelete = async () => {
    try {
      if (summary.remainingLoan > 0) {
        setMessage(
          "This member has an active loan. Please clear it before deleting."
        );
        setMessageType("error");
        return;
      }

      await dataManager.updateMember(selectedName, {
        Status: "Inactive",
        DeactivatedOn: new Date().toISOString(),
      });

      const updatedMembers = await dataManager.getMembers(true);
      setMembers(updatedMembers);

      setSelectedName("");
      setTransactions([]);
      setShowModal(false);
      setModalStep("CONFIRM_DELETE");
      setMessage(`Member "${selectedName}" deleted successfully.`);
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Error while deleting member.");
      setMessageType("error");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="delete-user-container">
      <h2>Delete Member</h2>

      {message && (
        <p className={messageType === "error" ? "error-msg" : "success-msg"}>
          {message}
        </p>
      )}

      <select
        value={selectedName}
        onChange={(e) => {
          setSelectedName(e.target.value);
          fetchTransactions(e.target.value);
        }}
      >
        <option value="">Select member</option>
        {members
          .filter((m) => m.Status !== "Inactive")
          .map((m, i) => (
            <option key={i} value={m.Name}>
              {m.Name}
            </option>
          ))}
      </select>

      <button
        onClick={() => {
          setShowModal(true);
          setModalStep("CONFIRM_DELETE");
        }}
        disabled={!selectedName}
        className="delete-btn"
      >
        Delete Member
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>
              {modalStep === "CONFIRM_DELETE"
                ? "Confirm Deletion"
                : "Clear Loan"}
            </h3>

            <p>
              <strong>Name:</strong> {selectedName}
            </p>

            {modalStep === "CONFIRM_DELETE" && (
              <>
                <div className="summary">
                  <p>Savings: ₹{summary.savings}</p>
                  <p>Loan Taken: ₹{summary.loanTaken}</p>
                  <p>Loan Repaid: ₹{summary.loanRepaid}</p>
                  <p>Remaining Loan: ₹{summary.remainingLoan}</p>
                </div>

                {summary.remainingLoan > 0 && (
                  <p className="warning-text">
                    This member has an active loan. Please clear it before
                    deleting.
                  </p>
                )}

                <div className="modal-actions">
                  {summary.remainingLoan > 0 ? (
                    <button
                      onClick={() => setModalStep("CLEAR_LOAN")}
                      className="confirm-btn"
                    >
                      Clear Loan
                    </button>
                  ) : (
                    <button onClick={handleDelete} className="confirm-btn">
                      Yes, Delete
                    </button>
                  )}

                  <button
                    onClick={() => setShowModal(false)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {modalStep === "CLEAR_LOAN" && (
              <>
                <p>Remaining Loan Amount: ₹{summary.remainingLoan}</p>

                <div className="modal-actions">
                  <button onClick={handleClearLoan} className="confirm-btn">
                    Mark Loan as Cleared
                  </button>
                  <button
                    onClick={() => setModalStep("CONFIRM_DELETE")}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeleteUser;
