import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
    const { user } = useAuth()
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const logoLink = user ? '/dashboard' : '/'

    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                ? 'bg-hg-black/80 backdrop-blur-xl border-b border-hg-border/50'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo — goes to dashboard if logged in */}
                <Link to={logoLink} className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-shadow">
                        <span className="text-white text-sm font-bold">H</span>
                    </div>
                    <span className="text-lg font-bold text-hg-white tracking-tight">
                        HeartGuard<span className="text-hg-red">AI</span>
                    </span>
                </Link>

                {/* Desktop links */}
                {!user ? (
                    <>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors">Features</a>
                            <a href="#pricing" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors">Pricing</a>
                            <a href="#faq" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors">FAQ</a>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/login" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors px-4 py-2">
                                Log in
                            </Link>
                            <Link to="/register" className="text-sm bg-hg-red hover:bg-hg-red-light text-white px-5 py-2 rounded-full font-medium transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                                Get Started
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex items-center gap-4">
                        <Link to="/dashboard" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors">Dashboard</Link>
                        <Link to="/simulator" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors">Simulator</Link>
                        <Link to="/chat" className="text-sm text-hg-text-dim hover:text-hg-white transition-colors">AI Chat</Link>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-hg-red/10 text-hg-red-light capitalize">{user.subscriptionTier}</span>
                        <span className="text-xs text-hg-text-dim">{user.name}</span>
                    </div>
                )}

                {/* Mobile hamburger */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden flex flex-col gap-1.5 cursor-pointer p-2"
                >
                    <motion.span animate={mobileOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-hg-text" />
                    <motion.span animate={mobileOpen ? { opacity: 0 } : { opacity: 1 }} className="block w-5 h-0.5 bg-hg-text" />
                    <motion.span animate={mobileOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} className="block w-5 h-0.5 bg-hg-text" />
                </button>
            </div>

            {/* Mobile menu */}
            <motion.div
                initial={false}
                animate={mobileOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden bg-hg-black/95 backdrop-blur-xl border-b border-hg-border"
            >
                <div className="px-6 py-4 flex flex-col gap-4">
                    {!user ? (
                        <>
                            <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">Features</a>
                            <a href="#pricing" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">Pricing</a>
                            <a href="#faq" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">FAQ</a>
                            <hr className="border-hg-border" />
                            <Link to="/login" className="text-sm text-hg-text py-2">Log in</Link>
                            <Link to="/register" className="text-sm bg-hg-red text-white px-5 py-2.5 rounded-full font-medium text-center">Get Started</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">Dashboard</Link>
                            <Link to="/simulator" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">Simulator</Link>
                            <Link to="/chat" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">AI Chat</Link>
                            <Link to="/appointments" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">Appointments</Link>
                            <Link to="/settings" onClick={() => setMobileOpen(false)} className="text-sm text-hg-text-dim hover:text-hg-white py-2">Settings</Link>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.nav>
    )
}
