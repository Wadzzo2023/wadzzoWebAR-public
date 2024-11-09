import Head from "next/head";
import LoginScreen from "./login";

export default function Home() {
  return (
    <>
      <Head>
        <title>Wadzzo AR </title>
        <meta
          name="description"
          content="A subscription-based platform that connects bands & creators with their fans on Stellar Blockchain."
        />

        <meta
          property="og:description"
          content="Connect with bands & creators on the Stellar Blockchain."
        />
        <meta name="keywords" content={process.env.NEXT_PUBLIC_KEYWORD} />
        <meta property="og:type" content="website" />

        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-full w-full">
        <MainSection />
      </main>
    </>
  );
}

function MainSection() {
  return <LoginScreen />;
}
