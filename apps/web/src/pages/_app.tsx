import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Provider } from "@app/provider";
import ModalProvider from "@/components/provider/ModalProvier";

import { Toaster } from "react-hot-toast";
import { AuthWebProvider } from "@/components/provider/AuthProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full  bg-gray-100">
      <div className="flex w-full  md:w-[30%] h-full">
        <Provider>
          <AuthWebProvider>
            <Toaster />
            <ModalProvider />
            <Component {...pageProps} />
          </AuthWebProvider>
        </Provider>
      </div>
    </div>
  );
}
