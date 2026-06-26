import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inconsolata/400.css";
import "@fontsource/poppins/600.css";
import "./index.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
