import React, { useState, useEffect } from "react";
import { dataManager } from "../../utils/dataManager";
import "./AddLoanEntry.css";
import SelectDropdown from "../SelectDropdown";

const loanAmounts = ["10000", "15000", "30000"];
const statusOptions = ["Active", "Closed"];

const AddLoanEntry = () => {
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    Name: "",
    Date: new Date().toISOString().split("T")[0],
    LoanAmount: "",
    Status: "Active",
  });
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  // LOAD MEMBERS FROM CACHE
  useEffect(() => {
    // Load from cache or API (with caching)
    dataManager.getMembers().then((data) => {
      const memberList = data.filter((m) => m.Name && m.Status !== "Inactive");
      setMembers(memberList);
    });

    // Listen for member updates
    const unsubscribe = dataManager.onMembersUpdate((data) => {
      const memberList = data.filter((row) => row["Name"]);
      setMembers(memberList);
    });

    return unsubscribe;
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // -------------------------
  // OPTIMIZED LOAN HANDLER
  // -------------------------
  const handleConfirm = async () => {
    try {
      // BLOCK INACTIVE MEMBERS
      const member = members.find((m) => m.Name === formData.Name);

      if (!member || member.Status === "Inactive") {
        setMessage("Inactive members cannot receive loans.");
        setMessageType("error");
        setShowModal(false);
        return;
      }

      // Get all loans
      const loans = await dataManager.getLoans();

      // Check if member already has an ACTIVE loan
      const hasActiveLoan = loans.some(
        (l) => l.Name === formData.Name && l.Status === "Active"
      );

      // Block if active loan exists
      if (hasActiveLoan) {
        setMessage(
          "This member already has an active loan. Please close it before adding a new loan."
        );
        setMessageType("error");
        setShowModal(false);
        return;
      }

      // Add NEW loan (only when no active loan exists)
      await dataManager.addLoan({
        ...formData,
        RemainingLoan: Number(formData.LoanAmount), // important
        Status: "Active",
      });

      setMessage("Loan added successfully!");

      setShowModal(false);
      setFormData({
        Name: "",
        Date: new Date().toISOString().split("T")[0],
        LoanAmount: "",
        Status: "Active",
      });
    } catch (error) {
      console.error("Error updating loan:", error);
      setMessage("Error updating loan details.");
    }
  };

  return (
    <div className="loan-entry-container">
      <h2>Add Loan Entry</h2>
      {message && (
        <p className={messageType === "error" ? "error-msg" : "success-msg"}>
          {message}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setShowModal(true);
        }}
        className="loan-form"
      >
        <SelectDropdown
          label="Name"
          name="Name"
          value={formData.Name}
          options={members.map((m) => m.Name)}
          onChange={handleChange}
          required
        />

        <label>Date</label>
        <input
          type="date"
          name="Date"
          value={formData.Date}
          onChange={handleChange}
          required
        />

        <SelectDropdown
          label="Loan Amount"
          name="LoanAmount"
          value={formData.LoanAmount}
          options={loanAmounts}
          onChange={handleChange}
          required
        />

        <SelectDropdown
          label="Status"
          name="Status"
          value={formData.Status}
          options={statusOptions}
          onChange={handleChange}
          required
        />

        <button type="submit" className="submit-btn">
          Add Loan
        </button>
      </form>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Loan Entry</h3>
            <p>
              <strong>Name:</strong> {formData.Name}
            </p>
            <p>
              <strong>Date:</strong> {formData.Date}
            </p>
            <p>
              <strong>Loan Amount:</strong> ₹{formData.LoanAmount}
            </p>
            <p>
              <strong>Status:</strong> {formData.Status}
            </p>

            <div className="modal-actions">
              <button onClick={handleConfirm} className="confirm-btn">
                Yes, Confirm
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddLoanEntry;
