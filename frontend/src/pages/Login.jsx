import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser, FiLock } from "react-icons/fi";
import bgLogin from "/src/assets/bg-login.png";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      alert("Please enter username and password");
      return;
    }
    navigate("/dashboard");
  };

  return (
    <>
      {/* Placeholder styling */}
      <style>
        {`
          input::placeholder {
            color: rgba(255, 255, 255, 0.75);
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          margin: 0,
          padding: 0,
          backgroundImage: `url(${bgLogin})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TOP NAV */}
        <div
          style={{
            width: "100%",
            background: "#0f172a",
            padding: "22px 0",
            textAlign: "center",
            color: "#FFA500",
            fontSize: "32px",
            fontWeight: 700,
            position: "relative",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {/* LOGO LEFT */}
          <img
            src="/src/assets/S4C_Logo.png"
            alt="logo"
            style={{
              height: "55px",
              position: "absolute",
              left: "25px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />
          Ninja Data Bridge
        </div>

        {/* CENTER WRAPPER */}
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingBottom: "50px",
          }}
        >
          {/* LOGIN CARD (Glassmorphism) */}
          <div
            style={{
              width: "380px",
              padding: "45px 50px",
              borderRadius: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
              animation: "fadeIn 0.8s ease",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                marginBottom: "25px",
                fontSize: "28px",
                fontWeight: "700",
                color: "#fff",
              }}
            >
              Login
            </h2>

            {/* USERNAME */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "600", color: "#e2e8f0" }}>
                Username
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginTop: "6px",
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                <FiUser
                  size={18}
                  color="#fff"
                  style={{ marginRight: "10px" }}
                />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "16px",
                    color: "#fff",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div style={{ marginBottom: "25px" }}>
              <label style={{ fontWeight: "600", color: "#e2e8f0" }}>
                Password
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "10px",
                  padding: "10px 12px",
                  marginTop: "6px",
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                <FiLock
                  size={18}
                  color="#fff"
                  style={{ marginRight: "10px" }}
                />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "16px",
                    color: "#fff",
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
                color: "#fff",
                fontSize: "18px",
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                transition: "0.2s",
              }}
              onMouseEnter={(e) =>
                (e.target.style.background =
                  "linear-gradient(90deg, #1d4ed8, #1e40af)")
              }
              onMouseLeave={(e) =>
                (e.target.style.background =
                  "linear-gradient(90deg, #2563eb, #1d4ed8)")
              }
            >
              Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
