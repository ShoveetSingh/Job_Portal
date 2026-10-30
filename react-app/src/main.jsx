import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Update_password from './pages/Update_password.jsx'
import Password_reset from './pages/Password_reset.jsx'


import { BrowserRouter,Routes,Route } from "react-router-dom";
import Logout from './pages/Logout.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset" element={<Password_reset />} />
        <Route path="/verify-password" element={<Update_password />} />
        <Route path='/lo' element={<Logout/>}/>
        <Route path='/verify-email' element ={<VerifyEmail/>}/>
        <Route path='/logout' element={<Logout/>}/>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
