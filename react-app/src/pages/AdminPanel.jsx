import {useNavigate } from "react-router-dom";
import { useState,useEffect } from "react";

function AdminPanel(){
     
     const nav = useNavigate();
     const apiUrl = import.meta.env.VITE_API_URL;
     const[email,SetEmail]=useState('');
     const [user,SetUser] = useState([]);

     useEffect(()=>{
      async function user_call(){
        try{
         const res = await fetch(`${apiUrl}/user_data`, {
           method: "POST",
           credentials:'include',
          headers: {
          "Content-Type": "application/json",
        },
           body: JSON.stringify({Email:email}),
         });
         const user_data = await res.json();
         SetUser(user_data.data);
         console.log(res);
        }
        catch(error){
            console.log(error);
        }
      }
       user_call();
     },[email])

     useEffect(()=>{

     async function call(){
        try{
        const response = await fetch(`${apiUrl}/check-session`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data=await response.json();
        if(data.logged_in==false || data.role!='admin')
        nav('/AdminLogin');
        else{
        SetEmail(data.email);
        }
        }catch(error){
          console.log(error);
        }
     }
      call();
     },[])


    return (
      <div className="min-h-screen bg-gray-100 p-6 md:p-10">
        {user && (
          <div className="max-w-full mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Candidate Management
                </h1>
                <p className="text-gray-500 mt-1">
                  Manage and view registered candidates.
                </p>
              </div>

              <div className="bg-white shadow-sm border rounded-xl px-6 py-4">
                <p className="text-sm text-gray-500">Total Candidates</p>
                <h2 className="text-3xl font-bold text-blue-600">
                  {user.length}
                </h2>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-5 py-4">ID</th>
                      <th className="px-5 py-4">Email</th>
                      <th className="px-5 py-4">Verification</th>
                      <th className="px-5 py-4">Username</th>
                      <th className="px-5 py-4">Phone</th>
                      <th className="px-5 py-4">Father Name</th>
                      <th className="px-5 py-4">Address</th>
                      <th className="px-5 py-4">Profession</th>
                      <th className="px-5 py-4">Paid_User</th>
                      <th className="px-5 py-4 text-center">Resume</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {user.map((item) => (
                      <tr
                        key={item.Candidate_ID}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <td className="px-5 py-4 font-semibold text-gray-700">
                          #{item.Candidate_ID}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.Email}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.Email_Verified
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.Email_Verified ? "Verified" : "Not Verified"}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-medium text-gray-800">
                          {item.UserName}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.Phone}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {item.Father_Name}
                        </td>

                        <td className="px-5 py-4 text-gray-600 max-w-xs truncate">
                          {item.Address}
                        </td>

                        <td className="px-5 py-4">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {item.Profession}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            {item.Paid?"YES":'NO'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          {item.Resume ? (
                            <a
                              href={`${apiUrl}/${item.Resume}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                            >
                              View Resume
                            </a>
                          ) : (
                            <span className="text-gray-400">Not Uploaded</span>
                          )}
                        </td>
                      </tr>
                    ))}

                    {user.length === 0 && (
                      <tr>
                        <td
                          colSpan="9"
                          className="text-center py-12 text-gray-500"
                        >
                          No candidates found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-sm text-gray-400 mt-4 text-right">
              Showing {user.length} candidates
            </p>
          </div>
        )}
      </div>
    );
}

export default AdminPanel