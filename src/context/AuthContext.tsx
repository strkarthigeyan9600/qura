import React, { createContext, useContext, useState } from 'react';
import { UserRole } from '../types';

interface AuthContextType {
    role: UserRole;
    userToken: string | null;
    userName: string;
    loginAsAdmin: (token: string, name: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [role, setRole] = useState<UserRole>('visitor');
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('Guest Kiosk Visitor');

    const loginAsAdmin = (token: string, name: string) => {
        setUserToken(token);
        setRole('admin');
        setUserName(name);
    };

    const logout = () => {
        setUserToken(null);
        setRole('visitor');
        setUserName('Guest Kiosk Visitor');
    };

    return (
        <AuthContext.Provider value={{ role, userToken, userName, loginAsAdmin, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
