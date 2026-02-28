import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/* ── Slider configs ── */
const SLIDERS = [
    { key: 'age', label: 'Age', min: 20, max: 90, step: 1, unit: 'years', icon: '📅', default: 50 },
    { key: 'trestbps', label: 'Resting Blood Pressure', min: 80, max: 220, step: 1, unit: 'mmHg', icon: '💢', default: 130 },
    { key: 'chol', label: 'Cholesterol', min: 100, max: 500, step: 1, unit: 'mg/dl', icon: '🩸', default: 250 },
    { key: 'thalach', label: 'Max Heart Rate', min: 60, max: 220, step: 1, unit: 'bpm', icon: '❤️', default: 150 },
    { key: 'oldpeak', label: 'ST Depression', min: 0, max: 6, step: 0.1, unit: '', icon: '📉', default: 1.0 },
]

const TOGGLES = [
    { key: 'sex', label: 'Sex', options: [{ v: 0, l: 'Female' }, { v: 1, l: 'Male' }], default: 1, icon: '👤' },
    {
        key: 'cp', label: 'Chest Pain', options: [
            { v: 0, l: 'Typical' }, { v: 1, l: 'Atypical' }, { v: 2, l: 'Non-anginal' }, { v: 3, l: 'Asymptomatic' },
        ], default: 0, icon: '🫀'
    },
    { key: 'fbs', label: 'Fasting Sugar >120', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }], default: 0, icon: '🍬' },
    {
        key: 'restecg', label: 'Resting ECG', options: [
            { v: 0, l: 'Normal' }, { v: 1, l: 'ST-T Abnormal' }, { v: 2, l: 'LV Hypertrophy' },
        ], default: 0, icon: '📈'
    },
    { key: 'exang', label: 'Exercise Angina', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }], default: 0, icon: '🏃' },
    {
        key: 'slope', label: 'ST Slope', options: [
            { v: 0, l: 'Up' }, { v: 1, l: 'Flat' }, { v: 2, l: 'Down' },
        ], default: 1, icon: '📊'
    },
    {
        key: 'ca', label: 'Major Vessels', options: [
            { v: 0, l: '0' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' },
        ], default: 0, icon: '🔬'
    },
    {
        key: 'thal', label: 'Thalassemia', options: [
            { v: 0, l: 'Normal' }, { v: 1, l: 'Fixed' }, { v: 2, l: 'Reversible' }, { v: 3, l: 'Other' },
        ], default: 2, icon: '🧬'
    },
]

/* ── Custom range slider ── */
function RangeSlider({ config, value, onChange }) {
    const pct = ((value - config.min) / (config.max - config.min)) * 100

    return (
        <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-hg-text flex items-center gap-1.5">
                    <span>{config.icon}</span> {config.label}
                </label>
                <span className="text-sm font-mono text-hg-red-light font-semibold">
                    {Number(value).toFixed(config.step < 1 ? 1 : 0)} {config.unit}
                </span>
            </div>
            <div className="relative h-8 flex items-center">
                <div className="absolute h-1.5 w-full bg-hg-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-hg-red-dark to-hg-red rounded-full transition-all duration-150"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <input
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={value}
                    onChange={e => onChange(config.key, Number(e.target.value))}
                    className="absolute w-full h-8 opacity-0 cursor-pointer z-10"
                />
                <div
                    className="absolute w-4 h-4 bg-hg-red rounded-full shadow-[0_0_10px_rgba(220,38,38,0.4)] border-2 border-hg-white pointer-events-none transition-all duration-150"
                    style={{ left: `calc(${pct}% - 8px)` }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-hg-text-muted mt-1">
                <span>{config.min}</span>
                <span>{config.max}</span>
            </div>
        </div>
    )
}

/* ── Toggle button group ── */
function ToggleGroup({ config, value, onChange }) {
    return (
        <div className="mb-4">
            <label className="text-xs text-hg-text-dim flex items-center gap-1.5 mb-2">
                <span>{config.icon}</span> {config.label}
            </label>
            <div className="flex gap-1 flex-wrap">
                {config.options.map(opt => (
                    <button
                        key={opt.v}
                        onClick={() => onChange(config.key, opt.v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${value === opt.v
                                ? 'bg-hg-red/15 border-hg-red/50 text-hg-red-light'
                                : 'bg-hg-dark border-hg-border text-hg-text-muted hover:border-hg-border-light'
                            }`}
                    >
                        {opt.l}
                    </button>
                ))}
            </div>
        </div>
    )
}

/* ── Live risk bar ── */
function RiskBar({ probability, prevProbability, loading }) {
    const pct = Math.round((probability || 0) * 100)
    const prevPct = Math.round((prevProbability || 0) * 100)
    const delta = pct - prevPct
    const color = pct < 30 ? '#22c55e' : pct < 50 ? '#f59e0b' : pct < 70 ? '#ef4444' : '#dc2626'
    const category = pct < 30 ? 'Low' : pct < 50 ? 'Moderate' : pct < 70 ? 'High' : 'Critical'

    return (
        <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-hg-white">Live Risk Score</h3>
                {loading && (
                    <div className="w-4 h-4 border-2 border-hg-red border-t-transparent rounded-full animate-spin" />
                )}
            </div>

            {/* Big number */}
            <div className="flex items-end gap-3 mb-4">
                <motion.span
                    key={pct}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl font-bold"
                    style={{ color }}
                >
                    {pct}%
                </motion.span>
                {delta !== 0 && prevProbability > 0 && (
                    <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-sm font-semibold mb-2 px-2 py-0.5 rounded-full ${delta > 0
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-green-500/10 text-green-400'
                            }`}
                    >
                        {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}%
                    </motion.span>
                )}
            </div>

            {/* Bar */}
            <div className="h-3 bg-hg-dark rounded-full overflow-hidden mb-2">
                <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{ background: `linear-gradient(90deg, ${color}80, ${color})` }}
                />
            </div>

            <div className="flex justify-between items-center">
                <span className="text-xs text-hg-text-muted">0% — Safe</span>
                <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: color + '15', color }}
                >
                    {category}
                </span>
                <span className="text-xs text-hg-text-muted">100% — Critical</span>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════ */
/*  WHAT-IF SIMULATOR PAGE                    */
/* ═══════════════════════════════════════════ */
export default function Simulator() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // Build initial values
    const initialValues = {}
    SLIDERS.forEach(s => { initialValues[s.key] = s.default })
    TOGGLES.forEach(t => { initialValues[t.key] = t.default })

    const [params, setParams] = useState(initialValues)
    const [probability, setProbability] = useState(null)
    const [prevProbability, setPrevProbability] = useState(null)
    const [loading, setLoading] = useState(false)
    const [snapshots, setSnapshots] = useState([])
    const debounceRef = useRef(null)

    useEffect(() => {
        if (!user) navigate('/login')
    }, [user, navigate])

    // Debounced prediction
    const runPrediction = useCallback((currentParams) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoading(true)
            try {
                const res = await api.post('/predict/simulate', currentParams)
                setPrevProbability(probability)
                setProbability(res.data.riskScore)
            } catch (err) {
                console.error('Simulation failed:', err)
            } finally {
                setLoading(false)
            }
        }, 300)
    }, [probability])

    const handleChange = (key, value) => {
        const updated = { ...params, [key]: value }
        setParams(updated)
        runPrediction(updated)
    }

    const handleReset = () => {
        setParams(initialValues)
        setProbability(null)
        setPrevProbability(null)
        setSnapshots([])
    }

    const saveSnapshot = () => {
        if (probability === null) return
        setSnapshots(prev => [...prev, {
            id: Date.now(),
            probability,
            params: { ...params },
            label: `Scenario ${prev.length + 1}`,
        }])
    }

    const loadSnapshot = (snap) => {
        setParams(snap.params)
        setPrevProbability(probability)
        setProbability(snap.probability)
    }

    // Run initial prediction on mount
    useEffect(() => {
        runPrediction(initialValues)
    }, [])

    if (!user) return null

    return (
        <div className="min-h-screen bg-hg-black">
            {/* Nav */}
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                                <span className="text-white text-xs font-bold">H</span>
                            </div>
                            <span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span>
                        </Link>
                        <span className="text-hg-border">|</span>
                        <span className="text-sm text-hg-text-dim">What-If Simulator</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-bold text-hg-white mb-2">What-If Simulator</h1>
                    <p className="text-hg-text-dim text-sm">
                        Adjust health parameters with sliders to see how your risk score changes in real-time.
                        Compare scenarios to understand which lifestyle changes matter most.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── LEFT: Sliders ── */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Continuous sliders */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-5">
                                Continuous Parameters
                            </h3>
                            {SLIDERS.map(s => (
                                <RangeSlider
                                    key={s.key}
                                    config={s}
                                    value={params[s.key]}
                                    onChange={handleChange}
                                />
                            ))}
                        </motion.div>

                        {/* Toggle parameters */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-card rounded-2xl p-6"
                        >
                            <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-5">
                                Categorical Parameters
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                                {TOGGLES.map(t => (
                                    <ToggleGroup
                                        key={t.key}
                                        config={t}
                                        value={params[t.key]}
                                        onChange={handleChange}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── RIGHT: Results ── */}
                    <div className="space-y-6">
                        {/* Live risk bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <RiskBar
                                probability={probability}
                                prevProbability={prevProbability}
                                loading={loading}
                            />
                        </motion.div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={saveSnapshot}
                                disabled={probability === null}
                                className="flex-1 bg-hg-card border border-hg-border text-hg-text py-2.5 rounded-xl text-sm font-medium hover:border-hg-red/40 transition-all cursor-pointer disabled:opacity-30"
                            >
                                📸 Save Scenario
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex-1 bg-hg-card border border-hg-border text-hg-text-dim py-2.5 rounded-xl text-sm font-medium hover:border-hg-border-light transition-all cursor-pointer"
                            >
                                ↺ Reset
                            </button>
                        </div>

                        {/* Saved scenarios */}
                        <AnimatePresence>
                            {snapshots.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="glass-card rounded-2xl p-5"
                                >
                                    <h4 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-3">
                                        Saved Scenarios
                                    </h4>
                                    <div className="space-y-2">
                                        {snapshots.map((snap, i) => {
                                            const pct = Math.round(snap.probability * 100)
                                            const color = pct < 30 ? '#22c55e' : pct < 50 ? '#f59e0b' : pct < 70 ? '#ef4444' : '#dc2626'
                                            return (
                                                <motion.button
                                                    key={snap.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => loadSnapshot(snap)}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-hg-dark border border-hg-border hover:border-hg-red/30 transition-all cursor-pointer text-left"
                                                >
                                                    <div>
                                                        <span className="text-sm text-hg-text">{snap.label}</span>
                                                        <div className="text-[10px] text-hg-text-muted mt-0.5">
                                                            Age {snap.params.age} · BP {snap.params.trestbps} · Chol {snap.params.chol}
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Tips */}
                        <div className="glass-card rounded-2xl p-5">
                            <h4 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-3">
                                💡 Tips
                            </h4>
                            <ul className="space-y-2 text-xs text-hg-text-dim leading-relaxed">
                                <li>• Drag sliders to see <span className="text-hg-red-light">real-time</span> risk changes</li>
                                <li>• Save scenarios to compare "before vs after" lifestyle changes</li>
                                <li>• Reducing cholesterol and quitting smoking often show the biggest impact</li>
                                <li>• Higher max heart rate during exercise usually means better fitness</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
