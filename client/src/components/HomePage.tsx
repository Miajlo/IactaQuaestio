import { FileText, TrendingUp, Users, Zap, LogIn, UserPlus, Search, BarChart } from "lucide-react";
import "../styles/HomePage.css";
import { useNavigate } from "react-router-dom";

function HomePage() {
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/auth', { state: { isLogin: true } });
    };

    const handleRegister = () => {
        navigate('/auth', { state: { isLogin: false } });
    };

    const scrollToFeatures = () => {
        const featuresSection = document.querySelector('.features-section');
        featuresSection?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="home-container">
            <div className="home-content">
                <header className="home-header">
                <div className="logo-section" onClick={() => navigate('/')}>
                    <div className="logo-icon">
                        <FileText className="logo-svg" />
                    </div>
                    <div className="logo-text">
                        <h1 className="logo-title">IactaQuaestio</h1>
                    </div>
                </div>
                <div className="auth-buttons">
                    <button onClick={handleLogin} className="login-btn">
                        <LogIn />
                        Login
                    </button>
                    <button onClick={handleRegister} className="register-btn">
                        <UserPlus />
                        Sign Up
                    </button>
                </div>
                </header>

                <section className="hero-section">
                    <div className="hero-badge">
                        <Zap className="badge-icon" />
                        <span>Smarter Study, Better Results</span>
                    </div>
                    <h1 className="hero-title">
                        Master Your Exams with
                        <span className="gradient-text"> Question Analytics</span>
                    </h1>
                    <p className="hero-description">
                        Upload past tests and discover which questions appear most frequently. 
                        Study smarter by focusing on what matters most.
                    </p>
                    <div className="hero-cta">
                        <button onClick={handleRegister} className="cta-primary">
                        <UserPlus />
                        Get Started
                    </button>
                    <button onClick={scrollToFeatures} className="cta-secondary">
                        <Search />
                        Explore Features
                    </button>
                    </div>
                </section>

                <section className="features-section">
                    <div className="features-grid">
                        <div className="feature-card" onClick={() => navigate("/uploadTest")} style={{cursor:"pointer"}}>
                            <div className="feature-icon purple">
                                <FileText />
                            </div>
                            <h3 className="feature-title">Upload Tests</h3>
                            <p className="feature-description">
                                Easily upload past exam papers and test materials in various formats
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon blue">
                                <BarChart />
                            </div>
                            <h3 className="feature-title">Track Frequency</h3>
                            <p className="feature-description">
                                See exactly how many times each question has appeared across different exams
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon pink">
                                <TrendingUp />
                            </div>
                            <h3 className="feature-title">Smart Analytics</h3>
                            <p className="feature-description">
                                Get insights on question patterns and trends to optimize your study time
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon green">
                                <Users />
                            </div>
                            <h3 className="feature-title">Community Driven</h3>
                            <p className="feature-description">
                                Benefit from a growing database of tests contributed by students like you
                            </p>
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Ace Your Exams?</h2>
                        <p className="cta-description">
                            Join thousands of students who are studying smarter with IactaQuaestio
                        </p>
                        <button onClick={handleRegister} className="cta-final">
                            <UserPlus />
                            Create Your Account
                        </button>
                    </div>
                </section>

                <footer className="home-footer">
                    <div className="footer-content">
                        <div className="footer-logo">
                            <FileText />
                            <span>IactaQuaestio</span>
                        </div>
                        <p className="footer-text">
                            © 2025 IactaQuaestio. Making exam preparation smarter.
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export default HomePage;