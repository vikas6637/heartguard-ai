import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'forever',
        features: ['3 predictions/month', 'Basic risk score', 'Limited history'],
        cta: 'Current Plan',
        disabled: true,
    },
    {
        id: 'premium',
        name: 'Premium',
        price: 499,
        period: '/month',
        features: ['Unlimited predictions', 'SHAP Explainability', 'What-If Simulator', 'Full history', 'Priority Support'],
        cta: 'Upgrade to Premium',
        popular: true,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 999,
        period: '/month',
        features: ['Everything in Premium', 'AI Chat Agent', 'Doctor Consultations', 'Wearable Integration', 'API Access', 'Dedicated Support'],
        cta: 'Upgrade to Pro',
    },
]

export default function Subscription() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [currentTier, setCurrentTier] = useState('free')
    const [loading, setLoading] = useState(null)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const autoTriggered = useRef(false)

    useEffect(() => {
        if (!user) navigate('/login')
        else setCurrentTier(user.subscriptionTier || 'free')
    }, [user, navigate])

    // Auto-trigger payment if ?plan= is in URL (from registration or landing page)
    useEffect(() => {
        const planFromUrl = searchParams.get('plan')
        if (planFromUrl && user && !autoTriggered.current && planFromUrl !== currentTier && planFromUrl !== 'free') {
            autoTriggered.current = true
            // Small delay to let the page render first
            const timer = setTimeout(() => handleUpgrade(planFromUrl), 800)
            return () => clearTimeout(timer)
        }
    }, [searchParams, user, currentTier])

    const handleUpgrade = async (planId) => {
        if (planId === 'free' || planId === currentTier) return
        setLoading(planId)
        setSuccess('')
        setError('')

        try {
            const orderRes = await api.post('/payments/create-order', { planId })
            const { order, key, demo } = orderRes.data

            if (demo) {
                await api.post('/payments/verify', {
                    razorpay_order_id: order.id,
                    razorpay_payment_id: 'pay_demo_' + Date.now(),
                    razorpay_signature: 'demo_signature',
                    planId,
                })
                setCurrentTier(planId)
                setSuccess(`🎉 Upgraded to ${planId}! (Demo mode — add Razorpay keys for real payments)`)
                setLoading(null)
                return
            }

            // Load Razorpay checkout script
            const loadRazorpay = () => {
                return new Promise((resolve) => {
                    if (window.Razorpay) {
                        resolve()
                        return
                    }
                    const script = document.createElement('script')
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
                    script.onload = () => resolve()
                    script.onerror = () => {
                        setError('Failed to load payment gateway. Please try again.')
                        setLoading(null)
                    }
                    document.body.appendChild(script)
                })
            }

            await loadRazorpay()

            const options = {
                key,
                amount: order.amount,
                currency: order.currency,
                name: 'HeartGuard AI',
                description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan — ₹${order.amount / 100}/month`,
                order_id: order.id,
                handler: async (response) => {
                    try {
                        await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId,
                        })
                        setCurrentTier(planId)
                        setSuccess(`🎉 Successfully upgraded to ${planId.charAt(0).toUpperCase() + planId.slice(1)}!`)
                    } catch (err) {
                        setError('Payment verification failed. Contact support if money was deducted.')
                    }
                    setLoading(null)
                },
                modal: {
                    ondismiss: () => {
                        setLoading(null)
                        setError('Payment cancelled. You can try again anytime.')
                    },
                },
                prefill: { name: user?.name, email: user?.email },
                theme: { color: '#dc2626' },
            }

            const rzp = new window.Razorpay(options)
            rzp.on('payment.failed', (resp) => {
                setError(`Payment failed: ${resp.error.description}`)
                setLoading(null)
            })
            rzp.open()
        } catch (err) {
            console.error('Payment error:', err)
            setError(err.response?.data?.error || 'Failed to initiate payment. Please try again.')
            setLoading(null)
        }
    }

    if (!user) return null

    const planFromUrl = searchParams.get('plan')

    return (
        <div className="min-h-screen bg-hg-black">
            {/* Nav */}
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                                <span className="text-white text-xs font-bold">H</span>
                            </div>
                            <span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span>
                        </Link>
                        <span className="text-hg-border">|</span>
                        <span className="text-sm text-hg-text-dim">Subscription</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">Home</Link>
                        <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 py-12">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-hg-white mb-2">Choose Your Plan</h1>
                    <p className="text-hg-text-dim text-sm">
                        Current plan: <span className="text-hg-red-light font-semibold capitalize">{currentTier}</span>
                    </p>
                </motion.div>

                {/* Auto-upgrade banner */}
                {planFromUrl && planFromUrl !== 'free' && planFromUrl !== currentTier && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-xl bg-hg-red/10 border border-hg-red/30 text-hg-red-light text-sm text-center"
                    >
                        🎯 Opening payment for <strong className="capitalize">{planFromUrl}</strong> plan...
                    </motion.div>
                )}

                {success && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center"
                    >
                        {success}
                    </motion.div>
                )}

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan, i) => {
                        const isCurrent = plan.id === currentTier
                        const isTarget = plan.id === planFromUrl
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative glass-card rounded-2xl p-6 flex flex-col ${plan.popular ? 'border-hg-red/50 ring-1 ring-hg-red/20' : ''
                                    } ${isTarget && !isCurrent ? 'ring-2 ring-hg-red/60 shadow-[0_0_30px_rgba(220,38,38,0.15)]' : ''}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-hg-red to-hg-red-dark text-white text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                                        Most Popular
                                    </span>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-lg font-bold text-hg-white">{plan.name}</h3>
                                    <div className="flex items-end gap-1 mt-2">
                                        <span className="text-3xl font-bold text-hg-white">
                                            {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                                        </span>
                                        {plan.price > 0 && (
                                            <span className="text-sm text-hg-text-muted mb-1">{plan.period}</span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-3 flex-1 mb-6">
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-start gap-2 text-sm text-hg-text-dim">
                                            <span className="text-hg-red mt-0.5 flex-shrink-0">✓</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => handleUpgrade(plan.id)}
                                    disabled={isCurrent || plan.disabled || loading === plan.id}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${isCurrent
                                        ? 'bg-hg-dark border border-hg-border text-hg-text-muted cursor-default'
                                        : plan.popular
                                            ? 'bg-gradient-to-r from-hg-red to-hg-red-dark text-white hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]'
                                            : 'bg-hg-card border border-hg-border text-hg-text hover:border-hg-red/40'
                                        } disabled:opacity-50`}
                                >
                                    {loading === plan.id ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : isCurrent ? '✓ Current Plan' : plan.cta}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                <p className="text-center text-xs text-hg-text-muted mt-8">
                    Payments secured by Razorpay. Cancel anytime. 30-day money-back guarantee.
                </p>
            </div>
        </div>
    )
}
