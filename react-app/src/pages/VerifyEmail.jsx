import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState("Verifying your email...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setMessage("Invalid or missing verification token.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/verify-email", {
          method: "POST",
          credentials:'include',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token: token
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Email verification failed!");
        }

        setMessage(data.message || "Email verified successfully!");

      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">

        <h2 className="text-2xl font-bold mb-4">
          Email Verification
        </h2>

        <p className="text-gray-700">
          {message}
        </p>

        {loading && (
          <div className="mt-4 text-blue-600">
            Please wait...
          </div>
        )}

      </div>

    </div>
  );
}

export default VerifyEmail;

