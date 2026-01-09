import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import AddPaymentEntry from "./components/add-payment-entry/AddPaymentEntry";
import Dashboard from "./components/dashboard/Dashboard";
import AddUserEntry from "./components/add-user-entry/AddUserEntry";
import DeleteUser from "./components/delete-user/DeleteUser";
import AddLoanEntry from "./components/add-loan-entry/AddLoanEntry";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <div className="navigation-container">
          <Navigation />
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-payment" element={<AddPaymentEntry />} />
            <Route path="/add-member" element={<AddUserEntry />} />
            <Route path="/delete-member" element={<DeleteUser />} />
            <Route path="/add-loan" element={<AddLoanEntry />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
