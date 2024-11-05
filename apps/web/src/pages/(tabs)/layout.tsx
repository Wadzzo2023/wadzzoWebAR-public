import { Header } from "@/components/Header";
import Wrapper from "@/components/Wrapper";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Wrapper>
      <Header />
      {children}
    </Wrapper>
  );
}
