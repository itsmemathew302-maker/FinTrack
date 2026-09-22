import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { auth } from "./firebase";
import "./Auth.css";

const firebaseMessages = {
  "auth/email-already-in-use": "An account already exists with this email.",
  "auth/invalid-credential": "The email or password is incorrect.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/operation-not-allowed":
    "Email and password sign-in is not enabled yet.",
  "auth/user-not-found": "The email or password is incorrect.",
  "auth/weak-password": "Your password must contain at least 6 characters.",
  "auth/wrong-password": "The email or password is incorrect.",
};

function Auth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = () => {
    setIsSignup((current) => !current);
    setPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim();

    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (isSignup && password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const userCredential = isSignup
        ? await createUserWithEmailAndPassword(auth, normalizedEmail, password)
        : await signInWithEmailAndPassword(auth, normalizedEmail, password);

      onLogin?.(userCredential.user);
    } catch (firebaseError) {
      console.error(firebaseError);

      setError(
        firebaseMessages[firebaseError.code] ||
          "We could not complete that request. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <section className="auth-brand">
          <div className="auth-orbit auth-orbit-top" />
          <div className="auth-orbit auth-orbit-bottom" />

          <div className="auth-brand-content">
            <div className="auth-logo">
              <img src="/fintrack-logo.png" alt="FinTrack" />
            </div>

            <p className="auth-tagline">
              Take control of your money.
              <br />
              Track. Plan. Grow.
            </p>

            <div className="finance-preview">
              <div className="preview-heading">
                <span>Monthly Balance</span>
                <span className="preview-trend">+12.8%</span>
              </div>

              <strong>₹24,850</strong>

              <div className="preview-chart">
                {[42, 58, 48, 72, 64, 84, 76].map((height, index) => (
                  <span key={index} style={{ height: `${height}%` }} />
                ))}
              </div>

              <div className="preview-footer">
                <span>Last 7 months</span>
                <span className="preview-dot" />
                <span>Healthy trend</span>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-inner">
            <div className="auth-header">
              <p className="auth-eyebrow">FINANCIAL DASHBOARD</p>

              <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>

              <p>
                {isSignup
                  ? "Start managing your finances with FinTrack."
                  : "Login to continue to your FinTrack dashboard."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="auth-field">
                <label htmlFor="auth-email">Email Address</label>

                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="auth-password">Password</label>

                <div className="auth-input-wrap">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading}
                  />

                  <button
                    className="auth-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {isSignup && (
                <div className="auth-field">
                  <label htmlFor="auth-confirm-password">
                    Confirm Password
                  </label>

                  <div className="auth-input-wrap">
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      disabled={loading}
                    />

                    <button
                      className="auth-password-toggle"
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((visible) => !visible)
                      }
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="auth-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading
                  ? isSignup
                    ? "Creating account..."
                    : "Signing in..."
                  : isSignup
                    ? "Create Account"
                    : "Login"}

                {!loading && <span>→</span>}
              </button>
            </form>

            <p className="auth-switch">
              {isSignup ? "Already have an account?" : "Don't have an account?"}

              <button type="button" onClick={switchMode} disabled={loading}>
                {isSignup ? "Login" : "Create Account"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Auth;
