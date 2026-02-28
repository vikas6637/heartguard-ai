import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const TIME_SLOTS = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
]

const TIER_CONFIG = {
    free: { label: 'Free', color: 'text-gray-400', bg: 'bg-gray-500/10', limit: '1 call/week' },
    premium: { label: 'Premium', color: 'text-blue-400', bg: 'bg-blue-500/10', limit: '4 calls/week' },
    pro: { label: 'Pro', color: 'text-purple-400', bg: 'bg-purple-500/10', limit: 'Unlimited' },
}

/* ── Status Badge ── */
function StatusBadge({ status }) {
    const styles = {
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        approved: 'bg-green-500/10 text-green-400 border-green-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
        'in-progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        missed: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'postpone-requested': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    }
    const icons = {
        pending: '⏳', approved: '✅', rejected: '❌', 'in-progress': '📞',
        completed: '✔️', cancelled: '🚫', missed: '⚠️', 'postpone-requested': '🔄',
    }
    return (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${styles[status] || styles.pending}`}>
            {icons[status] || '•'} {status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
    )
}

/* ── Mini Calendar ── */
function MiniCalendar({ selected, onSelect }) {
    const [month, setMonth] = useState(new Date())
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const y = month.getFullYear(), m = month.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const daysIn = new Date(y, m + 1, 0).getDate()
    const days = [...Array(firstDay).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)]

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setMonth(new Date(y, m - 1, 1))} className="text-hg-text-dim hover:text-hg-white cursor-pointer px-2">‹</button>
                <span className="text-sm font-medium text-hg-text">{month.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={() => setMonth(new Date(y, m + 1, 1))} className="text-hg-text-dim hover:text-hg-white cursor-pointer px-2">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <span key={d} className="text-[10px] text-hg-text-muted font-medium py-1">{d}</span>)}
                {days.map((d, i) => {
                    const isPast = d && new Date(y, m, d) < today
                    const isSel = d && selected === `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                    return <button key={i} disabled={!d || isPast} onClick={() => d && !isPast && onSelect(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)}
                        className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center cursor-pointer transition-all ${!d ? 'invisible' : ''} ${isPast ? 'text-hg-text-muted/30 cursor-not-allowed' : ''} ${isSel ? 'bg-hg-red text-white font-bold' : 'text-hg-text hover:bg-hg-card-hover'}`}>{d}</button>
                })}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════ */
export default function VideoCalls() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [tab, setTab] = useState('schedule')
    const [doctors, setDoctors] = useState([])
    const [calls, setCalls] = useState([])
    const [usage, setUsage] = useState(null)
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlot, setSelectedSlot] = useState('')
    const [reason, setReason] = useState('')
    const [isEmergency, setIsEmergency] = useState(false)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')
    const [joiningId, setJoiningId] = useState(null)
    const [meetRoom, setMeetRoom] = useState(null) // { roomId, displayName, callId, patientName, doctorName, isEmergency }
    const jitsiContainerRef = useRef(null)
    const jitsiApiRef = useRef(null)

    const isDoctor = user?.role === 'doctor'

    useEffect(() => { if (!user) navigate('/login') }, [user])
    useEffect(() => { fetchCalls(); if (!isDoctor) fetchUsage() }, [])
    useEffect(() => { if (tab === 'schedule' && !isDoctor) fetchDoctors() }, [tab])

    const fetchDoctors = async () => { try { const r = await api.get('/appointments/doctors'); setDoctors(r.data.doctors || []) } catch (e) { console.error(e) } }
    const fetchCalls = async () => { try { const r = await api.get('/video-calls'); setCalls(r.data.videoCalls || []) } catch (e) { console.error(e) } }
    const fetchUsage = async () => { try { const r = await api.get('/video-calls/usage'); setUsage(r.data) } catch (e) { console.error(e) } }

    const handleSchedule = async () => {
        if (!selectedDoctor || !selectedDate || !selectedSlot) { setError('Select doctor, date & time'); return }
        setLoading(true); setError(''); setSuccess('')
        try {
            await api.post('/video-calls', {
                doctorId: selectedDoctor, scheduledAt: `${selectedDate}T${convertTo24h(selectedSlot)}:00`,
                timeSlot: selectedSlot, reason, callType: 'scheduled', isEmergency,
            })
            setSuccess(isEmergency ? '🚨 Emergency call sent! Doctor notified.' : '✅ Video call scheduled! Waiting for doctor approval.')
            setSelectedSlot(''); setReason(''); setIsEmergency(false)
            fetchCalls(); fetchUsage()
        } catch (err) { setError(err.response?.data?.error || 'Failed to schedule') }
        finally { setLoading(false) }
    }

    const handleInstantCall = async () => {
        if (!selectedDoctor) { setError('Select a doctor first'); return }
        setLoading(true); setError(''); setSuccess('')
        try {
            const r = await api.post('/video-calls', {
                doctorId: selectedDoctor, scheduledAt: new Date().toISOString(),
                callType: 'instant', isEmergency: true, reason: 'Emergency instant call',
            })
            setSuccess('🚨 Emergency call created! Opening room...')
            fetchCalls(); fetchUsage()
            setTimeout(() => joinCall(r.data.videoCall._id), 1000)
        } catch (err) { setError(err.response?.data?.error || 'Failed') }
        finally { setLoading(false) }
    }

    const handleAction = async (id, action) => {
        try { await api.put(`/video-calls/${id}`, { action }); fetchCalls() }
        catch (e) { console.error(e) }
    }

    const joinCall = async (id) => {
        setJoiningId(id)
        try {
            const r = await api.get(`/video-calls/${id}/room`)
            setMeetRoom(r.data)
            // Mark as in-progress if doctor
            if (isDoctor) await api.put(`/video-calls/${id}`, { action: 'start' })
            fetchCalls()
        } catch (e) { setError(e.response?.data?.error || 'Cannot join call') }
        finally { setJoiningId(null) }
    }

    const endMeeting = useCallback(async () => {
        if (jitsiApiRef.current) { try { jitsiApiRef.current.dispose() } catch (e) { /* ok */ } jitsiApiRef.current = null }
        if (meetRoom && isDoctor) { try { await api.put(`/video-calls/${meetRoom.callId}`, { action: 'complete' }) } catch (e) { /* ok */ } }
        setMeetRoom(null)
        fetchCalls()
    }, [meetRoom, isDoctor])

    // Load Jitsi External API script
    useEffect(() => {
        if (!meetRoom) return
        const existing = document.getElementById('jitsi-script')
        if (existing) { initJitsi(); return }
        const script = document.createElement('script')
        script.id = 'jitsi-script'
        script.src = 'https://meet.jit.si/external_api.js'
        script.onload = initJitsi
        document.head.appendChild(script)

        function initJitsi() {
            if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) return
            if (jitsiApiRef.current) { try { jitsiApiRef.current.dispose() } catch (e) { /* ok */ } }
            const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName: meetRoom.roomId,
                parentNode: jitsiContainerRef.current,
                width: '100%',
                height: '100%',
                userInfo: { displayName: meetRoom.displayName },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    prejoinPageEnabled: false,
                    disableDeepLinking: true,
                    hideConferenceSubject: true,
                    subject: 'HeartGuard Meet',
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_POWERED_BY: false,
                    DEFAULT_BACKGROUND: '#0a0a0a',
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'desktop', 'chat',
                        'raisehand', 'tileview', 'hangup',
                    ],
                },
            })
            api.on('readyToClose', () => endMeeting())
            jitsiApiRef.current = api
        }

        return () => { if (jitsiApiRef.current) { try { jitsiApiRef.current.dispose() } catch (e) { /* ok */ } jitsiApiRef.current = null } }
    }, [meetRoom])

    function convertTo24h(t) {
        const [time, mod] = t.split(' ')
        let [h, m] = time.split(':').map(Number)
        if (mod === 'PM' && h !== 12) h += 12
        if (mod === 'AM' && h === 12) h = 0
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    }

    const filtered = calls.filter(c => filter === 'all' || c.status === filter)
    const pendingCount = calls.filter(c => c.status === 'pending').length
    const tierConf = TIER_CONFIG[user?.subscriptionTier] || TIER_CONFIG.free

    if (!user) return null
    const tabs = isDoctor
        ? [{ id: 'calls', label: `📞 Incoming Calls ${pendingCount > 0 ? `(${pendingCount})` : ''}` }]
        : [{ id: 'schedule', label: '📅 Schedule Call' }, { id: 'calls', label: '📋 My Calls' }]

    return (
        <div className="min-h-screen bg-hg-black">
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center"><span className="text-white text-xs font-bold">H</span></div>
                            <span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span>
                        </Link>
                        <span className="text-hg-border">|</span>
                        <span className="text-sm text-hg-text-dim">📹 Video Consultations</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isDoctor && usage && (
                            <span className={`text-xs px-2.5 py-1 rounded-full ${tierConf.bg} ${tierConf.color} border border-current/20`}>
                                {tierConf.label} · {usage.remaining}/{usage.limit === 999 ? '∞' : usage.limit} calls left
                            </span>
                        )}
                        <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Tier banner for patients */}
                {!isDoctor && usage && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl glass-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📹</span>
                            <div>
                                <h2 className="text-sm font-semibold text-hg-white">Video Consultation</h2>
                                <p className="text-xs text-hg-text-muted">
                                    {usage.tier === 'pro' ? 'Unlimited calls with your Pro plan' :
                                        `${usage.remaining} of ${usage.limit} weekly calls remaining (${tierConf.label} plan)`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Usage bar */}
                            {usage.limit !== 999 && (
                                <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-hg-dark rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{
                                            width: `${Math.min((usage.used / usage.limit) * 100, 100)}%`,
                                            backgroundColor: usage.remaining === 0 ? '#ef4444' : usage.remaining <= 1 ? '#f59e0b' : '#22c55e'
                                        }} />
                                    </div>
                                    <span className="text-xs text-hg-text-muted">{usage.used}/{usage.limit}</span>
                                </div>
                            )}
                            {usage.tier !== 'pro' && (
                                <Link to="/subscription" className="text-xs px-3 py-1.5 rounded-lg bg-hg-red/10 border border-hg-red/30 text-hg-red-light hover:bg-hg-red/20 transition-all">
                                    Upgrade for more
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Doctor notification banner */}
                {isDoctor && pendingCount > 0 && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-3">
                        <span className="text-2xl animate-pulse">🔔</span>
                        <div>
                            <p className="text-sm font-semibold text-yellow-400">{pendingCount} Pending Call Request{pendingCount > 1 ? 's' : ''}</p>
                            <p className="text-xs text-yellow-300/70">Patients are waiting for your approval</p>
                        </div>
                    </motion.div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-hg-card rounded-xl p-1 w-fit">
                    {tabs.map(t => (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${tab === t.id ? 'bg-hg-red/15 text-hg-red-light' : 'text-hg-text-dim hover:text-hg-text'}`}>{t.label}</button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── SCHEDULE TAB ── */}
                    {tab === 'schedule' && !isDoctor && (
                        <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Select Doctor */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-4">1. Select Doctor</h3>
                                    {doctors.length === 0 ? (
                                        <p className="text-sm text-hg-text-dim py-8 text-center">No doctors available</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {doctors.map(doc => (
                                                <button key={doc._id} onClick={() => setSelectedDoctor(doc._id)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${selectedDoctor === doc._id ? 'border-hg-red/50 bg-hg-red/5' : 'border-hg-border bg-hg-dark hover:border-hg-border-light'}`}>
                                                    <p className="text-sm font-medium text-hg-text">🩺 Dr. {doc.name}</p>
                                                    <p className="text-[10px] text-hg-text-muted mt-0.5">{doc.specialization || 'General Physician'}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {/* Emergency instant call button */}
                                    {selectedDoctor && (
                                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            onClick={handleInstantCall} disabled={loading}
                                            className="w-full mt-4 p-3 rounded-xl bg-red-500/15 border-2 border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
                                            🚨 Emergency Instant Call
                                        </motion.button>
                                    )}
                                </div>

                                {/* Select Date */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-4">2. Select Date</h3>
                                    <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />
                                    {selectedDate && (
                                        <div className="mt-4 p-3 rounded-xl bg-hg-dark border border-hg-border">
                                            <p className="text-xs text-hg-text-dim">Selected:</p>
                                            <p className="text-sm font-medium text-hg-red-light">
                                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Select Time + Book */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-4">3. Select Time & Book</h3>
                                    {!selectedDoctor || !selectedDate ? (
                                        <p className="text-xs text-hg-text-muted py-6 text-center">Select doctor and date first</p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto pr-1">
                                                {TIME_SLOTS.map(slot => (
                                                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                                                        className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${selectedSlot === slot ? 'bg-hg-red/15 border-hg-red/50 text-hg-red-light' : 'bg-hg-dark border-hg-border text-hg-text-dim hover:border-hg-border-light'}`}>
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for consultation (optional)"
                                                rows={2} className="w-full bg-hg-dark border border-hg-border rounded-xl px-3 py-2 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors mb-3 resize-none" />

                                            <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                                <input type="checkbox" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)}
                                                    className="w-4 h-4 rounded accent-red-500" />
                                                <span className="text-xs text-red-400">🚨 Mark as Emergency (auto-approved)</span>
                                            </label>

                                            {error && <p className="text-xs text-hg-red-light mb-3">{error}</p>}
                                            {success && <p className="text-xs text-green-400 mb-3">{success}</p>}

                                            <button onClick={handleSchedule} disabled={loading || !selectedSlot}
                                                className="w-full bg-gradient-to-r from-hg-red to-hg-red-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all disabled:opacity-30 cursor-pointer">
                                                {loading ? '⏳ Scheduling...' : isEmergency ? '🚨 Request Emergency Call' : '📹 Schedule Video Call'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── CALLS LIST TAB ── */}
                    {tab === 'calls' && (
                        <motion.div key="calls" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="glass-card rounded-2xl p-6">
                                <h2 className="text-xl font-bold text-hg-white mb-4">
                                    {isDoctor ? '📞 Patient Video Call Requests' : '📋 My Video Calls'}
                                </h2>

                                {/* Filter */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {[
                                        { id: 'all', label: 'All' },
                                        { id: 'pending', label: '⏳ Pending' },
                                        { id: 'approved', label: '✅ Approved' },
                                        { id: 'in-progress', label: '📞 In Progress' },
                                        { id: 'completed', label: '✔️ Done' },
                                    ].map(f => {
                                        const count = f.id === 'all' ? calls.length : calls.filter(c => c.status === f.id).length
                                        return (
                                            <button key={f.id} onClick={() => setFilter(f.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${filter === f.id ? 'bg-hg-red/15 border-hg-red/30 text-hg-red-light' : 'bg-hg-dark border-hg-border text-hg-text-muted hover:border-hg-border-light'}`}>
                                                {f.label} <span className="opacity-60">{count}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {filtered.length === 0 ? (
                                    <p className="text-hg-text-muted text-sm py-8 text-center">No video calls found.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {filtered.map((call, i) => (
                                            <motion.div key={call._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                                className={`p-4 rounded-xl border transition-all ${call.isEmergency ? 'border-red-500/40 bg-red-500/5' : 'border-hg-border bg-hg-dark hover:border-hg-border-light'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {call.isEmergency && <span className="text-red-400 text-xs font-bold animate-pulse">🚨 EMERGENCY</span>}
                                                            <p className="text-sm font-medium text-hg-text">
                                                                {isDoctor ? `Patient: ${call.patient?.name}` : `Dr. ${call.doctor?.name}`}
                                                            </p>
                                                            {!isDoctor && call.patient?.subscriptionTier && (
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${TIER_CONFIG[call.patient.subscriptionTier]?.bg} ${TIER_CONFIG[call.patient.subscriptionTier]?.color}`}>
                                                                    {call.patient.subscriptionTier}
                                                                </span>
                                                            )}
                                                            {isDoctor && call.patient?.subscriptionTier && (
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${TIER_CONFIG[call.patient.subscriptionTier]?.bg} ${TIER_CONFIG[call.patient.subscriptionTier]?.color}`}>
                                                                    {call.patient.subscriptionTier}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-hg-text-dim mt-1">
                                                            <span>📅 {new Date(call.scheduledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                            {call.timeSlot && <span>🕐 {call.timeSlot}</span>}
                                                            <span className="capitalize">📹 {call.callType}</span>
                                                        </div>
                                                        {call.reason && <p className="text-xs text-hg-text-muted mt-2 italic">"{call.reason}"</p>}
                                                        {call.doctorNotes && <p className="text-xs text-hg-text-dim mt-1">📝 Doctor: {call.doctorNotes}</p>}
                                                        {call.duration > 0 && <p className="text-xs text-hg-text-muted mt-1">⏱ Duration: {call.duration} min</p>}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 ml-4">
                                                        <StatusBadge status={call.status} />

                                                        {/* Join button */}
                                                        {['approved', 'in-progress'].includes(call.status) && (
                                                            <button onClick={() => joinCall(call._id)} disabled={joiningId === call._id}
                                                                className="px-4 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50">
                                                                {joiningId === call._id ? '⏳' : '📹'} Join Call
                                                            </button>
                                                        )}

                                                        {/* Doctor actions */}
                                                        {isDoctor && call.status === 'pending' && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(call._id, 'approve')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer border border-green-500/20">✓ Approve</button>
                                                                <button onClick={() => handleAction(call._id, 'reject')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer border border-red-500/20">✗ Reject</button>
                                                            </div>
                                                        )}
                                                        {isDoctor && call.status === 'in-progress' && (
                                                            <button onClick={() => handleAction(call._id, 'complete')}
                                                                className="text-[10px] px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer border border-blue-500/20">✔ End Call</button>
                                                        )}
                                                        {isDoctor && call.status === 'postpone-requested' && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(call._id, 'approve')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 cursor-pointer border border-green-500/20">✓ Accept</button>
                                                                <button onClick={() => handleAction(call._id, 'reject')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 cursor-pointer border border-yellow-500/20">Keep Original</button>
                                                            </div>
                                                        )}

                                                        {/* Patient actions */}
                                                        {!isDoctor && ['pending', 'approved'].includes(call.status) && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(call._id, 'cancel')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer border border-red-500/20">Cancel</button>
                                                                <button onClick={() => handleAction(call._id, 'request-postpone')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 cursor-pointer border border-purple-500/20">Postpone</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── HeartGuard Meet Modal ── */}
            <AnimatePresence>
                {meetRoom && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black">
                        {/* Meet header */}
                        <div className="h-14 bg-hg-card/95 backdrop-blur-xl border-b border-hg-border flex items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">📹</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-hg-white">HeartGuard<span className="text-green-400"> Meet</span></h3>
                                    <p className="text-[10px] text-hg-text-muted">
                                        {meetRoom.isEmergency && <span className="text-red-400 mr-1">🚨 EMERGENCY</span>}
                                        {meetRoom.patientName} ↔ Dr. {meetRoom.doctorName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-green-400 flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Live · Encrypted
                                </span>
                                <button onClick={endMeeting}
                                    className="px-4 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-all cursor-pointer">
                                    ✕ End Call
                                </button>
                            </div>
                        </div>
                        {/* Jitsi container */}
                        <div ref={jitsiContainerRef} className="w-full" style={{ height: 'calc(100vh - 56px)' }} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
