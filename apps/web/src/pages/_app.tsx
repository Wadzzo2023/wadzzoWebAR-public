import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "@app/provider";
import ModalProvider from "@/components/provider/ModalProvier";

import { Toaster } from "react-hot-toast";
import { AuthWebProvider } from "@/components/provider/AuthProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider>
      <AuthWebProvider>
        <Toaster />

        <ModalProvider />
        <Component {...pageProps} />
      </AuthWebProvider>
    </Provider>
  );
}
