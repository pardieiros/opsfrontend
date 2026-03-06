import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router-dom";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import ImageWall from "../../assets/imagewall.png";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 lg:grid">
          <img
            src={ImageWall}
            alt="Wall"
            className="object-cover w-full h-full"
          />
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
