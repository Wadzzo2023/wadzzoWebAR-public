import { getUser } from "@api/routes/get-user";
import { WalletType } from "@auth/types";
import {
  createContext,
  FC,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

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

export const AuthWebProvider: FC<AuthProviderProps> = ({
  children,
}: AuthProviderProps): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getUser();

      if (user) {
        setIsAuthenticated(true);
        setUser(user);
      }
    } catch (error) {
      console.error("Failed to check authentication:", error);
    }
  };

  const login = async (): Promise<void> => {
    try {
      await checkAuth();

      // Save token
    } catch (error) {
      console.error("Failed to log in:", error);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setUser(null);
      setIsAuthenticated(false);

      // Remove cookies
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
