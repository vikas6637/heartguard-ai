import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-hg-black flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-hg-red/5 rounded-full blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 justify-center mb-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                        <span className="text-white font-bold">H</span>
                    </div>
                    <span className="text-xl font-bold text-hg-white tracking-tight">
                        HeartGuard<span className="text-hg-red">AI</span>
                    </span>
                </Link>

                {/* Form card */}
                <div className="glass-card rounded-2xl p-8">
                    <h2 className="text-2xl font-bold text-hg-white mb-1">Welcome back</h2>
                    <p className="text-sm text-hg-text-dim mb-8">Sign in to access your dashboard</p>

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-hg-red/10 border border-hg-red/30 text-hg-red-light text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm text-hg-text-dim mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="you@example.com"
                                className="w-full bg-hg-dark border border-hg-border rounded-xl px-4 py-3 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-hg-text-dim mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-hg-dark border border-hg-border rounded-xl px-4 py-3 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-hg-red to-hg-red-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-hg-text-muted">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-hg-red hover:text-hg-red-light transition-colors font-medium">
                            Create one
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
