import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaHome } from "react-icons/fa";
import "./Profile.css";

const getUsernameFromEmail = (email) => {
  if (!email) return "Guest";
  return email.split("@")[0];
};

const Profile = ({ currentUser, handleLogout }) => {
  const navigate = useNavigate();
  const username = getUsernameFromEmail(currentUser?.email);

  // Default profile picture path
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
          {/* Other profile options can go here */}
           <p><strong>Plan:</strong> Free Tier</p>
           
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
