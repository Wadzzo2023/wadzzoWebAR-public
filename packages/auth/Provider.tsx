import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  FC,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WalletType } from "./types";
import { getUser } from "@api/routes/get-user";

export type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  id: string;
  walletType: WalletType;
  emailVerified: boolean;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (cookie: string) => Promise<void>;
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
      }

      if (!user) {
        const userString = await AsyncStorage.getItem("user");

        if (userString) {
          const user = JSON.parse(userString) as User;

          setUser(user);
        }
      }
    } catch (error) {
      console.error("Failed to check authentication:", error);
    }
  };

  const login = async (cookie: string): Promise<void> => {
    try {
      const user = await getUser();
      console.log(user, "user");

      if (user?.id) {
        setIsAuthenticated(true);
        await AsyncStorage.setItem("auth_cookies", cookie.toString());
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }

      await checkAuth();

      // Save token
    } catch (error) {
      console.error("Failed to log in:", error);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem("auth_cookies");
      await AsyncStorage.removeItem("user");

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
