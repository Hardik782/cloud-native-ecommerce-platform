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
        const data = res.data;
        // auth service returns first_name/last_name; users service may return name
        const fetchedName =
          data.name ||
          `${data.first_name || ""} ${data.last_name || ""}`.trim() ||
          "";
        setName(fetchedName || user?.name || "");
      } catch (err) {
        // fall back to context user if request fails
        if (user?.name) setName(user.name);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      // Backend stores the name as first_name/last_name
      const nameParts = name.trim().split(/\s+/);
      const payload = {
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || null,
      };
      const res = await updateProfile(payload);
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
