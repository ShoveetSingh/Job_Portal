
import Register from "./pages/Register";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import { useState } from "react";

function App() {
  const [activeForm, setActiveForm] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function checkSession() {
    try {
      const response = await fetch("http://localhost:8000/check-session", {
        method: "GET",
        credentials: "include"//send nd recieve cookies.
      });

      const data = await response.json();
console.log(data);
      setIsLoggedIn(data.logged_in);
    } catch (error) {
      console.error("Session check failed:", error);
      setIsLoggedIn(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-8">

      <div className="flex gap-4 mb-8">

        <button
          onClick={() => setActiveForm("register")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg"
        >
          Register
        </button>

        <button
          onClick={async () => {
            const loggedIn = await checkSession();
            setActiveForm(loggedIn ? "logout" : "login");
          }}
          className="bg-green-600 text-white px-5 py-2 rounded-lg"
        >
          {isLoggedIn ? "Logout" : "Login"}
        </button>

      </div>

      <div className="w-full max-w-md">

        {activeForm === "register" && <Register />}

        {activeForm === "login" && <Login />}

        {activeForm === "logout" && <Logout />}

      </div>

    </div>
  );
}

export default App;

