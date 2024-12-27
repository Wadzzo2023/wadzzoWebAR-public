import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  FC,
} from "react";
import { WalletType } from "./types";
import { getUser } from "@/app/api/routes/get-user";
import { BASE_URL, CALLBACK_URL } from "@/components/utils/Common";
import { getCsrfToken } from "./sign-in";
import { toast, ToastPosition } from "@backpackapp-io/react-native-toast";
import { Color } from "@/components/utils/all-colors";

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
  loading: boolean; // Add loading state
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
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true); // Start loading
    try {
      const user = await getUser();
      if (user?.id) {
        setUser(user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const login = async (cookie: string): Promise<void> => {
    setLoading(true); // Start loading
    try {
      await checkAuth();
      toast("Login Successfully!", {
        duration: 3000,
        styles: {
          view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
        },
        position: ToastPosition.BOTTOM,
      });
    } catch (error) {
      console.log("Failed to log in:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const logout = async (): Promise<void> => {
    setLoading(true); // Start loading
    try {
      const res = await fetch(new URL("api/auth/signout", BASE_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csrfToken: await getCsrfToken(),
          callbackUrl: CALLBACK_URL,
          json: "true",
        }),
        credentials: "include",
      });

      if (res.ok) {
        toast("Logout Successfully!", {
          duration: 3000,
          position: ToastPosition.BOTTOM,
          styles: {
            view: { backgroundColor: Color.wadzzo, borderRadius: 8 },
          },
        });
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log("Failed to log out:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, logout }}
    >
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
