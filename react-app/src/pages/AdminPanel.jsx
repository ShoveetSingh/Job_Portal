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
      <div>
        {user && (
          <div>
            <table>
              <thead>
                <tr>
                  <th>Candidate_ID</th>
                  <th>Email</th>
                  <th>Email_Verified</th>
                  <th>UserName</th>
                  <th>Phone</th>
                  <th>Father_Name</th>
                  <th>Address</th>
                  <th>Profession</th>
                  <th>Resume</th>
                </tr>
              </thead>
              <tbody>
                {user.map((item) => (
                  <tr>
                    <td>{item.Candidate_ID}</td>
                    <td>{item.Email}</td>
                    <td>{item.Email_Verified}</td>
                    <td>{item.UserName}</td>
                    <td>{item.Phone}</td>
                    <td>{item.Father_Name}</td>
                    <td>{item.Address}</td>
                    <td>{item.Profession}</td>
                    <td>
                      <a
                        href={`${apiUrl}/${item.Resume}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h1> Total users: {user.length}</h1>
          </div>
        )}
      </div>
    );
}

export default AdminPanel