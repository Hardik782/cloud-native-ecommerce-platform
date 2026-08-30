import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getProfile, updateProfile } from "../../api/users";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setName(res.data.name || "");
      } catch (err) {
        // fall back to context user if request fails
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await updateProfile({ name });
      refreshUser(res.data);
      setMessage("Profile updated successfully.");
      setEditing(false);
    } catch (err) {
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="section">
      <h1 className="section__title">My Profile</h1>
      <div className="profile-card">
        {message && <p className="form-message">{message}</p>}
        {editing ? (
          <form onSubmit={handleSave}>
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>
            <div className="profile-card__actions">
              <button
                type="submit"
                className="button button--primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="button button--outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p>
              <strong>Name:</strong> {name || "—"}
            </p>
            <p>
              <strong>Email:</strong> {user?.email || "—"}
            </p>
            <button
              className="button button--primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
