import React from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`bg-transparent ${className || ""}`}>
      <Link href="/" className="flex gap-[10px]">
        {/* <Image src={"/images/logo.png"} alt="logo" height={30} width={35} /> */}
        <h2 className="text-center">
          <span className="font-extrabold text-[25px] uppercase text-white tracking-[1px] ">
          PAUL CO e-STORE 
          </span>
        </h2>
      </Link>
    </div>
  );
};

export default Logo;
