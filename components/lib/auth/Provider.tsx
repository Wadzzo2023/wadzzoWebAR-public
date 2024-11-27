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
import Toast from "react-native-root-toast";
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
      if (!user) {
        const user = await getUser();
        if (user?.id) {
          setUser(user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const login = async (cookie: string): Promise<void> => {
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
    }
  };

  const logout = async (): Promise<void> => {
    try {

      const res = await fetch(new URL('api/auth/signout', BASE_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          csrfToken: await getCsrfToken(),
          callbackUrl: CALLBACK_URL,
          json: 'true'

        }),
        credentials: 'include'
      })
      console.log('res', res)
      if (res.ok) {
        toast("Logout Sucessfully!", {

          duration: 3000,
          position: ToastPosition.BOTTOM,
          styles: {
            view: { backgroundColor: Color.wadzzo, borderRadius: 8 }
          },
        });
        setUser(null);
        setIsAuthenticated(false);
      }
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
