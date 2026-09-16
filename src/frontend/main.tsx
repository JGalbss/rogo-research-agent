import { NuqsAdapter } from "nuqs/adapters/react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const root = document.getElementById("root");
if (root === null) throw new Error("index.html has no #root element");

createRoot(root).render(
  <NuqsAdapter>
    <App />
  </NuqsAdapter>,
);
