import SideImage from "@/assets/sg.jpg";
import Logo from "@/assets/logo.png";
import Image from "next/image";

import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-8 items-center justify-center">
              <Image
                src={Logo}
                alt="Logo"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            Alveria Capital
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src={SideImage.src}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-transparent dark:from-black/70 dark:via-black/50" />
        {/* Title */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="max-w-lg text-center">
            <h2 className="text-white text-2xl md:text-3xl lg:text-4xl font-bold leading-tight mb-4">
              Markets are inefficient, but not always predictable
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              Discover patterns in chaos with advanced backtesting
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
