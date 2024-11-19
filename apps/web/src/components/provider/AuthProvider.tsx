import { getTokenUser } from "@api/routes/get-token-user";
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
  login: () => Promise<void>;
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
      if (!user) {
        const user = await getTokenUser();
        if (user?.id) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.log("Failed to check auth:", error);
      setUser(null);
      setIsAuthenticated(false);
    }
  };
  const login = async (): Promise<void> => {
    try {
      await checkAuth();
    } catch (error) {
      console.log("Failed to log in:", error);
    }
  };
  const logout = async (): Promise<void> => {
    try {
      console.log("Logging out");
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.log("Failed to log out:", error);
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
