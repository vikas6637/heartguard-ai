import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const FIELDS = [
    { key: 'age', label: 'Age', type: 'number', min: 1, max: 120, icon: '📅', unit: 'years' },
    { key: 'sex', label: 'Sex', type: 'select', options: [{ v: 1, l: 'Male' }, { v: 0, l: 'Female' }], icon: '👤' },
    { key: 'cp', label: 'Chest Pain Type', type: 'select', options: [{ v: 0, l: 'Typical Angina' }, { v: 1, l: 'Atypical Angina' }, { v: 2, l: 'Non-anginal Pain' }, { v: 3, l: 'Asymptomatic' }], icon: '🫀' },
    { key: 'trestbps', label: 'Resting BP', type: 'number', min: 80, max: 220, icon: '💢', unit: 'mmHg' },
    { key: 'chol', label: 'Cholesterol', type: 'number', min: 100, max: 600, icon: '🩸', unit: 'mg/dl' },
    { key: 'fbs', label: 'Fasting Sugar >120', type: 'select', options: [{ v: 0, l: 'False' }, { v: 1, l: 'True' }], icon: '🍬' },
    { key: 'restecg', label: 'Resting ECG', type: 'select', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'ST-T Abnormality' }, { v: 2, l: 'LV Hypertrophy' }], icon: '📈' },
    { key: 'thalach', label: 'Max Heart Rate', type: 'number', min: 60, max: 220, icon: '❤️', unit: 'bpm' },
    { key: 'exang', label: 'Exercise Angina', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }], icon: '🏃' },
    { key: 'oldpeak', label: 'ST Depression', type: 'number', min: 0, max: 10, step: 0.1, icon: '📉' },
    { key: 'slope', label: 'ST Slope', type: 'select', options: [{ v: 0, l: 'Upsloping' }, { v: 1, l: 'Flat' }, { v: 2, l: 'Downsloping' }], icon: '📊' },
    { key: 'ca', label: 'Major Vessels', type: 'select', options: [{ v: 0, l: '0' }, { v: 1, l: '1' }, { v: 2, l: '2' }, { v: 3, l: '3' }], icon: '🔬' },
    { key: 'thal', label: 'Thalassemia', type: 'select', options: [{ v: 0, l: 'Normal' }, { v: 1, l: 'Fixed Defect' }, { v: 2, l: 'Reversible Defect' }, { v: 3, l: 'Not Described' }], icon: '🧬' },
]

const CP_MAP = { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal', 3: 'Asymptomatic' }
const ECG_MAP = { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy' }
const SLOPE_MAP = { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' }
const THAL_MAP = { 0: 'Normal', 1: 'Fixed Defect', 2: 'Reversible', 3: 'Not Described' }

function formatVal(key, val) {
    if (key === 'sex') return val === 1 ? 'Male' : 'Female'
    if (key === 'cp') return CP_MAP[val] || val
    if (key === 'fbs') return val === 1 ? 'True' : 'False'
    if (key === 'restecg') return ECG_MAP[val] || val
    if (key === 'exang') return val === 1 ? 'Yes' : 'No'
    if (key === 'slope') return SLOPE_MAP[val] || val
    if (key === 'thal') return THAL_MAP[val] || val
    if (key === 'trestbps') return val + ' mmHg'
    if (key === 'chol') return val + ' mg/dl'
    if (key === 'thalach') return val + ' bpm'
    if (key === 'age') return val + ' yrs'
    return val
}

/* ── Risk Gauge ── */
function RiskGauge({ probability }) {
    const pct = Math.round(probability * 100)
    const cat = pct < 30 ? 'Low' : pct < 50 ? 'Moderate' : pct < 70 ? 'High' : 'Critical'
    const color = pct < 30 ? '#22c55e' : pct < 50 ? '#f59e0b' : pct < 70 ? '#ef4444' : '#dc2626'
    const circ = 2 * Math.PI * 70
    return (
        <div className="flex flex-col items-center">
            <svg width="160" height="160" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="70" fill="none" stroke="#1a1a1a" strokeWidth="12" />
                <motion.circle cx="90" cy="90" r="70" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - (circ * pct) / 100 }} transition={{ duration: 1.2 }} transform="rotate(-90 90 90)" />
                <text x="90" y="82" textAnchor="middle" fill={color} fontSize="30" fontWeight="bold">{pct}%</text>
                <text x="90" y="105" textAnchor="middle" fill="#a3a3a3" fontSize="11">Risk Score</text>
            </svg>
            <span className="mt-1 px-3 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: color + '20', color }}>{cat} Risk</span>
        </div>
    )
}

/* ── Feature Bar ── */
function FeatureBar({ name, value, maxVal, delay = 0 }) {
    const pct = maxVal > 0 ? (value / maxVal) * 100 : 0
    return (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }} className="flex items-center gap-3 mb-2">
            <span className="text-xs text-hg-text-dim w-36 truncate text-right">{name}</span>
            <div className="flex-1 h-4 bg-hg-dark rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: delay + 0.2, duration: 0.6 }} className="h-full rounded-full bg-gradient-to-r from-hg-red to-red-400" />
            </div>
            <span className="text-xs text-hg-text-muted w-12 text-right">{value.toFixed(1)}%</span>
        </motion.div>
    )
}

/* ── PDF Report Generator (client-side) ── */
async function generatePDF(reportData) {
    const d = reportData
    const pct = d.probability
    const risk = d.riskCategory
    const color = pct < 30 ? '#22c55e' : pct < 50 ? '#f59e0b' : '#ef4444'
    const riskLabel = pct < 30 ? 'LOW RISK PROFILE' : pct < 50 ? 'MODERATE RISK PROFILE' : 'HIGH RISK PROFILE'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>HeartGuard Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#1a1a2e;padding:40px}
.header{text-align:center;border-bottom:3px solid #dc2626;padding-bottom:20px;margin-bottom:20px}
.header h1{font-size:24px;color:#dc2626}.header h2{font-size:13px;color:#666;margin-top:4px}
.meta{display:flex;justify-content:space-between;font-size:11px;color:#888;margin-bottom:25px}
.risk-banner{text-align:center;padding:20px;margin:20px 0;border-radius:10px;background:${color}15;border:2px solid ${color}}
.risk-banner h2{color:${color};font-size:20px}.risk-banner .pct{font-size:36px;font-weight:bold;color:${color}}
.section{margin:20px 0}.section h3{font-size:14px;color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:6px;margin-bottom:12px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#1a1a2e;color:#fff;padding:8px 10px;text-align:left}
td{padding:7px 10px;border-bottom:1px solid #eee}
tr:nth-child(even){background:#f8f9fa}
.risk-high{color:#ef4444;font-weight:bold}.risk-moderate{color:#f59e0b;font-weight:bold}.risk-normal{color:#22c55e}
.recommendation{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;margin-top:20px;font-size:12px;line-height:1.6}
.footer{margin-top:30px;font-size:9px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:10px}
@media print{body{padding:20px}button{display:none!important}}
</style></head><body>
<div class="header"><h1>❤️ HeartGuard AI</h1><h2>Heart Disease Risk Assessment Report</h2></div>
<div class="meta"><div><b>Report Generated:</b> ${new Date(d.date).toLocaleString()}</div><div><b>Patient:</b> ${d.patientName}</div></div>
<div class="meta"><div><b>Model:</b> ${d.model}</div><div><b>Dataset:</b> ${d.dataset}</div></div>
<div class="risk-banner"><h2>${riskLabel}</h2><div class="pct">${pct}%</div><div style="font-size:12px;color:#666">Probability of Heart Disease</div></div>
<div class="section"><h3>Patient Parameters</h3><table><tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr>
${Object.entries(d.params).reduce((acc, [k, v], i, arr) => {
        if (i % 2 === 0) { const next = arr[i + 1]; acc += `<tr><td><b>${k}</b></td><td>${v}</td><td><b>${next ? next[0] : ''}</b></td><td>${next ? next[1] : ''}</td></tr>` }; return acc
    }, '')}
</table></div>
<div class="section"><h3>Risk Factor Analysis</h3><table><tr><th>Feature</th><th>Patient Value</th><th>Clinical Range</th><th>Risk Level</th></tr>
${d.riskAnalysis.map(r => `<tr><td><b>${r.label}</b></td><td>${r.value}</td><td>${r.normal}</td><td class="risk-${r.level.toLowerCase()}">${r.level}</td></tr>`).join('')}
</table></div>
<div class="section"><h3>Recommendation</h3><div class="recommendation">${pct < 30
            ? 'Based on the assessment, this patient presents with a <b>low cardiovascular risk profile</b>. Maintain a heart-healthy lifestyle with regular exercise, balanced diet, and routine check-ups.'
            : pct < 50
                ? 'This patient shows a <b>moderate cardiovascular risk</b>. Closer monitoring of risk factors is recommended along with lifestyle modifications.'
                : 'This patient presents with <b>elevated cardiovascular risk</b>. Immediate cardiology consultation is strongly recommended.'
        }</div></div>
<div class="footer">⚠️ DISCLAIMER: This report is generated by an AI model for educational and informational purposes only. Always consult a qualified healthcare professional. Generated: ${new Date().toLocaleString()}</div>
</body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
}

/* ── ECG Report Generator ── */
async function generateECG(reportData) {
    const d = reportData
    const pct = d.probability
    const color = pct < 30 ? '#22c55e' : pct < 50 ? '#f59e0b' : '#ef4444'
    const riskLabel = pct < 30 ? 'LOW RISK PROFILE' : pct < 50 ? 'MODERATE RISK' : 'HIGH RISK'

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ECG Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;padding:20px}
.page{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
.top-bar{background:#1a1a2e;color:#fff;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-size:12px}
.ecg-strip{background:#1a1a2e;padding:16px 24px;position:relative;height:80px;overflow:hidden}
.ecg-strip svg{width:100%;height:100%}
.content{padding:24px}
.risk-section{display:flex;align-items:center;gap:20px;padding:16px;border-radius:10px;background:${color}10;border:1px solid ${color}40;margin:16px 0}
.risk-section .label{color:${color};font-weight:bold;font-size:16px}
.risk-section .pct{font-size:32px;font-weight:bold;color:${color};margin-left:auto}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
.stat-box{border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center}
.stat-box .val{font-size:18px;font-weight:bold;color:#1a1a2e}.stat-box .lbl{font-size:10px;color:#888;margin-top:2px}
.params{margin:20px 0}.params h3{font-size:13px;color:#888;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px}
table{width:100%;border-collapse:collapse;font-size:12px}td{padding:6px 10px;border-bottom:1px solid #f0f0f0}
.factors{margin:20px 0;padding:16px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca}
.factors h3{font-size:13px;color:#dc2626;margin-bottom:8px}
.factors li{font-size:11px;margin:4px 0;line-height:1.5}
.footer{font-size:9px;color:#999;padding:16px 24px;border-top:1px solid #eee;display:flex;justify-content:space-between}
@media print{body{padding:0;background:#fff}.page{box-shadow:none}button{display:none!important}}
</style></head><body>
<div class="page">
<div class="top-bar"><div>❤️ HeartGuard AI — ECG-Style Risk Report</div><div>${new Date(d.date).toLocaleString()} · Patient: ${d.patientName}</div></div>
<div class="ecg-strip"><svg viewBox="0 0 800 50"><polyline fill="none" stroke="#22c55e" stroke-width="1.5" points="0,25 20,25 40,25 50,25 55,20 60,30 65,15 70,35 75,10 80,40 85,25 90,25 110,25 130,25 140,25 145,20 150,30 155,15 160,35 165,10 170,40 175,25 180,25 200,25 220,25 230,25 235,20 240,30 245,15 250,35 255,10 260,40 265,25 270,25 290,25 310,25 320,25 325,20 330,30 335,15 340,35 345,10 350,40 355,25 360,25 380,25 400,25 410,25 415,20 420,30 425,15 430,35 435,10 440,40 445,25 450,25 470,25 490,25 500,25 505,20 510,30 515,15 520,35 525,10 530,40 535,25 540,25 560,25 580,25 590,25 595,20 600,30 605,15 610,35 615,10 620,40 625,25 630,25 650,25 670,25 680,25 685,20 690,30 695,15 700,35 705,10 710,40 715,25 720,25 740,25 760,25 780,25 800,25"/></svg></div>
<div class="content">
<div class="risk-section"><div><div style="font-size:12px;color:#888">✓ ${riskLabel}</div><div class="label">Continue healthy lifestyle monitoring</div></div><div class="pct">${pct}%<div style="font-size:11px;font-weight:normal;color:#888">PROBABILITY</div></div></div>
<div class="stats">
<div class="stat-box"><div class="val">${d.params.thalach}</div><div class="lbl">MAX HEART RATE</div></div>
<div class="stat-box"><div class="val">${d.params.trestbps}</div><div class="lbl">RESTING BP</div></div>
<div class="stat-box"><div class="val">${d.params.chol}</div><div class="lbl">CHOLESTEROL</div></div>
<div class="stat-box"><div class="val">${d.params.oldpeak}</div><div class="lbl">ST DEPRESSION</div></div>
</div>
<div class="stats">
<div class="stat-box"><div class="val">${d.params.ca}</div><div class="lbl">MAJOR VESSELS</div></div>
<div class="stat-box"><div class="val">${d.params.age}</div><div class="lbl">AGE</div></div>
<div class="stat-box"><div class="val" style="color:${d.params.exang === 'Yes' ? '#ef4444' : '#22c55e'}">${d.params.exang}</div><div class="lbl">EXERCISE ANGINA</div></div>
<div class="stat-box"><div class="val">${d.params.sex}</div><div class="lbl">SEX</div></div>
</div>
<div class="params"><h3>Full Parameters</h3><table>
${Object.entries(d.params).reduce((acc, [k, v], i, arr) => { if (i % 2 === 0) { const n = arr[i + 1]; acc += `<tr><td style="color:#888">${k}</td><td><b>${v}</b></td><td style="color:#888">${n ? n[0] : ''}</td><td><b>${n ? n[1] : ''}</b></td></tr>` }; return acc }, '')}
</table></div>
${d.explanation.factors.length > 0 ? `<div class="factors"><h3>Risk Factor Analysis</h3><ul>${d.explanation.factors.map(f => `<li>${f.icon} ${f.text}</li>`).join('')}</ul></div>` : ''}
</div>
<div class="footer"><div>⚠️ AI-generated report for educational purposes only.</div><div>${new Date().toLocaleString()}</div></div>
</div></body></html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
}

/* ── Explanation Modal ── */
function ExplainModal({ data, onClose }) {
    if (!data) return null
    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-hg-white">Risk Score Explanation</h3>
                    <button onClick={onClose} className="text-hg-text-muted hover:text-hg-white text-xl cursor-pointer">×</button>
                </div>
                <p className="text-sm text-hg-text-dim mb-4">{data.summary}</p>
                <h4 className="text-sm font-semibold text-hg-white mb-3">Risk Factors</h4>
                <div className="space-y-3">
                    {data.factors.map((f, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-sm ${f.level === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-300' : f.level === 'moderate' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-green-500/10 border-green-500/30 text-green-300'}`}>
                            <span className="mr-2">{f.icon}</span>{f.text}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

/* ── Compare Modal ── */
function CompareModal({ a, b, onClose }) {
    if (!a || !b) return null
    const pctA = Math.round(a.riskScore * 1000) / 10
    const pctB = Math.round(b.riskScore * 1000) / 10
    const mA = a.healthMetrics, mB = b.healthMetrics
    const params = FIELDS.map(f => ({ label: f.label, a: formatVal(f.key, mA[f.key]), b: formatVal(f.key, mB[f.key]), diff: mA[f.key] !== mB[f.key] }))
    const diffCount = params.filter(p => p.diff).length

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-hg-white">Compare Records</h3>
                    <button onClick={onClose} className="text-hg-text-muted hover:text-hg-white text-xl cursor-pointer">×</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-hg-dark border border-hg-border text-center">
                        <div className="text-xs text-hg-text-muted mb-1">Record A · {new Date(a.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        <div className={`text-xs font-bold ${pctA >= 30 ? 'text-red-400' : 'text-green-400'}`}>{pctA >= 30 ? 'AT RISK' : 'LOW RISK'}</div>
                        <div className="text-2xl font-bold text-hg-white">{pctA}%</div>
                    </div>
                    <div className="p-3 rounded-xl bg-hg-dark border border-hg-border text-center">
                        <div className="text-xs text-hg-text-muted mb-1">Record B · {new Date(b.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        <div className={`text-xs font-bold ${pctB >= 30 ? 'text-red-400' : 'text-green-400'}`}>{pctB >= 30 ? 'AT RISK' : 'LOW RISK'}</div>
                        <div className="text-2xl font-bold text-hg-white">{pctB}%</div>
                    </div>
                </div>
                <p className="text-xs text-hg-text-muted mb-3">{diffCount} parameters differ</p>
                <table className="w-full text-sm">
                    <thead><tr className="border-b border-hg-border"><th className="py-2 px-2 text-left text-hg-text-muted text-xs">Parameter</th><th className="py-2 px-2 text-left text-hg-text-muted text-xs">Record A</th><th className="py-2 px-2 text-left text-hg-text-muted text-xs">Record B</th></tr></thead>
                    <tbody>{params.map((p, i) => (
                        <tr key={i} className={`border-b border-hg-border/30 ${p.diff ? 'bg-yellow-500/5' : ''}`}>
                            <td className="py-2 px-2 text-hg-text-dim">{p.label}</td>
                            <td className={`py-2 px-2 ${p.diff ? 'text-yellow-400 font-medium' : 'text-hg-text'}`}>{p.a}</td>
                            <td className={`py-2 px-2 ${p.diff ? 'text-yellow-400 font-medium' : 'text-hg-text'}`}>{p.b}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </motion.div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════ */
export default function Dashboard() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [form, setForm] = useState({})
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    const [history, setHistory] = useState([])
    const [activeTab, setActiveTab] = useState('predict')
    const [explainData, setExplainData] = useState(null)
    const [compareA, setCompareA] = useState(null)
    const [compareB, setCompareB] = useState(null)
    const [selecting, setSelecting] = useState(false)
    const [doctorStats, setDoctorStats] = useState(null)

    useEffect(() => { if (!user) navigate('/login') }, [user, navigate])
    useEffect(() => { if (activeTab === 'history') fetchHistory() }, [activeTab])
    useEffect(() => { if (activeTab === 'doctor-dash' && user?.role === 'doctor') fetchDoctorStats() }, [activeTab])

    const fetchHistory = async () => { try { const r = await api.get('/predict/history?limit=50'); setHistory(r.data.predictions || []) } catch (e) { console.error(e) } }
    const fetchDoctorStats = async () => { try { const r = await api.get('/predict/dashboard-stats'); setDoctorStats(r.data) } catch (e) { console.error(e) } }

    const handleChange = (key, value) => setForm(p => ({ ...p, [key]: value }))

    const handlePredict = async (e) => {
        e.preventDefault(); setError(''); setResult(null)
        for (const f of FIELDS) { if (form[f.key] === undefined || form[f.key] === '') { setError(`Please fill: ${f.label}`); return } }
        setLoading(true)
        try { const r = await api.post('/predict', form); setResult(r.data) }
        catch (err) { setError(err.response?.data?.error || 'Prediction failed.') }
        finally { setLoading(false) }
    }

    const handleDownloadPDF = async () => {
        if (!result?.predictionId) return
        try { const r = await api.get(`/predict/${result.predictionId}/report`); generatePDF(r.data) }
        catch (e) { console.error(e) }
    }

    const handleECG = async (id) => {
        try { const r = await api.get(`/predict/${id}/report`); generateECG(r.data) }
        catch (e) { console.error(e) }
    }

    const handleWhy = async (id) => {
        try { const r = await api.get(`/predict/${id}/explain`); setExplainData(r.data) }
        catch (e) { console.error(e) }
    }

    const handleDelete = async (id) => {
        if (!confirm('Delete this prediction record?')) return
        try { await api.delete(`/predict/${id}`); setHistory(h => h.filter(p => p._id !== id)) }
        catch (e) { console.error(e) }
    }

    const handleLoad = (pred) => {
        if (!pred.healthMetrics) return
        setForm({ ...pred.healthMetrics }); setActiveTab('predict'); setResult(null)
    }

    const handleCompareSelect = (pred) => {
        if (!compareA) { setCompareA(pred); return }
        setCompareB(pred); setSelecting(false)
    }

    const handleExport = async () => {
        try {
            const r = await api.get('/predict/export')
            const rows = r.data.data
            if (!rows.length) return
            const headers = Object.keys(rows[0])
            const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h]}"`).join(','))].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a'); a.href = url; a.download = `HeartGuard_Export_${Date.now()}.csv`; a.click()
        } catch (e) { console.error(e) }
    }

    const sortedImp = useMemo(() => {
        if (!result?.featureImportance) return []
        return Object.entries(result.featureImportance).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    }, [result])
    const maxImp = sortedImp.length > 0 ? sortedImp[0].value : 1

    if (!user) return null
    const isDoctor = user.role === 'doctor'
    const tabs = [{ id: 'predict', label: '🫀 Predict' }, { id: 'history', label: '📋 History' }]
    if (isDoctor) tabs.push({ id: 'doctor-dash', label: '📊 Analytics' })

    return (
        <div className="min-h-screen bg-hg-black">
            <ExplainModal data={explainData} onClose={() => setExplainData(null)} />
            {compareA && compareB && <CompareModal a={compareA} b={compareB} onClose={() => { setCompareA(null); setCompareB(null) }} />}

            {/* Nav */}
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center"><span className="text-white text-xs font-bold">H</span></div>
                        <span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">🏠 Home</Link>
                        <span className="text-xs text-hg-text-dim">{user.name} <span className="text-hg-text-muted">({user.role})</span></span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-hg-red/10 text-hg-red-light capitalize">{user.subscriptionTier}</span>
                        <button onClick={logout} className="text-xs text-hg-text-muted hover:text-hg-red transition-colors cursor-pointer">Logout</button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Quick links */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                    <Link to="/" className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-hg-red/40 transition-all"><span className="text-xl">🏠</span><div><p className="text-sm font-medium text-hg-text group-hover:text-hg-white transition-colors">Home</p><p className="text-[10px] text-hg-text-muted">Landing Page</p></div></Link>
                    <Link to="/simulator" className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-hg-red/40 transition-all"><span className="text-xl">🎛️</span><div><p className="text-sm font-medium text-hg-text group-hover:text-hg-white transition-colors">Simulator</p><p className="text-[10px] text-hg-text-muted">What-If</p></div></Link>
                    <Link to="/chat" className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-hg-red/40 transition-all"><span className="text-xl">💬</span><div><p className="text-sm font-medium text-hg-text group-hover:text-hg-white transition-colors">AI Chat</p><p className="text-[10px] text-hg-text-muted">Assistant</p></div></Link>
                    <Link to="/appointments" className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-hg-red/40 transition-all"><span className="text-xl">📅</span><div><p className="text-sm font-medium text-hg-text group-hover:text-hg-white transition-colors">Appointments</p><p className="text-[10px] text-hg-text-muted">Book</p></div></Link>
                    <Link to="/video-calls" className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-green-500/40 transition-all"><span className="text-xl">📹</span><div><p className="text-sm font-medium text-hg-text group-hover:text-hg-white transition-colors">Video Call</p><p className="text-[10px] text-hg-text-muted">Consult</p></div></Link>
                    <Link to="/subscription" className="glass-card rounded-xl p-4 flex items-center gap-3 group hover:border-hg-red/40 transition-all"><span className="text-xl">💎</span><div><p className="text-sm font-medium text-hg-text group-hover:text-hg-white transition-colors">Plans</p><p className="text-[10px] text-hg-text-muted">Upgrade</p></div></Link>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-hg-card rounded-xl p-1 w-fit">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => { setActiveTab(t.id); setResult(null) }}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === t.id ? 'bg-hg-red/15 text-hg-red-light' : 'text-hg-text-dim hover:text-hg-text'}`}>{t.label}</button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── PREDICT TAB ── */}
                    {activeTab === 'predict' && (
                        <motion.div key="predict" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="glass-card rounded-2xl p-6">
                                    <h2 className="text-xl font-bold text-hg-white mb-1">Heart Disease Risk Assessment</h2>
                                    <p className="text-sm text-hg-text-dim mb-6">Enter clinical parameters for AI prediction</p>
                                    {error && <div className="mb-4 p-3 rounded-xl bg-hg-red/10 border border-hg-red/30 text-hg-red-light text-sm">{error}</div>}
                                    <form onSubmit={handlePredict} className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {FIELDS.map(f => (
                                                <div key={f.key}>
                                                    <label className="flex items-center gap-1.5 text-xs text-hg-text-dim mb-1.5"><span>{f.icon}</span> {f.label}</label>
                                                    {f.type === 'number' ? (
                                                        <input type="number" min={f.min} max={f.max} step={f.step || 1} value={form[f.key] ?? ''} onChange={e => handleChange(f.key, e.target.value === '' ? '' : Number(e.target.value))} placeholder={f.unit || ''} className="w-full bg-hg-dark border border-hg-border rounded-lg px-3 py-2 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors" />
                                                    ) : (
                                                        <select value={form[f.key] ?? ''} onChange={e => handleChange(f.key, e.target.value === '' ? '' : Number(e.target.value))} className="w-full bg-hg-dark border border-hg-border rounded-lg px-3 py-2 text-sm text-hg-text focus:outline-none focus:border-hg-red/50 transition-colors cursor-pointer">
                                                            <option value="">Select...</option>
                                                            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                                                        </select>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-hg-red to-hg-red-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all disabled:opacity-50 cursor-pointer mt-4">
                                            {loading ? '⏳ Analyzing...' : 'Run AI Prediction'}
                                        </button>
                                    </form>
                                </div>
                                <div>
                                    <AnimatePresence>
                                        {result && (
                                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                                                <div className="glass-card rounded-2xl p-6 flex flex-col items-center">
                                                    <h3 className="text-lg font-semibold text-hg-white mb-4">Prediction Result</h3>
                                                    <RiskGauge probability={result.riskScore} />
                                                    <p className="mt-4 text-sm text-hg-text-dim text-center max-w-sm">{result.hasDiseaseRisk ? 'Elevated cardiovascular risk detected. Consult a cardiologist.' : 'Low cardiovascular risk. Maintain a heart-healthy lifestyle.'}</p>
                                                    <div className="flex gap-3 mt-4">
                                                        <button onClick={handleDownloadPDF} className="px-4 py-2 rounded-lg bg-hg-red/10 border border-hg-red/30 text-hg-red-light text-xs font-medium hover:bg-hg-red/20 transition-all cursor-pointer">📄 Download PDF</button>
                                                        <button onClick={() => result.predictionId && handleECG(result.predictionId)} className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all cursor-pointer">💚 ECG Report</button>
                                                        <button onClick={() => result.predictionId && handleWhy(result.predictionId)} className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-medium hover:bg-yellow-500/20 transition-all cursor-pointer">❓ Why?</button>
                                                    </div>
                                                </div>
                                                <div className="glass-card rounded-2xl p-6">
                                                    <h3 className="text-lg font-semibold text-hg-white mb-4">Feature Importance</h3>
                                                    {sortedImp.slice(0, 10).map((f, i) => <FeatureBar key={f.name} name={f.name} value={f.value} maxVal={maxImp} delay={i * 0.05} />)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {!result && <div className="glass-card rounded-2xl p-10 flex flex-col items-center justify-center text-center h-full min-h-[300px]"><span className="text-4xl mb-4">🫀</span><h3 className="text-lg font-medium text-hg-text-dim">Ready to Analyze</h3><p className="text-sm text-hg-text-muted mt-2 max-w-xs">Fill in clinical parameters and click "Run AI Prediction".</p></div>}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── HISTORY TAB ── */}
                    {activeTab === 'history' && (
                        <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-hg-white">Prediction History</h2>
                                    <div className="flex gap-2">
                                        {selecting ? (
                                            <button onClick={() => { setSelecting(false); setCompareA(null) }} className="px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs cursor-pointer">Cancel Compare</button>
                                        ) : (
                                            <button onClick={() => { setSelecting(true); setCompareA(null); setCompareB(null) }} className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs cursor-pointer">🔄 Compare</button>
                                        )}
                                        <button onClick={() => { if (confirm('Clear all history?')) { history.forEach(p => api.delete(`/predict/${p._id}`)); setHistory([]) } }} className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs cursor-pointer">🗑 Clear All</button>
                                        {isDoctor && <button onClick={handleExport} className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs cursor-pointer">📥 Export CSV</button>}
                                    </div>
                                </div>
                                {selecting && <div className="mb-3 p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">Select 2 records to compare. {compareA ? `Record A selected (${new Date(compareA.createdAt).toLocaleDateString()})` : 'Click first record.'}</div>}
                                {history.length === 0 ? <p className="text-hg-text-muted text-sm py-8 text-center">No predictions yet.</p> : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-hg-border">
                                                {['Date', 'Risk', 'Score', 'Category', 'Age', 'BP', 'Chol', 'Actions'].map(h => <th key={h} className="text-left py-3 px-2 text-hg-text-muted font-medium text-xs">{h}</th>)}
                                            </tr></thead>
                                            <tbody>{history.map((p, i) => (
                                                <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                                    className={`border-b border-hg-border/50 hover:bg-hg-card-hover transition-colors ${selecting ? 'cursor-pointer' : ''} ${compareA?._id === p._id ? 'bg-blue-500/10' : ''}`}
                                                    onClick={() => selecting && handleCompareSelect(p)}>
                                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{new Date(p.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="py-2 px-2"><span className={`inline-block w-2 h-2 rounded-full ${p.riskScore >= 0.3 ? 'bg-red-500' : 'bg-green-500'}`} /></td>
                                                    <td className="py-2 px-2 text-hg-text font-medium">{(p.riskScore * 100).toFixed(1)}%</td>
                                                    <td className="py-2 px-2"><span className={`text-xs px-2 py-0.5 rounded-full ${p.riskCategory === 'Low' ? 'bg-green-500/10 text-green-400' : p.riskCategory === 'Moderate' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{p.riskCategory}</span></td>
                                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{p.healthMetrics?.age}y · {p.healthMetrics?.sex === 1 ? 'M' : 'F'}</td>
                                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{p.healthMetrics?.trestbps}</td>
                                                    <td className="py-2 px-2 text-hg-text-dim text-xs">{p.healthMetrics?.chol}</td>
                                                    <td className="py-2 px-2">
                                                        {!selecting && (
                                                            <div className="flex gap-1">
                                                                <button onClick={() => handleLoad(p)} title="Load" className="px-2 py-1 rounded text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 cursor-pointer">📂</button>
                                                                <button onClick={() => handleECG(p._id)} title="ECG" className="px-2 py-1 rounded text-[10px] bg-green-500/10 text-green-400 hover:bg-green-500/20 cursor-pointer">💚</button>
                                                                <button onClick={() => handleWhy(p._id)} title="Why" className="px-2 py-1 rounded text-[10px] bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 cursor-pointer">❓</button>
                                                                <button onClick={() => handleDelete(p._id)} title="Delete" className="px-2 py-1 rounded text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer">🗑</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </motion.tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ── DOCTOR ANALYTICS TAB ── */}
                    {activeTab === 'doctor-dash' && isDoctor && (
                        <motion.div key="doctor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            {!doctorStats ? <p className="text-hg-text-muted text-center py-10">Loading analytics...</p> : (
                                <div className="space-y-6">
                                    {/* Summary cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[{ l: 'Total Patients', v: doctorStats.summary.totalPatients, i: '👥', c: 'text-blue-400' },
                                        { l: 'Total Scans', v: doctorStats.summary.totalScans, i: '📊', c: 'text-purple-400' },
                                        { l: 'At Risk', v: doctorStats.summary.atRisk, i: '⚠️', c: 'text-red-400' },
                                        { l: 'Risk Rate', v: doctorStats.summary.riskPct + '%', i: '📈', c: 'text-yellow-400' }]
                                            .map((s, i) => (
                                                <div key={i} className="glass-card rounded-xl p-4 text-center">
                                                    <span className="text-2xl">{s.i}</span>
                                                    <div className={`text-2xl font-bold mt-1 ${s.c}`}>{s.v}</div>
                                                    <div className="text-xs text-hg-text-muted">{s.l}</div>
                                                </div>
                                            ))}
                                    </div>
                                    {/* Patients list */}
                                    <div className="glass-card rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-hg-white">All Patients</h3>
                                            <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium cursor-pointer">📥 Export All</button>
                                        </div>
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-hg-border">
                                                {['Patient', 'Scans', 'At Risk', 'Avg Risk', 'Action'].map(h => <th key={h} className="text-left py-3 px-3 text-hg-text-muted font-medium text-xs">{h}</th>)}
                                            </tr></thead>
                                            <tbody>{doctorStats.patients.map((p, i) => (
                                                <tr key={i} className="border-b border-hg-border/30 hover:bg-hg-card-hover transition-colors">
                                                    <td className="py-3 px-3 text-hg-text font-medium">{p.name}</td>
                                                    <td className="py-3 px-3 text-hg-text-dim">{p.scans}</td>
                                                    <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${p.atRisk > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>{p.atRisk}</span></td>
                                                    <td className="py-3 px-3 text-hg-text-dim">{p.avgRisk}%</td>
                                                    <td className="py-3 px-3"><Link to={`/patient/${p.id}`} className="text-xs text-hg-red hover:text-hg-red-light transition-colors">View Profile →</Link></td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
