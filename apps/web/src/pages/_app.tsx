import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "@app/provider";
import { AuthWebProvider } from "@/components/AuthProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <AuthWebProvider>
        <Component {...pageProps} />
      </AuthWebProvider>
    </Provider>
  );
}
