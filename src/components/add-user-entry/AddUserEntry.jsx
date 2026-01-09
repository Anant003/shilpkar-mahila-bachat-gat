import React, { useState } from "react";
import { dataManager } from "../../utils/dataManager";
import SelectDropdown from "../SelectDropdown";

const AddUserEntry = () => {
  const [formData, setFormData] = useState({
    Name: "",
    savingAmount: "",
    Status: "Active",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const memberName = formData.Name.trim();
      const savingAmount = Number(formData.savingAmount || 0);

      /* ================= 1️⃣ CHECK EXISTING MEMBERS ================= */
      const existingMembers = await dataManager.getMembers();

      const existingMember = existingMembers.find(
        (m) => m.Name?.trim() === memberName
      );

      /* ================= 2️⃣ ADD OR REACTIVATE MEMBER ================= */
      if (existingMember) {
        if (existingMember.Status !== "Active") {
          // Reactivate silently
          await dataManager.updateMember(memberName, {
            Status: "Active",
            ReactivatedOn: new Date().toISOString(),
          });
        }
      } else {
        // Add new member
        await dataManager.addMember({
          Name: memberName,
          Status: "Active",
        });
      }

      /* ================= 3️⃣ ADD JOINING SAVING (OPTIONAL) ================= */
      if (savingAmount > 0) {
        const today = new Date().toISOString().split("T")[0];

        await dataManager.addTransaction({
          Date: today,
          Name: memberName,
          Saving: savingAmount,
          LoanEmi: "",
          Interest: "",
          LateFee: "",
          PaymentMethod: "Cash",
          Notes: "Joining Saving",
        });
      }

      /* ================= 4️⃣ SUCCESS & RESET ================= */
      setMessage("Member added successfully!");

      setFormData({
        Name: "",
        savingAmount: "",
        Status: "Active",
      });
    } catch (error) {
      console.error(error);
      setMessage("Error adding member.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "20px" }}>
      <h2>Add New Member</h2>
      {message && <p style={{ color: "green" }}>{message}</p>}
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <label>Name</label>
        <input
          type="text"
          name="Name"
          value={formData.Name}
          onChange={handleChange}
          placeholder="Enter member name"
        />

        <label>Saving Amount</label>
        <input
          type="text"
          name="savingAmount"
          value={formData.savingAmount}
          onChange={handleChange}
          min="0"
          placeholder="Enter saving amount here"
        />

        <SelectDropdown
          label="Status"
          name="Status"
          value={formData.Status}
          options={["Active", "Inactive"]}
          onChange={handleChange}
        />

        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#1e90ff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Add Member
        </button>
      </form>
    </div>
  );
};

export default AddUserEntry;
