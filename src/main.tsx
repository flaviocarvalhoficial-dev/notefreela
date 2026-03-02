import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ValueVisibilityProvider } from "./components/ValueVisibilityProvider";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <ValueVisibilityProvider>
      <App />
    </ValueVisibilityProvider>
  </ThemeProvider>,
);
