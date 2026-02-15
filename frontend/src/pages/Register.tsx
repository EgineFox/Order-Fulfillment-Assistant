import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await register(email, password, name);
            navigate('/dashboard');

        } catch(err: any) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }

    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
            <h1>Register</h1>

            {error && (
                <div style={{ color: 'red', marginBottom: '10px', padding: '10px', border: '1px solid red' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px'}}>
                    <label>Name:</label>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px'}} 
                        />
                </div>

                <div style={{ marginBottom: '15px'}}>
                    <label>Email:</label>
                    <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px'}} 
                        />
                </div>

                <div style={{ marginBottom: '15px'}}>
                    <label>Password:</label>
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px'}} 
                        />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {loading ? 'Loading...' : 'Register'}

                </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <Link to='/login'>Login</Link>
            </p>
        </div>
    );
}