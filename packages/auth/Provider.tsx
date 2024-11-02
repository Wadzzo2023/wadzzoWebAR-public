import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  FC,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  id: string;
  email: string;
  // Add other user properties as needed
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User, cookie: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({
  children,
}: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedCookies = await AsyncStorage.getItem("auth_cookies");

      if (storedCookies) {
        setIsAuthenticated(true);
        // Optionally, you could fetch and set user details here
      }
    } catch (error) {
      console.error("Failed to check authentication:", error);
    }
  };

  const login = async (userData: User, cookie: string): Promise<void> => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      console.log("vong cong...1", cookie);
      await AsyncStorage.setItem("auth_cookies", cookie); // Save token
      const a = await AsyncStorage.getItem("auth_cookies");
      console.log("vong cong...2", a);
    } catch (error) {
      console.error("Failed to log in:", error);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("auth_cookies");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
