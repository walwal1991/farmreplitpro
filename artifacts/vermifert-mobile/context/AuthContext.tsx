import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("auth_user")
      .then((val) => {
        if (val) {
          try {
            setUser(JSON.parse(val) as AuthUser);
          } catch {}
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const login = async (authUser: AuthUser) => {
    setUser(authUser);
    await AsyncStorage.setItem("auth_user", JSON.stringify(authUser));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, token: user?.token ?? null, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
