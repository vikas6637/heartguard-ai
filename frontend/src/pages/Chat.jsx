import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/* ── Chat bubble ── */
function ChatBubble({ msg, isUser }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div
                className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${isUser
                        ? 'bg-gradient-to-r from-hg-red to-hg-red-dark text-white rounded-br-md'
                        : 'bg-hg-card border border-hg-border text-hg-text rounded-bl-md'
                    }`}
            >
                {!isUser && (
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-hg-text-muted">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                            <span className="text-white text-[10px] font-bold">H</span>
                        </div>
                        HeartGuard AI
                    </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-[10px] mt-1.5 ${isUser ? 'text-red-200' : 'text-hg-text-muted'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </motion.div>
    )
}

/* ── Quick suggestion pills ── */
const SUGGESTIONS = [
    "I've been having chest pain lately",
    "What does my cholesterol level mean?",
    "Give me diet tips for heart health",
    "I feel short of breath during exercise",
    "What tests should I get for my heart?",
    "Help me understand my risk score",
]

/* ═══════════════════════════════════════════ */
/*  CHAT PAGE                                 */
/* ═══════════════════════════════════════════ */
export default function Chat() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "👋 Hello! I'm your HeartGuard AI assistant.\n\nI can help you:\n• Understand heart disease risk factors\n• Map your symptoms to clinical parameters\n• Provide personalized lifestyle advice\n• Explain your prediction results\n\nHow can I help you today?",
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const endRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        if (!user) navigate('/login')
    }, [user, navigate])

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return

        const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setLoading(true)

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }))
            const res = await api.post('/chat/message', { message: text.trim(), history })

            const assistantMsg = {
                role: 'assistant',
                content: res.data.reply,
                timestamp: new Date(),
                extractedMetrics: res.data.extractedMetrics,
            }
            setMessages(prev => [...prev, assistantMsg])

            // If metrics were extracted, show them
            if (res.data.extractedMetrics) {
                const metricsMsg = {
                    role: 'assistant',
                    content: `📊 **Extracted Clinical Metrics:**\n\`\`\`json\n${JSON.stringify(res.data.extractedMetrics, null, 2)}\n\`\`\`\n\nWould you like me to run a prediction with these values?`,
                    timestamp: new Date(),
                }
                setMessages(prev => [...prev, metricsMsg])
            }
        } catch (err) {
            const errMsg = {
                role: 'assistant',
                content: '⚠️ Sorry, I encountered an error. Please try again in a moment.',
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, errMsg])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage(input)
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-hg-black flex flex-col">
            {/* Nav */}
            <nav className="bg-hg-card/80 backdrop-blur-xl border-b border-hg-border sticky top-0 z-50 flex-shrink-0">
                <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboard" className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                                <span className="text-white text-xs font-bold">H</span>
                            </div>
                            <span className="text-sm font-bold text-hg-white">HeartGuard<span className="text-hg-red">AI</span></span>
                        </Link>
                        <span className="text-hg-border">|</span>
                        <span className="text-sm text-hg-text-dim">AI Health Assistant</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="text-xs text-hg-text-dim hover:text-hg-white transition-colors">← Dashboard</Link>
                    </div>
                </div>
            </nav>

            {/* Chat area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full">
                {messages.map((msg, i) => (
                    <ChatBubble key={i} msg={msg} isUser={msg.role === 'user'} />
                ))}

                {/* Typing indicator */}
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mb-4"
                    >
                        <div className="bg-hg-card border border-hg-border rounded-2xl rounded-bl-md px-5 py-3">
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-hg-text-muted">
                                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-hg-red to-hg-red-dark flex items-center justify-center">
                                    <span className="text-white text-[10px] font-bold">H</span>
                                </div>
                                HeartGuard AI
                            </div>
                            <div className="flex gap-1.5">
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 bg-hg-red rounded-full" />
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-hg-red rounded-full" />
                                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-hg-red rounded-full" />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Suggestions (show when few messages) */}
                {messages.length <= 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-wrap gap-2 mt-4 justify-center"
                    >
                        {SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(s)}
                                className="text-xs px-4 py-2 rounded-full border border-hg-border bg-hg-card text-hg-text-dim hover:border-hg-red/40 hover:text-hg-red-light transition-all cursor-pointer"
                            >
                                {s}
                            </button>
                        ))}
                    </motion.div>
                )}

                <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-hg-border bg-hg-card/60 backdrop-blur-xl flex-shrink-0">
                <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-4 flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Describe your symptoms or ask about heart health..."
                        disabled={loading}
                        className="flex-1 bg-hg-dark border border-hg-border rounded-xl px-4 py-3 text-sm text-hg-text placeholder:text-hg-text-muted focus:outline-none focus:border-hg-red/50 transition-colors disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-gradient-to-r from-hg-red to-hg-red-dark text-white px-6 py-3 rounded-xl font-medium text-sm hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    )
}
