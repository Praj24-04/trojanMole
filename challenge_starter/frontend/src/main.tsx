import React from "react";
import ReactDOM from "react-dom/client";
import { ResearchConsole } from "./routes/index";
import "./styles.css";

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ResearchConsole />
    </React.StrictMode>
  );
}
