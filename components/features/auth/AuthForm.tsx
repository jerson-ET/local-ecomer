
'use client'

import React, { useState } from 'react'
import { Eye, EyeOff, User, Mail, Shield, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AuthForm() {
    const router = useRouter()
    const [isRegistering, setIsRegistering] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [storeName, setStoreName] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Redirect to the full dashboard page
        router.push('/dashboard')
    }


    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-icon-wrapper">
                        <User size={40} className="auth-icon-main" />
                    </div>
                    <h2 className="auth-title">
                        {isRegistering ? 'Create Your Store' : 'Welcome Back'}
                    </h2>
                    <p className="auth-subtitle">
                        {isRegistering
                            ? 'Join 5000+ vendors growing their business'
                            : 'manage your store and orders'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {isRegistering && (
                        <div className="form-group">
                            <label className="form-label">Store Name</label>
                            <div className="input-wrapper">
                                <Building2 size={20} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="My Awesome Store"
                                    className="form-input"
                                    required
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                />
                            </div>
                            <p className="form-hint">This will be your unique store URL</p>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={20} className="input-icon" />
                            <input
                                type="email"
                                placeholder="store@example.com"
                                className="form-input"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <Shield size={20} className="input-icon" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="form-input"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="password-toggle"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="auth-submit-btn">
                        {isRegistering ? 'Register Now' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="auth-switch-btn"
                        >
                            {isRegistering ? 'Sign In' : 'Register Now'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
