import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App.tsx";
import "./index.css";

// Error handling for debugging
window.onerror = (message, source, lineno, colno, error) => {
  console.error("[v0] Global error:", { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event) => {
  console.error("[v0] Unhandled promise rejection:", event.reason);
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("[v0] Root element not found!");
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error("[v0] Failed to render app:", error);
    rootElement.innerHTML = `<div style="color: white; padding: 20px;">Error loading app. Check console for details.</div>`;
  }
}
