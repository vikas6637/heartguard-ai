import { createContext, useState, useContext, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('hg_token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            api.get('/auth/me')
                .then(res => setUser(res.data.user))
                .catch(() => { localStorage.removeItem('hg_token'); setToken(null) })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [token])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        localStorage.setItem('hg_token', res.data.token)
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
        setToken(res.data.token)
        setUser(res.data.user)
        return res.data
    }

    const register = async (name, email, password, role = 'patient') => {
        const res = await api.post('/auth/register', { name, email, password, role })
        localStorage.setItem('hg_token', res.data.token)
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
        setToken(res.data.token)
        setUser(res.data.user)
        return res.data
    }

    const logout = () => {
        localStorage.removeItem('hg_token')
        delete api.defaults.headers.common['Authorization']
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
