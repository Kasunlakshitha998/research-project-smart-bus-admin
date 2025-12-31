import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';
import Loading from '../components/Loading';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (token) {
                try {
                    const freshUser = await authService.getMe();
                    setUser(freshUser);
                    localStorage.setItem('user', JSON.stringify(freshUser));
                } catch (error) {
                    console.error('Auth check failed:', error);
                    if (storedUser) {
                        try {
                            setUser(JSON.parse(storedUser));
                        } catch (parseError) {
                            console.error('Failed to parse stored user:', parseError);
                            logout();
                        }
                    } else {
                        logout();
                    }
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    if (loading) return <Loading fullScreen={true} />;

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
