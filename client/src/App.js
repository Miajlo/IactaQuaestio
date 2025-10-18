import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./components/HomePage.tsx";
import AuthForm from "./components/AuthForm.tsx";
import UploadTest from "./components/uploadTest.tsx";
import AdminPanel from "./components/AdminPanel.tsx";
import SearchTests from "./components/SearchTests.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/uploadTest" element={<ProtectedRoute element={<UploadTest />} />} />
        <Route path="/admin" element={<ProtectedRoute element={<AdminPanel />} requireAdmin />} />
        <Route path="/searchTests" element={<ProtectedRoute element={<SearchTests />} />} />
      </Routes>
    </Router>
  );
}

export default App;
