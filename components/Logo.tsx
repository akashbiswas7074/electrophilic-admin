import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate lazy loading with a small delay
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`bg-transparent ${className || ""}`}>
      <Link href="/" className="flex gap-[10px]">
        {/* <Image src={"/images/logo.png"} alt="logo" height={30} width={35} /> */}
        {isLoaded ? (
          <h2 className="text-center">
            <span className="font-extrabold text-[25px] uppercase text-white tracking-[1px] ">
           Ecom-admin
            </span>
          </h2>
        ) : (
          <div className="h-[30px] w-[200px] bg-gray-300 animate-pulse rounded"></div>
        )}
      </Link>
    </div>
  );
};

export default Logo;
