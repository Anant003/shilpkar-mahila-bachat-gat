import React from "react";

const SelectDropdown = ({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}) => {
  return (
    <>
      <label>{label}</label>
      <select name={name} value={value} onChange={onChange} required={required}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </>
  );
};

export default SelectDropdown;
