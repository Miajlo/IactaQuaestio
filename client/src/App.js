import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from "./components/HomePage.tsx";
import AuthForm from "./components/AuthForm.tsx";
import UploadTest from "./components/UploadTest.tsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/uploadTest" element={<UploadTest />} />
      </Routes>
    </Router>
  );
}

export default App;
