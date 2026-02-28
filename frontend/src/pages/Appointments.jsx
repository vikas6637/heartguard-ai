import { useState, useEffect } from 'react'
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

/* ── Mini calendar ── */
function MiniCalendar({ selected, onSelect }) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const monthName = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })

    const days = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

    const isSelected = (d) => {
        if (!selected || !d) return false
        const sel = new Date(selected)
        return sel.getDate() === d && sel.getMonth() === month && sel.getFullYear() === year
    }

    const isPast = (d) => {
        if (!d) return true
        const date = new Date(year, month, d)
        return date < today
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="text-hg-text-dim hover:text-hg-white transition-colors cursor-pointer text-lg px-2">‹</button>
                <span className="text-sm font-medium text-hg-text">{monthName}</span>
                <button onClick={nextMonth} className="text-hg-text-dim hover:text-hg-white transition-colors cursor-pointer text-lg px-2">›</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                    <span key={d} className="text-[10px] text-hg-text-muted font-medium py-1">{d}</span>
                ))}
                {days.map((d, i) => (
                    <button
                        key={i}
                        disabled={!d || isPast(d)}
                        onClick={() => {
                            if (d && !isPast(d)) {
                                const date = new Date(year, month, d)
                                onSelect(date.toISOString().split('T')[0])
                            }
                        }}
                        className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer
              ${!d ? 'invisible' : ''}
              ${isPast(d) ? 'text-hg-text-muted/30 cursor-not-allowed' : ''}
              ${isSelected(d) ? 'bg-hg-red text-white font-bold' : 'text-hg-text hover:bg-hg-card-hover'}
            `}
                    >
                        {d}
                    </button>
                ))}
            </div>
        </div>
    )
}

/* ── Status badge ── */
function StatusBadge({ status }) {
    const styles = {
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        approved: 'bg-green-500/10 text-green-400 border-green-500/20',
        rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
        completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        'cancel-requested': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        'postpone-requested': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        rescheduled: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    }
    const labels = {
        pending: '⏳ Pending Approval',
        approved: '✅ Approved',
        rejected: '❌ Rejected',
        completed: '✔️ Completed',
        cancelled: '🚫 Cancelled',
        'cancel-requested': '🔴 Cancel Requested',
        'postpone-requested': '🟣 Postpone Requested',
        rescheduled: '🔄 Rescheduled',
    }
    return (
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${styles[status] || styles.pending}`}>
            {labels[status] || status}
        </span>
    )
}

/* ═══════════════════════════════════════════ */
/*  APPOINTMENTS PAGE                         */
/* ═══════════════════════════════════════════ */
export default function Appointments() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('book')
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [selectedDoctor, setSelectedDoctor] = useState(null)
    const [selectedDate, setSelectedDate] = useState('')
    const [selectedSlot, setSelectedSlot] = useState('')
    const [reason, setReason] = useState('')
    const [bookedSlots, setBookedSlots] = useState([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        if (!user) navigate('/login')
    }, [user, navigate])

    useEffect(() => {
        fetchDoctors()
        fetchAppointments()
    }, [])

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            fetchBookedSlots()
        }
    }, [selectedDoctor, selectedDate])

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/appointments/doctors')
            setDoctors(res.data.doctors || [])
        } catch (e) { console.error(e) }
    }

    const fetchAppointments = async () => {
        try {
            const res = await api.get('/appointments')
            setAppointments(res.data.appointments || [])
        } catch (e) { console.error(e) }
    }

    const fetchBookedSlots = async () => {
        try {
            const res = await api.get(`/appointments/slots/${selectedDoctor}/${selectedDate}`)
            setBookedSlots(res.data.bookedSlots || [])
        } catch (e) { console.error(e) }
    }

    const handleBook = async () => {
        if (!selectedDoctor || !selectedDate || !selectedSlot) {
            setError('Please select a doctor, date, and time slot')
            return
        }
        setLoading(true)
        setError('')
        setSuccess('')
        try {
            await api.post('/appointments', {
                doctorId: selectedDoctor,
                appointmentDate: selectedDate,
                timeSlot: selectedSlot,
                reason,
            })
            setSuccess('Appointment request sent! Waiting for doctor approval.')
            setSelectedSlot('')
            setReason('')
            fetchAppointments()
            fetchBookedSlots()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to book appointment')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (id, action) => {
        try {
            await api.put(`/appointments/${id}`, { action })
            fetchAppointments()
        } catch (e) {
            console.error(e)
        }
    }

    const isDoctor = user?.role === 'doctor'

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
                        <span className="text-sm text-hg-text-dim">Appointments</span>
                    </div>
                    <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Dashboard</Link>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-1 mb-8 bg-hg-card rounded-xl p-1 w-fit">
                    {[
                        { id: 'book', label: '📅 Book', show: !isDoctor },
                        { id: 'upcoming', label: isDoctor ? '🩺 Patient Appointments' : '📋 My Appointments', show: true },
                    ].filter(t => t.show).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${activeTab === tab.id ? 'bg-hg-red/15 text-hg-red-light' : 'text-hg-text-dim hover:text-hg-text'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── BOOK TAB (patients only) ── */}
                    {activeTab === 'book' && !isDoctor && (
                        <motion.div key="book" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Step 1: Select Doctor */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-4">1. Select Doctor</h3>
                                    {doctors.length === 0 ? (
                                        <p className="text-sm text-hg-text-dim py-8 text-center">No doctors available yet.<br /><span className="text-[10px] text-hg-text-muted">Register as a doctor to appear here.</span></p>
                                    ) : (
                                        <div className="space-y-2">
                                            {doctors.map(doc => (
                                                <button
                                                    key={doc._id}
                                                    onClick={() => setSelectedDoctor(doc._id)}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${selectedDoctor === doc._id
                                                        ? 'border-hg-red/50 bg-hg-red/5'
                                                        : 'border-hg-border bg-hg-dark hover:border-hg-border-light'
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium text-hg-text">🩺 Dr. {doc.name}</p>
                                                    <p className="text-[10px] text-hg-text-muted mt-0.5">{doc.specialization || 'General Physician'}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Select Date */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-4">2. Select Date</h3>
                                    <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />
                                    {selectedDate && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-xl bg-hg-dark border border-hg-border">
                                            <p className="text-xs text-hg-text-dim">Selected:</p>
                                            <p className="text-sm font-medium text-hg-red-light">
                                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Step 3: Select Time + Book */}
                                <div className="glass-card rounded-2xl p-6">
                                    <h3 className="text-sm font-semibold text-hg-text-muted uppercase tracking-wider mb-4">3. Select Time</h3>
                                    {!selectedDoctor || !selectedDate ? (
                                        <p className="text-xs text-hg-text-muted py-6 text-center">Select a doctor and date first</p>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-2 gap-2 mb-4 max-h-52 overflow-y-auto pr-1">
                                                {TIME_SLOTS.map(slot => {
                                                    const isBooked = bookedSlots.includes(slot)
                                                    return (
                                                        <button
                                                            key={slot}
                                                            disabled={isBooked}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${isBooked
                                                                ? 'bg-hg-dark/50 border-hg-border/50 text-hg-text-muted/30 cursor-not-allowed line-through'
                                                                : selectedSlot === slot
                                                                    ? 'bg-hg-red/15 border-hg-red/50 text-hg-red-light'
                                                                    : 'bg-hg-dark border-hg-border text-hg-text-dim hover:border-hg-border-light'
                                                                }`}
                                                        >
                                                            {slot}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                            <textarea
                                                value={reason}
                                                onChange={e => setReason(e.target.value)}
                                                placeholder="Reason for visit (optional)"
                                                rows={2}
                                                className="w-full bg-hg-dark border border-hg-border rounded-xl px-3 py-2 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors mb-4 resize-none"
                                            />
                                            {error && <p className="text-xs text-hg-red-light mb-3">{error}</p>}
                                            {success && <p className="text-xs text-green-400 mb-3">{success}</p>}
                                            <button
                                                onClick={handleBook}
                                                disabled={loading || !selectedSlot}
                                                className="w-full bg-gradient-to-r from-hg-red to-hg-red-dark text-white py-3 rounded-xl font-semibold text-sm hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] transition-all disabled:opacity-30 cursor-pointer"
                                            >
                                                {loading ? 'Booking...' : 'Request Appointment'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── APPOINTMENTS LIST ── */}
                    {activeTab === 'upcoming' && (
                        <motion.div key="upcoming" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="glass-card rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-hg-white">
                                        {isDoctor ? 'Patient Appointments' : 'My Appointments'}
                                    </h2>
                                </div>

                                {/* Filter tabs */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {[
                                        { id: 'all', label: 'All', color: 'bg-hg-border/50 text-hg-text' },
                                        { id: 'pending', label: 'Pending', color: 'bg-yellow-500/10 text-yellow-400' },
                                        { id: 'approved', label: 'Approved', color: 'bg-green-500/10 text-green-400' },
                                        { id: 'rejected', label: 'Rejected', color: 'bg-red-500/10 text-red-400' },
                                        { id: 'completed', label: 'Completed', color: 'bg-blue-500/10 text-blue-400' },
                                    ].map(f => {
                                        const count = f.id === 'all' ? appointments.length : appointments.filter(a => a.status === f.id).length
                                        return (
                                            <button key={f.id} onClick={() => setFilter(f.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${filter === f.id ? f.color + ' border-current' : 'bg-hg-dark border-hg-border text-hg-text-muted hover:border-hg-border-light'}`}>
                                                {f.label} <span className="ml-1 opacity-60">{count}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {appointments.filter(a => filter === 'all' || a.status === filter).length === 0 ? (
                                    <p className="text-hg-text-muted text-sm py-8 text-center">No {filter === 'all' ? '' : filter} appointments.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {appointments.filter(a => filter === 'all' || a.status === filter).map((apt, i) => (
                                            <motion.div
                                                key={apt._id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className="p-4 rounded-xl border border-hg-border bg-hg-dark hover:border-hg-border-light transition-all"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-hg-text">
                                                            {isDoctor ? `Patient: ${apt.patient?.name}` : `Dr. ${apt.doctor?.name}`}
                                                        </p>
                                                        <p className="text-xs text-hg-text-muted mt-0.5">
                                                            {apt.doctor?.specialization || 'General Physician'}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-xs text-hg-text-dim">
                                                            <span>📅 {new Date(apt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                            <span>🕐 {apt.timeSlot}</span>
                                                        </div>
                                                        {apt.reason && <p className="text-xs text-hg-text-muted mt-2 italic">"{apt.reason}"</p>}
                                                        {apt.doctorNotes && <p className="text-xs text-hg-text-dim mt-1">📝 Doctor: {apt.doctorNotes}</p>}
                                                    </div>

                                                    <div className="flex flex-col items-end gap-2 ml-4">
                                                        <StatusBadge status={apt.status} />

                                                        {/* ── Doctor action buttons ── */}
                                                        {isDoctor && apt.status === 'pending' && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(apt._id, 'approve')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer border border-green-500/20">
                                                                    ✓ Approve
                                                                </button>
                                                                <button onClick={() => handleAction(apt._id, 'reject')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer border border-red-500/20">
                                                                    ✗ Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isDoctor && apt.status === 'approved' && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(apt._id, 'complete')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer border border-blue-500/20">
                                                                    ✔ Complete
                                                                </button>
                                                                <button onClick={() => handleAction(apt._id, 'cancel')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors cursor-pointer border border-gray-500/20">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        )}
                                                        {isDoctor && (apt.status === 'cancel-requested' || apt.status === 'postpone-requested') && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(apt._id, apt.status === 'cancel-requested' ? 'cancel' : 'reschedule')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors cursor-pointer border border-green-500/20">
                                                                    ✓ Accept Request
                                                                </button>
                                                                <button onClick={() => handleAction(apt._id, 'approve')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors cursor-pointer border border-yellow-500/20">
                                                                    Keep Original
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* ── Patient action buttons ── */}
                                                        {!isDoctor && ['pending', 'approved'].includes(apt.status) && (
                                                            <div className="flex gap-2 mt-1">
                                                                <button onClick={() => handleAction(apt._id, 'request-cancel')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer border border-red-500/20">
                                                                    Request Cancel
                                                                </button>
                                                                <button onClick={() => handleAction(apt._id, 'request-postpone')}
                                                                    className="text-[10px] px-3 py-1 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors cursor-pointer border border-purple-500/20">
                                                                    Request Postpone
                                                                </button>
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
        </div>
    )
}
