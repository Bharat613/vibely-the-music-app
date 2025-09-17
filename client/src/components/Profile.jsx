import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaHome, FaInfoCircle } from "react-icons/fa";
import "./Profile.css";

const getUsernameFromEmail = (email) => {
  if (!email) return "Guest";
  return email.split("@")[0];
};

const Profile = ({ currentUser, handleLogout }) => {
  const navigate = useNavigate();
  const username = getUsernameFromEmail(currentUser?.email);

  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [installInstructions, setInstallInstructions] = useState({});

  useEffect(() => {
    const getBrowserInstructions = () => {
      let title = "📲 Install Vibely";
      let instructions = "";
      
      const userAgent = navigator.userAgent;

      // Detect Chrome on mobile/desktop
      if (userAgent.match(/Chrome/i)) {
        instructions = (
          <>
            Open the <strong>Chrome menu (⋮)</strong> and select <strong>"Add to Home screen"</strong> (on mobile) or <strong>"Install app"</strong> (on desktop).
          </>
        );
      }
      // Detect Safari on iOS
      else if (userAgent.match(/iPhone|iPad|iPod/i) && userAgent.match(/Safari/i) && !userAgent.match(/Chrome/i)) {
        instructions = (
          <>
            Tap the <strong>Share button</strong> <img src="/images/share-icon.png" alt="Share Icon" className="inline-icon" /> at the bottom of the screen, then select <strong>"Add to Home Screen"</strong>.
          </>
        );
      }
      // Detect Firefox
      else if (userAgent.match(/Firefox/i)) {
        instructions = (
          <>
            Open the <strong>Firefox menu (☰)</strong> and select <strong>"Install"</strong> or <strong>"Add to Home screen"</strong>.
          </>
        );
      }
      // Fallback for other browsers
      else {
        instructions = "Your browser may not support PWA installation. Please try with Chrome or Safari.";
      }

      setInstallInstructions({ title, instructions });
    };

    getBrowserInstructions();
  }, []);

  const toggleInstallGuide = () => {
    setShowInstallGuide(!showInstallGuide);
  };

  const defaultProfilePic = "/images/profile1.png";

  return (
    <div className="profile-page-container">
      <header className="profile-header">
        <button onClick={() => navigate("/")} className="back-button">
          <FaHome />
        </button>
        <h2>Hello, {username}!</h2>
      </header>

      <div className="profile-content">
        <div className="profile-icon-container">
          <img
            src={defaultProfilePic}
            alt="User Profile"
            className="profile-picture"
          />
        </div>

        <div className="profile-info-section">
          <h3>Your Account</h3>
          <p>
            <strong>Email:</strong> {currentUser?.email || "N/A"}
          </p>
        </div>

        <div className="profile-options">
          <p><strong>Plan:</strong> Free Tier</p>
          
          <button onClick={toggleInstallGuide} className="install-guide-toggle-button">
            <FaInfoCircle /> {showInstallGuide ? "Hide" : "Show"} Installation Guide
          </button>

          {showInstallGuide && (
            <div className="install-guide">
              <h4>{installInstructions.title}</h4>
              <p>{installInstructions.instructions}</p>
            </div>
          )}
        </div>

        <button className="logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" /> Logout
        </button>
      </div>

      <footer className="profile-footer">
        <p>Developed by Shiva 2025 &copy; All rights reserved</p>
      </footer>
    </div>
  );
};

export default Profile;