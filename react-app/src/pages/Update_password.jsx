import { useState } from "react";
import { useSearchParams } from "react-router-dom";

function Update_password() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL;
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: token,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password update failed!");
      }

      setMessage(data.message || "Password updated successfully!");
      setPassword("");

    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-lg">

      <h2 className="text-2xl font-bold text-center mb-6">
        Update Password
      </h2>

      <form onSubmit={handleSubmit}>

        <label className="block mb-2 font-medium">
          New Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your new password"
          required
          minLength={8}
          className="w-full border border-gray-300 rounded-lg p-3 mb-5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading || !token}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

      </form>

      {message && (
        <p className="text-center mt-4 text-sm">
          {message}
        </p>
      )}

      {!token && (
        <p className="text-center mt-4 text-red-600 text-sm">
          Invalid or missing reset token.
        </p>
      )}

    </div>
  );
}

export default Update_password;

