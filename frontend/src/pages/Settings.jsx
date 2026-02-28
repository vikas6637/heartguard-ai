import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Settings() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        if (!user) navigate('/login')
        else {
            setName(user.name || '')
            setEmail(user.email || '')
        }
    }, [user, navigate])

    const handleSave = async () => {
        setSaving(true)
        setSuccess('')
        try {
            await api.put('/auth/profile', { name })
            setSuccess('Profile updated!')
        } catch (e) { console.error(e) }
        finally { setSaving(false) }
    }

    const handleExportFHIR = async () => {
        setExporting(true)
        try {
            const res = await api.get('/fhir/export')
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `heartguard-fhir-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) { console.error(e) }
        finally { setExporting(false) }
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-hg-black">
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50">
                <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                                <span className="text-white text-xs font-bold">H</span>
                            </div>
                            <span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span>
                        </Link>
                        <span className="text-hg-border">|</span>
                        <span className="text-sm text-hg-text-dim">Settings</span>
                    </div>
                    <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Dashboard</Link>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
                {/* Profile */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-hg-white mb-4">Profile</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-hg-text-dim mb-1.5 block">Name</label>
                            <input value={name} onChange={e => setName(e.target.value)}
                                className="w-full bg-hg-dark border border-hg-border rounded-lg px-3 py-2 text-sm text-hg-text focus:outline-none focus:border-hg-red/50 transition-colors" />
                        </div>
                        <div>
                            <label className="text-xs text-hg-text-dim mb-1.5 block">Email</label>
                            <input value={email} disabled
                                className="w-full bg-hg-dark/50 border border-hg-border rounded-lg px-3 py-2 text-sm text-hg-text-muted cursor-not-allowed" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-hg-text-dim">Role:</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-hg-red/10 text-hg-red-light capitalize">{user.role}</span>
                            <span className="text-xs text-hg-text-dim ml-4">Tier:</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-hg-red/10 text-hg-red-light capitalize">{user.subscriptionTier}</span>
                        </div>
                        {success && <p className="text-xs text-green-400">{success}</p>}
                        <button onClick={handleSave} disabled={saving}
                            className="bg-gradient-to-r from-hg-red to-hg-red-dark text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 cursor-pointer">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </motion.div>

                {/* Subscription */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-hg-white mb-2">Subscription</h2>
                    <p className="text-sm text-hg-text-dim mb-4">
                        Current: <span className="text-hg-red-light font-semibold capitalize">{user.subscriptionTier}</span>
                    </p>
                    <Link to="/subscription"
                        className="inline-block bg-hg-card border border-hg-border text-hg-text px-5 py-2.5 rounded-xl text-sm font-medium hover:border-hg-red/40 transition-all">
                        Manage Subscription →
                    </Link>
                </motion.div>

                {/* Data Export */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-hg-white mb-2">Data Export</h2>
                    <p className="text-sm text-hg-text-dim mb-4">
                        Export your health data in <span className="text-hg-red-light">FHIR R4</span> format for use with EHR/EMR systems.
                    </p>
                    <button onClick={handleExportFHIR} disabled={exporting}
                        className="bg-hg-card border border-hg-border text-hg-text px-5 py-2.5 rounded-xl text-sm font-medium hover:border-hg-red/40 transition-all disabled:opacity-50 cursor-pointer">
                        {exporting ? 'Exporting...' : '📦 Export FHIR Bundle'}
                    </button>
                </motion.div>

                {/* Wearable Integrations */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
                    <h2 className="text-lg font-bold text-hg-white mb-4">Wearable Integrations</h2>
                    <div className="space-y-3">
                        {[
                            { icon: '⌚', name: 'Apple HealthKit', status: 'Architecture Ready', metrics: 'HR, BP, Glucose, SpO2, Steps' },
                            { icon: '📱', name: 'Google Fit', status: 'Architecture Ready', metrics: 'HR, BP, Glucose, Steps' },
                            { icon: '⌚', name: 'Fitbit', status: 'Planned', metrics: 'HR, Steps, Sleep' },
                        ].map((device, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-hg-dark border border-hg-border">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{device.icon}</span>
                                    <div>
                                        <p className="text-sm font-medium text-hg-text">{device.name}</p>
                                        <p className="text-[10px] text-hg-text-muted">{device.metrics}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${device.status === 'Planned' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                                    }`}>{device.status}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6 border-hg-red/20">
                    <h2 className="text-lg font-bold text-hg-red-light mb-4">Account</h2>
                    <button onClick={() => { logout(); navigate('/') }}
                        className="bg-hg-red/10 border border-hg-red/30 text-hg-red-light px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-hg-red/20 transition-all cursor-pointer">
                        Sign Out
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
