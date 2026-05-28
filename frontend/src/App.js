// D:\Emp_erp\frontend\src\App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Home from "./components/home/Home";
import Admin from "./components/admin/Admin_layout";
import Farmer from "./components/farmer/Farmer_layout";
import Login from "./components/home/Login";
import Register from "./components/home/Register";
import UserRegister from "./components/home/UserRegister";
import FarmerRegister from "./components/home/FarmerRegister";  
import BuyerRegister from "./components/home/BuyerRegister";
import ExpertRegister from "./components/home/ExpertRegister";
import PendingApproval from "./components/home/PendingApproval";
import User from "./components/user/User_layout";
import Buyer from "./components/buyer/BuyerLayout";
import Expert from "./components/expert/ExpertLayout";
import ForgotPassword from "./components/home/ForgotPassword";
import PostDetail from "./components/community/PostDetail";
import CalcDashboard from "./components/farmer/CalcDashboard";
import RequestOtp from "./components/home/RequestOtp";
import VerifyOtp from "./components/home/VerifyOtp";
import RequestPasswordReset from "./components/home/RequestPasswordReset";
import ResetPassword from "./components/home/ResetPassword";
import Contact from './components/home/Contact';
import { 
  Careers, Blog, Press, HelpCenter, Documentation, 
  Community, Partners, Events, Pricing, Products, 
  PrivacyPolicy, TermsOfService, CookiePolicy, 
  Support, RequestDemo 
} from './components/home/FooterPages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />   {/* Login Page */}
          <Route path="/register" element={<Register />} />   {/* Register Page */} 
        <Route path="/farmer/*" element={<Farmer />} />   {/* Farmer Module */}
        <Route path="/" element={<Home />} />   {/* Home Page */}
        <Route path="/admin" element={<Admin />} />   {/* Admin Page */}
        <Route path="/register/user" element={<UserRegister />} />   {/* User Registration Page */}
        <Route path="/register/farmer" element={<FarmerRegister />} />   {/* Farmer Registration Page */}
        <Route path="/register/buyer" element={<BuyerRegister />} />   {/* Buyer Registration Page */}
        <Route path="/pending-approval" element={<PendingApproval />} />   {/* Pending Approval Page */}
        <Route path="/user/*" element={<User />} />   {/* User Module */} 
        <Route path="/buyer/*" element={<Buyer />} />   {/* Buyer Module */}
        <Route path="/expert/*" element={<Expert />} />   {/* Expert Module */}
        <Route path="/register/expert" element={<ExpertRegister />} />   {/* Expert Registration Page */}
        <Route path="/forgot-password" element={<ForgotPassword />} />   {/* Forgot Password Page */}
        <Route path="/posts/:postId" element={<PostDetail />} />   {/* Post Detail Page */}
        <Route path="/farmer/calculator" element={<CalcDashboard />} />   {/* Farmer Calculator Dashboard */}
        <Route path="/request-otp" element={<RequestOtp />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<RequestPasswordReset />} />
        <Route path="/reset-password" element={<ResetPassword />} />

         {/* Footer Link Routes */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/press" element={<Press />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/docs" element={<Documentation />} />
        <Route path="/community" element={<Community />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/events" element={<Events />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/products" element={<Products />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/cookies" element={<CookiePolicy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/demo" element={<RequestDemo />} />
      </Routes>
    </Router>
    </QueryClientProvider>
  );
}

export default App;
