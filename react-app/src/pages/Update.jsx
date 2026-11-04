import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
function Update() {
  const [form, setForm] = useState({
    UserName: "",
    Phone: 0,
    Father_Name: "",
    Address: "",
    Profession: "",
    Resume: null,
    Photo: null,
  });
  const apiUrl = import.meta.env.API_VITE_URL;
  const nav=useNavigate();
  useEffect(() => {
    async function getData() {
      const session = await fetch(`${apiUrl}/check-session`,{
        credentials: "include",
      });

      const check = await session.json();

      if (check.logged_in) {
        const res = await fetch(`${apiUrl}/data`, {
          method:"POST",
          credentials: "include",
          body:check.email,
        });
        const data = await res.json();

        setForm({
          UserName: data.message.result[0][0] || "",
          Phone: data.message.result[0][1] || "",
          Father_Name: data.message.result[0][2] || "",
          Address: data.message.result[0][3] || "",
          Profession: data.message.result[0][4] || "",
          Resume: null,
          photo: null,
        });
      }
      else
        nav('/Login');
    }

    getData();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.files ? e.target.files[0] : e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) data.append(key, value);
    });

    const res = await fetch(`${apiUrl}/update-profile`, {
      method: "PUT",
      credentials: "include",
      body: data,
    });

    const result = await res.json();

    alert(result.message || result.detail);
  };

  return (
    <div className="p-6">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
        <input
          type="text"
          requried
          name="UserName"
          value={form.UserName}
          onChange={handleChange}
          placeholder="Username"
          className="border p-2 w-full"
        />

        <input
          type="number"
          requried
          name="Phone"
          value={form.Phone}
          onChange={handleChange}
          placeholder="Phone"
          className="border p-2 w-full"
        />

        <input
          type="text"
          required
          name="Father_Name"
          value={form.Father_Name}
          onChange={handleChange}
          placeholder="Father Name"
          className="border p-2 w-full"
        />

        <textarea
        type="text"
        required
          name="Address"
          value={form.Address}
          onChange={handleChange}
          placeholder="Address"
          className="border p-2 w-full"
        />

        <input
          type="text"
          required
          name="Profession"
          value={form.Profession}
          onChange={handleChange}
          placeholder="Profession"
          className="border p-2 w-full"
        />

        <label>Resume</label>
        <input
          type="file"
          name="Resume"
          accept=".pdf"
          onChange={handleChange}
        />

        <label>Photo</label>
        <input
          type="file"
          name="Photo"
          accept="image/*"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 w-full rounded"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}

export default Update;
