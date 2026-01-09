import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { dataManager } from "./utils/dataManager";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Pre-load critical data at app startup
dataManager.preloadData().finally(() => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// 🔑 THIS IS THE PWA SWITCH (VERY IMPORTANT)
serviceWorkerRegistration.register();

// Optional performance reporting
reportWebVitals();