import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Logout() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
   const apiUrl = import.meta.env.VITE_API_URL;
  const handleLogout = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/logout`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Logout failed!");
      }

      setMessage("Logged out successfully!");

      navigate("/");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white shadow-md rounded-xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Logout</h1>

        <p className="mb-5">Are you sure you want to logout?</p>

        <button
          onClick={handleLogout}
          disabled={loading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Logging out..." : "Logout"}
        </button>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
}

export default Logout;
