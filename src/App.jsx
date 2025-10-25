/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import "./index.css";
import Table from "./Table";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="app">
      <motion.button
        onClick={() => setDarkMode(!darkMode)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          zIndex: 100,
          fontSize: "13px",
          padding: "6px 12px",
          borderRadius: "4px",
          border: darkMode ? "1px solid #374151" : "1px solid #ccc",
          background: darkMode ? "#1e293b" : "#f5f5f5",
          cursor: "pointer",
          color: darkMode ? "#e2e8f0" : "#333",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          height: "32px",
        }}
        title={darkMode ? "Light mode" : "Dark mode"}
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </motion.button>

      <Table darkMode={darkMode} />
    </div>
  );
}

export default App;
