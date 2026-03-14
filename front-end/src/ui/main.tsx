import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import AppProvider from "@/config/app-provider";
import { ThemeProvider } from "@/config/theme-provider";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark">
      <AppProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </AppProvider>
    </ThemeProvider>
  </StrictMode>,
);
