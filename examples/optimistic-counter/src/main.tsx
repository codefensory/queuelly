import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import LocalServerProvider from "./providers/LocalServerProvider.tsx"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LocalServerProvider>
      <App />
    </LocalServerProvider>
  </React.StrictMode>,
)
