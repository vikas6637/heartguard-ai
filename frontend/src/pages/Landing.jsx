import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

/* ─── Scroll-animated text component ─── */
function AnimatedText({ text, className = '' }) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: '-100px' })
    const words = text.split(' ')

    return (
        <span ref={ref} className={className}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    className="inline-block mr-[0.3em]"
                >
                    {word}
                </motion.span>
            ))}
        </span>
    )
}

/* ─── FAQ Accordion item ─── */
function FAQItem({ question, answer }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="border-b border-hg-border">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center py-6 text-left cursor-pointer"
            >
                <span className="text-lg font-medium text-hg-text pr-4">{question}</span>
                <motion.span
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-hg-red text-2xl font-light flex-shrink-0"
                >
                    +
                </motion.span>
            </button>
            <motion.div
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <p className="pb-6 text-hg-text-dim leading-relaxed">{answer}</p>
            </motion.div>
        </div>
    )
}

/* ═══════════════════════════════════════════ */
/*  LANDING PAGE                              */
/* ═══════════════════════════════════════════ */
export default function Landing() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll()

    // Smart pricing link: logged-in → /subscription, new user → /register?plan=X
    const getPricingLink = (planName) => {
        const planId = planName.toLowerCase()
        if (planId === 'basic') return user ? '/dashboard' : '/register'
        return user ? `/subscription?plan=${planId}` : `/register?plan=${planId}`
    }

    // Video opacity fades as user scrolls
    const videoOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.08])
    const heroContentOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0])

    const features = [
        {
            icon: '🫀',
            badge: 'Live',
            badgeColor: 'text-green-400 bg-green-400/10',
            title: 'AI Heart Scan',
            version: 'v2.1',
            desc: 'Real-time cardiac risk assessment powered by gradient boosting ML models trained on clinical data.',
            tags: ['#Prediction', '#AI', '#Clinical'],
        },
        {
            icon: '📊',
            badge: 'Premium',
            badgeColor: 'text-hg-red-light bg-hg-red/10',
            title: 'XAI Dashboard',
            version: 'SHAP/LIME',
            desc: 'Explainable AI visualizations that show exactly which health factors drive your risk score.',
            tags: ['#Explainability', '#SHAP'],
        },
        {
            icon: '💬',
            badge: 'Active',
            badgeColor: 'text-blue-400 bg-blue-400/10',
            title: 'AI Health Agent',
            version: 'Gemini',
            desc: 'Conversational AI that maps your symptoms to clinical inputs and provides personalized lifestyle advice.',
            tags: ['#Chatbot', '#Gemini'],
        },
        {
            icon: '📅',
            badge: 'Pro',
            badgeColor: 'text-purple-400 bg-purple-400/10',
            title: 'Doctor Connect',
            version: '24/7',
            desc: 'Book appointments with verified cardiologists directly through the platform or via chat.',
            tags: ['#Appointments', '#Telemedicine'],
        },
    ]

    const showcaseItems = [
        {
            title: 'AI-Powered Diagnostics',
            desc: 'Analyze heart performance with unmatched accuracy using our ensemble ML models.',
            cta: 'Learn more →',
            hasVideo: true,
        },
        {
            title: 'Predictive Health Monitoring',
            desc: 'Detect potential risks before they become emergencies with continuous risk tracking.',
            cta: 'Learn more →',
            hasVideo: false,
        },
    ]

    const pricingPlans = [
        {
            name: 'Basic',
            price: 'Free',
            period: '',
            desc: 'Get started with essential heart health screening.',
            features: ['5 Predictions/month', 'Basic Risk Score', '3 AI Chat Messages/day', 'Health Tips'],
            cta: 'Get Started Free',
            popular: false,
        },
        {
            name: 'Premium',
            price: '₹499',
            period: '/month',
            desc: 'Advanced insights for proactive heart health management.',
            features: ['Unlimited Predictions', 'SHAP/LIME Explainability', 'What-If Simulator', 'Unlimited AI Chat', 'PDF/Excel Reports'],
            cta: 'Choose Premium',
            popular: true,
        },
        {
            name: 'Pro',
            price: '₹999',
            period: '/month',
            desc: 'Complete cardiovascular care with doctor access.',
            features: ['Everything in Premium', 'Doctor Consultations', 'Priority Support', 'Wearable Sync', 'Custom API Integration'],
            cta: 'Choose Pro',
            popular: false,
        },
    ]

    const faqs = [
        {
            q: 'How accurate is HeartGuard AI\'s prediction?',
            a: 'Our model is trained on the Cleveland Heart Disease dataset with a Gradient Boosting Classifier achieving over 90% recall. It uses 13 clinical parameters including age, cholesterol, blood pressure, and ECG data. While highly accurate for screening, results should always be discussed with a qualified cardiologist.',
        },
        {
            q: 'What data do I need to get a prediction?',
            a: 'You need 13 clinical parameters: age, sex, chest pain type, resting blood pressure, cholesterol, fasting blood sugar, resting ECG, max heart rate, exercise-induced angina, ST depression, ST slope, number of major vessels, and thalassemia status. If you don\'t have clinical data, our AI agent can help estimate from your symptoms.',
        },
        {
            q: 'Is my health data secure?',
            a: 'Absolutely. All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We use JWT-based authentication with bcrypt password hashing. Your health records are strictly isolated — no other user or admin can access your data without your consent.',
        },
        {
            q: 'What is Explainable AI (XAI)?',
            a: 'XAI provides transparency into how the AI reached its prediction. Using SHAP and LIME algorithms, we show exactly which health factors (e.g., high cholesterol, low heart rate) contributed most to your risk score — so there are no black boxes. You can trust and understand every prediction.',
        },
        {
            q: 'Can I connect my wearable devices?',
            a: 'Wearable integration (Apple HealthKit, Google Fit) is available on the Pro plan. This allows automatic syncing of heart rate, activity, and other vital data for continuous risk monitoring and more accurate predictions over time.',
        },
        {
            q: 'How do doctor consultations work?',
            a: 'Pro plan members can book appointments with verified cardiologists directly through the platform. Choose a time slot, describe your concerns, and the doctor will review your prediction history before the consultation for a more informed session.',
        },
    ]

    return (
        <div ref={containerRef} className="relative">
            {/* ═══ STICKY VIDEO BACKGROUND ═══ */}
            <motion.div className="hero-video-container" style={{ opacity: videoOpacity }}>
                <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                    <source src="/bg.mp4" type="video/mp4" />
                </video>
                <div className="hero-video-overlay" />
            </motion.div>

            {/* ═══ HERO SECTION ═══ */}
            <div className="relative z-10">
                <Navbar />

                <motion.section
                    style={{ opacity: heroContentOpacity }}
                    className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20"
                >
                    {/* Badge pill */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-hg-border bg-hg-card/50 backdrop-blur-sm text-sm text-hg-text-dim">
                            <span className="w-2 h-2 bg-hg-red rounded-full animate-pulse" />
                            AI-Powered Heart Disease Prediction
                        </span>
                    </motion.div>

                    {/* Main headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] max-w-5xl"
                    >
                        <span className="text-hg-white">Your Heart's</span>
                        <br />
                        <span className="text-gradient-red">Guardian Angel</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                        className="mt-6 text-lg md:text-xl text-hg-text-dim max-w-2xl leading-relaxed"
                    >
                        Advanced AI predicts cardiovascular risk in seconds. Explainable results.
                        Personalized insights. No black boxes — just clear, actionable health intelligence.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.7 }}
                        className="mt-10 flex flex-wrap gap-4 justify-center"
                    >
                        <Link to="/register" className="btn-primary text-base">
                            Start Free Assessment
                        </Link>
                        <a href="#features" className="btn-outline text-base">
                            Discover More
                        </a>
                    </motion.div>

                    {/* Scroll indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="absolute bottom-12 left-1/2 -translate-x-1/2"
                    >
                        <div className="flex flex-col items-center gap-2 text-hg-text-muted text-sm">
                            <span>Scroll down</span>
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-5 h-8 border-2 border-hg-border-light rounded-full flex justify-center pt-1"
                            >
                                <div className="w-1.5 h-1.5 bg-hg-red rounded-full" />
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.section>

                {/* ═══ ABOUT SECTION ═══ */}
                <section className="section-dark py-32 px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.8 }}
                        >
                            <p className="text-hg-text-muted text-sm uppercase tracking-widest mb-6">About HeartGuard AI</p>
                        </motion.div>

                        <div className="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-hg-text">
                            <AnimatedText
                                text="HeartGuard AI gives you a complete picture of your cardiovascular health — from real-time risk scores and explainable AI insights to personalized lifestyle recommendations and doctor connections. Every prediction is transparent, every metric is backed by clinical data, so you stay ahead of heart disease before it becomes an emergency."
                            />
                        </div>

                        <motion.div
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="mt-12 h-[1px] bg-gradient-to-r from-transparent via-hg-red/40 to-transparent"
                        />
                    </div>
                </section>

                {/* ═══ FEATURES SECTION ═══ */}
                <section id="features" className="section-dark py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <p className="text-hg-red text-sm uppercase tracking-widest mb-3">Platform Features</p>
                            <h2 className="text-4xl md:text-5xl font-bold text-hg-white">
                                Everything You Need
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {features.map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="glass-card rounded-2xl p-6 group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-2xl">{f.icon}</span>
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${f.badgeColor}`}>
                                            {f.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-semibold text-hg-white mb-1">
                                        {f.title}
                                        <span className="text-sm font-normal text-hg-text-muted ml-2">{f.version}</span>
                                    </h3>

                                    <p className="text-hg-text-dim text-sm leading-relaxed mb-4">{f.desc}</p>

                                    <div className="flex gap-2 flex-wrap">
                                        {f.tags.map((tag, j) => (
                                            <span
                                                key={j}
                                                className="text-xs px-3 py-1 rounded-full border border-hg-border text-hg-text-muted hover:border-hg-red/40 hover:text-hg-red-light transition-colors cursor-default"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ SHOWCASE SECTION ═══ */}
                <section className="section-dark py-24 px-6">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
                        >
                            <h2 className="text-4xl md:text-5xl font-bold text-hg-white leading-tight">
                                Where Technology
                                <br />
                                Meets Compassion
                            </h2>
                            <p className="text-hg-text-dim max-w-sm text-sm leading-relaxed">
                                Our AI-powered platform combines cutting-edge machine learning with clinical expertise
                                to deliver predictions you can trust and act upon with confidence.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {showcaseItems.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: i * 0.15 }}
                                    className="rounded-2xl overflow-hidden border border-hg-border group hover:border-hg-red/30 transition-all duration-500"
                                >
                                    {/* Video/visual area */}
                                    <div className="relative h-64 overflow-hidden bg-hg-dark">
                                        {item.hasVideo ? (
                                            <>
                                                <video
                                                    autoPlay muted loop playsInline
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                                                >
                                                    <source src="/bg.mp4" type="video/mp4" />
                                                </video>
                                                <div className="absolute inset-0 bg-gradient-to-t from-hg-black via-transparent to-transparent" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-hg-red-dark/20 via-hg-dark to-hg-black flex items-center justify-center">
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                                    transition={{ repeat: Infinity, duration: 3 }}
                                                    className="w-32 h-32 rounded-full bg-hg-red/10 border border-hg-red/20 flex items-center justify-center"
                                                >
                                                    <div className="w-16 h-16 rounded-full bg-hg-red/20 border border-hg-red/30 flex items-center justify-center">
                                                        <span className="text-3xl">❤️</span>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}

                                        {/* Top bar */}
                                        <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                                            <span className="text-sm font-medium text-hg-white bg-hg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                {item.title}
                                            </span>
                                            <span className="text-xs text-hg-text-dim bg-hg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg cursor-pointer hover:text-hg-red transition-colors">
                                                {item.cta}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="p-5 bg-hg-card">
                                        <p className="text-sm text-hg-text-dim">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ PRICING SECTION ═══ */}
                <section id="pricing" className="section-dark py-24 px-6">
                    <div className="max-w-5xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-16"
                        >
                            <p className="text-hg-red text-sm uppercase tracking-widest mb-3">Pricing</p>
                            <h2 className="text-3xl md:text-4xl font-semibold text-hg-white">
                                Select the plan that best suits your needs.
                            </h2>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {pricingPlans.map((plan, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className={`rounded-2xl p-7 flex flex-col border transition-all duration-300 ${plan.popular
                                        ? 'border-hg-red/50 bg-hg-card shadow-[0_0_40px_rgba(220,38,38,0.1)]'
                                        : 'border-hg-border bg-hg-card/60 hover:border-hg-border-light'
                                        }`}
                                >
                                    {/* Plan badge */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${plan.popular
                                            ? 'bg-hg-red/15 text-hg-red-light'
                                            : 'bg-hg-border/50 text-hg-text-muted'
                                            }`}>
                                            {plan.name}
                                        </span>
                                        {plan.popular && (
                                            <span className="text-xs px-2 py-1 rounded-full bg-hg-red text-white font-medium">
                                                Most popular
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="mb-2">
                                        <span className="text-4xl font-bold text-hg-white">{plan.price}</span>
                                        {plan.period && <span className="text-hg-text-muted">{plan.period}</span>}
                                    </div>
                                    <p className="text-sm text-hg-text-dim mb-6">{plan.desc}</p>

                                    {/* Features */}
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {plan.features.map((feat, j) => (
                                            <li key={j} className="flex items-center gap-3 text-sm text-hg-text">
                                                <span className="text-hg-red text-base">⊙</span>
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <Link
                                        to={getPricingLink(plan.name)}
                                        className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${plan.popular
                                            ? 'bg-hg-white text-hg-black hover:bg-hg-text'
                                            : 'bg-hg-border/50 text-hg-text hover:bg-hg-border-light'
                                            }`}
                                    >
                                        {user && plan.price !== 'Free' ? `Upgrade to ${plan.name}` : plan.cta}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ FAQ SECTION ═══ */}
                <section id="faq" className="section-dark py-24 px-6">
                    <div className="max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-12"
                        >
                            <p className="text-hg-red text-sm uppercase tracking-widest mb-3">FAQ</p>
                            <h2 className="text-3xl md:text-4xl font-semibold text-hg-white">
                                Frequently Asked Questions
                            </h2>
                        </motion.div>

                        <div className="border-t border-hg-border">
                            {faqs.map((faq, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.05 }}
                                >
                                    <FAQItem question={faq.q} answer={faq.a} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CTA + FOOTER ═══ */}
                <Footer />
            </div>
        </div>
    )
}
