import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginWithGoogle } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch {
            setError('Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleLogin() {
        try {
            setError('');
            await loginWithGoogle();
            navigate('/');
        } catch {
            setError('Failed to log in with Google.');
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-brand">
                    <img src="/images/Bullsheadcrop.png" alt="Trade Tracker Pro" className="brand-logo" />
                    <span className="app-title-hidden">Trade Tracker Pro</span>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="login-actions">
                        <button type="submit" className="primary-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </div>
                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button onClick={handleGoogleLogin} className="google-btn">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="google-icon" />
                    Continue with Google
                </button>

                <div className="footer-links">
                    <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                    <div className="signup-link">
                        Don't have an account? <Link to="/signup">Sign Up</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
