import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const CP_MAP = { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal', 3: 'Asymptomatic' }
const THAL_MAP = { 0: 'Normal', 1: 'Fixed Defect', 2: 'Reversible', 3: 'Not Described' }

export default function PatientProfile() {
    const { patientId } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.role !== 'doctor') { navigate('/dashboard'); return }
        fetchData()
    }, [patientId])

    const fetchData = async () => {
        try {
            const r = await api.get(`/predict/patient/${patientId}`)
            setData(r.data)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }

    if (loading) return <div className="min-h-screen bg-hg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-hg-red border-t-transparent rounded-full animate-spin" /></div>
    if (!data) return <div className="min-h-screen bg-hg-black flex items-center justify-center text-hg-text-muted">Patient not found</div>

    const { patient, summary, trend, scans, latest } = data
    const riskColor = summary.avgRisk >= 50 ? '#ef4444' : summary.avgRisk >= 30 ? '#f59e0b' : '#22c55e'

    return (
        <div className="min-h-screen bg-hg-black">
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center"><span className="text-white text-xs font-bold">H</span></div><span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span></Link>
                        <span className="text-hg-border">›</span>
                        <span className="text-sm text-hg-text-dim">Patient Profile</span>
                    </div>
                    <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Back to Dashboard</Link>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Patient header */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-bold">{patient.name.charAt(0).toUpperCase()}</div>
                            <div>
                                <h1 className="text-2xl font-bold text-hg-white">{patient.name}</h1>
                                <p className="text-sm text-hg-text-dim">{patient.email} · Patient</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-center">
                            <div><div className="text-2xl font-bold text-blue-400">{summary.total}</div><div className="text-[10px] text-hg-text-muted">TOTAL SCANS</div></div>
                            <div><div className="text-2xl font-bold text-red-400">{summary.atRisk}</div><div className="text-[10px] text-hg-text-muted">AT RISK</div></div>
                            <div><div className="text-2xl font-bold text-green-400">{summary.safe}</div><div className="text-[10px] text-hg-text-muted">LOW RISK</div></div>
                            <div><div className="text-2xl font-bold" style={{ color: riskColor }}>{summary.avgRisk}%</div><div className="text-[10px] text-hg-text-muted">AVG RISK</div></div>
                        </div>
                    </div>
                </motion.div>

                {/* Chart (simple bar representation) */}
                {trend.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 mb-6">
                        <h2 className="text-lg font-bold text-hg-white mb-4">Risk Probability Over Time</h2>
                        <div className="flex items-end gap-1 h-40">
                            {trend.map((t, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                                    <div className="text-[9px] text-hg-text-muted mb-1">{t.prob}%</div>
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: `${Math.max(t.prob, 3)}%` }}
                                        transition={{ delay: i * 0.05 }}
                                        className="w-full rounded-t-sm"
                                        style={{ backgroundColor: t.hasDiseaseRisk ? '#ef4444' : '#22c55e', maxWidth: '24px', margin: '0 auto' }}
                                    />
                                    <div className="text-[8px] text-hg-text-muted mt-1 truncate w-full text-center">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Scan breakdown */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-hg-white mb-3">Scan Breakdown</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative w-28 h-28">
                                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#1a1a1a" strokeWidth="14" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="14" strokeDasharray={`${summary.total > 0 ? (summary.atRisk / summary.total) * 251 : 0} 251`} strokeLinecap="round" />
                                    <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="14" strokeDasharray={`${summary.total > 0 ? (summary.safe / summary.total) * 251 : 0} 251`} strokeDashoffset={`-${summary.total > 0 ? (summary.atRisk / summary.total) * 251 : 0}`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold text-hg-white">{summary.total}</span></div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-sm text-hg-text-dim">At Risk: {summary.atRisk}</span></div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-sm text-hg-text-dim">Low Risk: {summary.safe}</span></div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Latest scan */}
                    {latest && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-hg-white mb-1">Latest Scan Parameters</h3>
                            <p className="text-xs text-hg-text-muted mb-3">{new Date(latest.date).toLocaleString()}</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {Object.entries(latest.params).map(([k, v]) => (
                                    <div key={k} className="flex justify-between border-b border-hg-border/30 py-1">
                                        <span className="text-hg-text-muted text-xs capitalize">{k}</span>
                                        <span className="text-hg-text font-medium text-xs">{v}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Full scan history */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-hg-white mb-4">Full Scan History</h3>
                    <p className="text-xs text-hg-text-muted mb-4">{scans.length} total scans</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-hg-border">
                                {['#', 'Date & Time', 'Result', 'Risk %', 'Age · Sex', '❤️ · 🩸'].map(h => <th key={h} className="text-left py-3 px-2 text-hg-text-muted font-medium text-xs">{h}</th>)}
                            </tr></thead>
                            <tbody>{scans.map((s, i) => (
                                <tr key={s.id} className="border-b border-hg-border/30 hover:bg-hg-card-hover transition-colors">
                                    <td className="py-2 px-2 text-hg-text-muted text-xs">#{i + 1}</td>
                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{new Date(s.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="py-2 px-2"><span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.hasDiseaseRisk ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>{s.hasDiseaseRisk ? '⚠ AT RISK' : '✓ LOW RISK'}</span></td>
                                    <td className="py-2 px-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-hg-text font-medium text-xs">{s.riskScore}%</span>
                                            <div className="w-16 h-1.5 bg-hg-dark rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${s.riskScore}%`, backgroundColor: s.riskScore >= 50 ? '#ef4444' : s.riskScore >= 30 ? '#f59e0b' : '#22c55e' }} /></div>
                                        </div>
                                    </td>
                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{s.healthMetrics.age}y · {s.healthMetrics.sex === 1 ? 'M' : 'F'}</td>
                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{s.healthMetrics.thalach}bpm · {s.healthMetrics.chol}mg/dl</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
