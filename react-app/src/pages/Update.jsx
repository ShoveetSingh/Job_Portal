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
  const apiUrl = import.meta.env.VITE_API_URL;
  const nav=useNavigate();

  useEffect(() => {
    async function getData() {
      const session = await fetch(`${apiUrl}/check-session`,{
        credentials: "include",
      });

      const check = await session.json();
      console.log(check);
      if (check.logged_in) {
        const res = await fetch(`${apiUrl}/data`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        setForm({
          UserName: data.message[0].UserName || "",
          Phone: data.message[0].Phone || 0,
          Father_Name: data.message[0].Father_Name || "",
          Address: data.message[0].Address || "",
          Profession: data.message[0].Profession || "",
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
    
     const response = await fetch(`${apiUrl}/check-payment`, {
       method: "PUT",
       credentials: "include",
     });

     const paid = await response.json();
     if (paid.message){

    const res = await fetch(`${apiUrl}/update-profile`, {
      method: "PUT",
      credentials: "include",
      body: data,
    });
      
    
    const result = await res.json();

    console.log(result);
}
else
     window.open("/payment", "_blank", "noopener,noreferrer");
  };

  return (
<div className="min-h-screen bg-gray-100 px-4 py-10">

    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="bg-gray-800 px-8 py-7">
            <h1 className="text-2xl font-bold text-white">
                Update Profile
            </h1>
            <p className="text-gray-300 text-sm mt-2">
                Keep your candidate information up to date.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

            {/* Personal Information */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            required
                            name="UserName"
                            value={form.UserName}
                            onChange={handleChange}
                            placeholder="Enter username"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            required
                            name="Phone"
                            value={form.Phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Father's Name
                        </label>
                        <input
                            type="text"
                            required
                            name="Father_Name"
                            value={form.Father_Name}
                            onChange={handleChange}
                            placeholder="Enter father's name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address
                        </label>
                        <textarea
                            required
                            name="Address"
                            value={form.Address}
                            onChange={handleChange}
                            placeholder="Enter your full address"
                            rows="3"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profession
                        </label>
                        <input
                            type="text"
                            required
                            name="Profession"
                            value={form.Profession}
                            onChange={handleChange}
                            placeholder="Enter your profession"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                    </div>

                </div>
            </div>

            <div className="border-t border-gray-200"></div>

            {/* Documents */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Documents & Profile Photo
                </h2>

                <div className="space-y-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resume (PDF)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-500 transition bg-gray-50">
                            <input
                                type="file"
                                name="Resume"
                                accept=".pdf,application/pdf"
                                onChange={handleChange}
                                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 file:font-semibold hover:file:bg-blue-200"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Upload your resume in PDF format.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Profile Photo
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 hover:border-blue-500 transition bg-gray-50">
                            <input
                                type="file"
                                name="Photo"
                                accept="image/*"
                                onChange={handleChange}
                                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-700 file:font-semibold hover:file:bg-blue-200"
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Upload JPG, PNG or another supported image format.
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Submit */}
            <div className="pt-3">
                <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition duration-200"
                >
                    Update Profile
                </button>
            </div>

        </form>
    </div>
</div>
  )
}

export default Update;
