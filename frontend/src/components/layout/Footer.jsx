import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Footer() {
    const footerLinks = {
        Product: [
            { label: 'Heart Scan', href: '#features' },
            { label: 'XAI Dashboard', href: '#features' },
            { label: 'AI Chat Agent', href: '#features' },
            { label: 'Simulator', href: '#features' },
            { label: 'All Features', href: '#features' },
        ],
        Support: [
            { label: 'Documentation', href: '#' },
            { label: 'Help Center', href: '#' },
            { label: 'Community', href: '#' },
            { label: 'Contact Us', href: '#' },
        ],
        Resources: [
            { label: 'Blog', href: '#' },
            { label: 'Research', href: '#' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Changelog', href: '#' },
        ],
        About: [
            { label: 'About Us', href: '#' },
            { label: 'Careers', href: '#' },
            { label: 'Partners', href: '#' },
            { label: 'Security', href: '#' },
        ],
    }

    return (
        <footer className="section-dark border-t border-hg-border">
            {/* Top CTA band */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-hg-red/5 via-transparent to-transparent" />
                <div className="max-w-4xl mx-auto text-center py-20 px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {/* Logo icon */}
                        <div className="w-12 h-12 mx-auto mb-6 rounded-xl bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                            <span className="text-white text-lg font-bold">H</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-hg-white mb-4">
                            Start Protecting Your Heart Today
                        </h3>
                        <p className="text-hg-text-dim max-w-lg mx-auto mb-8">
                            Join thousands using HeartGuard AI for proactive cardiovascular health monitoring. Get your first prediction free.
                        </p>
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 bg-hg-red hover:bg-hg-red-light text-white px-8 py-3 rounded-full font-semibold transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.3)]"
                        >
                            Get started for free ↗
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Links grid */}
            <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
                {Object.entries(footerLinks).map(([category, links]) => (
                    <div key={category}>
                        <p className="text-hg-text-muted text-xs uppercase tracking-wider mb-4">// {category}</p>
                        <ul className="space-y-3">
                            {links.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm text-hg-text-dim hover:text-hg-white transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Newsletter */}
            <div className="max-w-6xl mx-auto px-6 py-8 border-t border-hg-border">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <p className="text-sm font-medium text-hg-text mb-1">Never miss an update</p>
                        <p className="text-xs text-hg-text-muted">Get the latest health insights and product updates from HeartGuard AI.</p>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <input
                            type="email"
                            placeholder="example@gmail.com"
                            className="bg-hg-card border border-hg-border rounded-lg px-4 py-2.5 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 w-full md:w-64 transition-colors"
                        />
                        <button className="bg-hg-white text-hg-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-hg-text transition-colors flex-shrink-0">
                            Join
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="max-w-6xl mx-auto px-6 py-6 border-t border-hg-border flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-hg-text-muted">
                    © {new Date().getFullYear()} HeartGuard AI. All rights reserved.
                </p>
                <div className="flex gap-6 text-xs text-hg-text-muted">
                    <a href="#" className="hover:text-hg-text transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-hg-text transition-colors">Terms of Service</a>
                </div>
            </div>
        </footer>
    )
}
