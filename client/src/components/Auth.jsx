import React from 'react';

const Auth = ({ isLoginView, setIsLoginView, email, setEmail, password, setPassword, handleLogin, handleSignup }) => {
  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLoginView ? "Login" : "Sign Up"}</h2>
        <form className="innerform" onSubmit={isLoginView ? handleLogin : handleSignup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isLoginView ? "Login" : "Sign Up"}</button>
          <button
            onClick={() => setIsLoginView(!isLoginView)}
            className="auth-button switchbutton"
            type="button"
          >
{isLoginView ? (
  <p>
    Don’t have an account?{" "}
    <span
      onClick={() => setIsLoginView(false)}
      style={{ color: "var(--accent-color)", cursor: "pointer" }}
    >
      Sign Up
    </span>
  </p>
) : (
  <p>
    Already have an account?{" "}
    <span
      onClick={() => setIsLoginView(true)}
      style={{ color: "var(--accent-color)", cursor: "pointer" }}
    >
      Login
    </span>
  </p>
)}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;