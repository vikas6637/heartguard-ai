import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState('patient')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register: signup } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const selectedPlan = searchParams.get('plan') // e.g. 'premium' or 'pro'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Email domain validation
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'protonmail.com', 'icloud.com', 'aol.com', 'zoho.com', 'mail.com', 'yandex.com']
        const domain = email.split('@')[1]?.toLowerCase()
        if (!domain || !allowedDomains.includes(domain)) {
            setError('Please use a valid email provider (Gmail, Yahoo, Outlook, etc.)')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        // Strong password validation
        const hasUpper = /[A-Z]/.test(password)
        const hasLower = /[a-z]/.test(password)
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        const digitCount = (password.match(/\d/g) || []).length

        if (password.length < 8 || !hasUpper || !hasLower || !hasSpecial || digitCount < 3) {
            setError('Password must have: 8+ characters, 1 uppercase, 1 lowercase, 1 special character, and 3 numbers')
            return
        }

        setLoading(true)
        try {
            await signup(name, email, password, role)
            // If user chose a paid plan from landing page, go to payment
            if (selectedPlan && selectedPlan !== 'free') {
                navigate(`/subscription?plan=${selectedPlan}`)
            } else {
                navigate('/dashboard')
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-hg-black flex items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-hg-red/5 rounded-full blur-[140px] pointer-events-none" />

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
                    <h2 className="text-2xl font-bold text-hg-white mb-1">Create your account</h2>
                    <p className="text-sm text-hg-text-dim mb-4">
                        {selectedPlan ? `Sign up to activate your ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan` : 'Start your heart health journey today'}
                    </p>

                    {selectedPlan && (
                        <div className="mb-6 p-3 rounded-xl bg-hg-red/10 border border-hg-red/30 text-hg-red-light text-sm flex items-center gap-2">
                            <span>🎯</span>
                            <span>Selected: <strong className="capitalize">{selectedPlan}</strong> plan — you'll be taken to payment after registration</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 rounded-xl bg-hg-red/10 border border-hg-red/30 text-hg-red-light text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm text-hg-text-dim mb-2">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="John Doe"
                                className="w-full bg-hg-dark border border-hg-border rounded-xl px-4 py-3 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors"
                            />
                        </div>

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

                        <div>
                            <label className="block text-sm text-hg-text-dim mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full bg-hg-dark border border-hg-border rounded-xl px-4 py-3 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors"
                            />
                        </div>

                        {/* Role selector */}
                        <div>
                            <label className="block text-sm text-hg-text-dim mb-2">I am a</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole('patient')}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border ${role === 'patient'
                                        ? 'bg-hg-red/10 border-hg-red/50 text-hg-red-light'
                                        : 'bg-hg-dark border-hg-border text-hg-text-dim hover:border-hg-border-light'
                                        }`}
                                >
                                    🧑‍💊 Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('doctor')}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all cursor-pointer border ${role === 'doctor'
                                        ? 'bg-hg-red/10 border-hg-red/50 text-hg-red-light'
                                        : 'bg-hg-dark border-hg-border text-hg-text-dim hover:border-hg-border-light'
                                        }`}
                                >
                                    🩺 Doctor
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-hg-red to-hg-red-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-hg-text-muted">
                        Already have an account?{' '}
                        <Link to="/login" className="text-hg-red hover:text-hg-red-light transition-colors font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
