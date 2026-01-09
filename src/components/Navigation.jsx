import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navigation.css';

export default function Navigation() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/add-payment', label: 'Add Payment' },
    { path: '/add-member', label: 'Add Member' },
    { path: '/add-loan', label: 'Add Loan' },
    { path: '/delete-member', label: 'Delete Member' }
  ];

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="hamburger-btn"
        onClick={toggleDrawer}
        aria-label="Toggle navigation menu"
        aria-expanded={isDrawerOpen}
      >
        ☰
      </button>

      {/* Navigation Drawer */}
      <nav
        className={`side-drawer ${isDrawerOpen ? 'open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="drawer-header">
          <h2>Menu</h2>
          <button
            className="close-btn"
            onClick={closeDrawer}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="nav-link"
                onClick={closeDrawer}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Overlay (closes drawer when clicked on mobile) */}
      {isDrawerOpen && (
        <div
          className="drawer-overlay"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}
    </>
  );
}
