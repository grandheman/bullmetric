import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        try {
            setError('');
            await signup(email, password);
            navigate('/');
        } catch {
            setError('Failed to create an account');
        }
    }

    return (
        <div className="auth-container">
            <h2>Sign Up</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                <input type="password" placeholder="Description" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}
