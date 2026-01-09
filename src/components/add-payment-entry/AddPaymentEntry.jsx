import React, { useState, useEffect } from "react";
import { dataManager } from "../../utils/dataManager";
import {
  savingOptions,
  loanEMIOptions,
  interestOptions,
  lateFeeOptions,
  paymentMethods,
} from "../../data/AddEntryData";
import "./AddPaymentEntry.css";
import SelectDropdown from "../SelectDropdown";

const AddPaymentEntry = () => {
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [formData, setFormData] = useState({
    Date: "",
    Name: "",
    Saving: "",
    LoanEmi: "",
    Interest: "",
    LateFee: "",
    PaymentMethod: "",
    Notes: "",
  });

  // ------------------------
  // LOAD MEMBERS (CACHED)
  // ------------------------
  useEffect(() => {
    dataManager.getMembers().then((data) => {
      const list = data.filter((m) => m.Name && m.Status !== "Inactive");
      setMembers(list);
    });

    const unsubscribe = dataManager.onMembersUpdate((data) => {
      const list = data.filter((m) => m.Name && m.Status !== "Inactive");
      setMembers(list);
    });

    return unsubscribe;
  }, []);

  // ------------------------
  // INPUT HANDLER
  // ------------------------
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // --------------------------------
  // SAFE LOAN UPDATE (NO REDUNDANT SEARCHES)
  // --------------------------------
  const updateLoanStatus = async (name, emiAmount) => {
    try {
      // Get loan from cache (no API call needed)
      const loans = await dataManager.getLoans();
      const loan = loans.find((l) => l.Name === name && l.Status === "Active");
      if (!loan) return;

      const remaining =
        Number(loan.RemainingLoan || 0) - Number(emiAmount || 0);

      // Update loan (single PATCH call)
      await dataManager.updateLoan(loan.Id, {
        RemainingLoan: remaining <= 0 ? 0 : remaining,
        Status: remaining <= 0 ? "Inactive" : "Active",
      });
    } catch (err) {
      console.error("Loan update failed", err);
    }
  };

  // ------------------------
  // SUBMIT
  // ------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ------------------------
      // VALIDATION LOGIC
      // ------------------------
      const loans = await dataManager.getLoans();

      // Check if member has an ACTIVE loan
      const hasActiveLoan = loans.some(
        (l) => l.Name === formData.Name && l.Status === "Active"
      );

      // Loan EMI without active loan (INVALID)
      if (Number(formData.LoanEmi) > 0 && !hasActiveLoan) {
        setMessage(
          "This member does not have an active loan. Loan EMI cannot be added."
        );
        setMessageType("error");
        return;
      }

      // Interest without loan or EMI (INVALID)
      if (
        Number(formData.Interest) > 0 &&
        !hasActiveLoan &&
        Number(formData.LoanEmi) === 0
      ) {
        setMessage(
          "Interest can be added only when a loan exists or loan EMI is entered."
        );
        return;
      }

      await dataManager.addTransaction(formData);

      if (!formData.LoanEmi || Number(formData.LoanEmi) === 0) {
        // Skip loan update for non-loan payments
      } else {
        await updateLoanStatus(formData.Name, formData.LoanEmi);
      }

      setMessage("Entry added successfully!");
      setMessageType("success");

      setFormData({
        Date: "",
        Name: "",
        Saving: "",
        LoanEmi: "",
        Interest: "",
        LateFee: "",
        PaymentMethod: "",
        Notes: "",
      });
    } catch (err) {
      console.error(err);
      setMessage("Error adding entry");
    }
  };

  return (
    <div className="add-entry-container">
      <h1>Add Payment Entry</h1>
      {message && (
        <p className={messageType === "error" ? "error-msg" : "success-msg"}>
          {message}
        </p>
      )}

      <form onSubmit={handleSubmit} className="entry-form">
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
          label="Saving"
          name="Saving"
          value={formData.Saving}
          options={savingOptions}
          onChange={handleChange}
          required
        />

        <SelectDropdown
          label="Loan EMI"
          name="LoanEmi"
          value={formData.LoanEmi}
          options={loanEMIOptions}
          onChange={handleChange}
        />

        <SelectDropdown
          label="Interest"
          name="Interest"
          value={formData.Interest}
          options={interestOptions}
          onChange={handleChange}
        />

        <SelectDropdown
          label="Late Fee"
          name="LateFee"
          value={formData.LateFee}
          options={lateFeeOptions}
          onChange={handleChange}
        />

        <SelectDropdown
          label="Payment Method"
          name="PaymentMethod"
          value={formData.PaymentMethod}
          options={paymentMethods}
          onChange={handleChange}
          required
        />

        <label>Notes</label>
        <input
          type="text"
          name="Notes"
          value={formData.Notes}
          onChange={handleChange}
        />

        <button type="submit" className="submit-btn">
          Add
        </button>
      </form>
    </div>
  );
};

export default AddPaymentEntry;
