import { Header } from "@/components/Header";
import Wrapper from "@/components/Wrapper";
import React from "react";
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
