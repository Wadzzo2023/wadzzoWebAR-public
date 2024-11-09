import React, { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode;
}

const Wrapper: React.FC<WrapperProps> = ({ children }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100">
      <div className="flex w-full  md:w-[30%] h-full">{children}</div>
    </div>
  );
};

export default Wrapper;
