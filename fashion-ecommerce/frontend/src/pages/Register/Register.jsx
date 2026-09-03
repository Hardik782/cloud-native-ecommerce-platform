import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    // Backend expects first_name/last_name (it rejects the single "name" field)
    const nameParts = form.name.trim().split(/\s+/);
    const payload = {
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || null,
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    const result = await register(payload);
    setSubmitting(false);
    if (result.success) {
      navigate("/", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create Account</h1>
        {error && <p className="form-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </label>
          <p className="auth-card__hint">Password must be at least 8 characters.</p>
          <button
            type="submit"
            className="button button--primary"
            disabled={submitting}
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className="auth-card__switch">
          Already have an account? <Link to="/login">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
