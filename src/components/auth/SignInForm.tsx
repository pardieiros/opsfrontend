import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import { login, getUserProfile } from "../../serviceapi/api";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 Tentativa de login iniciada...");
    console.log("👤 Username:", username);
    console.log("🔑 Password:", password ? "***" : "vazio");
    
    try {
      console.log("📡 Chamando API de login...");
      const { access, refresh } = await login(username, password);
      console.log("✅ Login bem-sucedido!");
      console.log("🎫 Access token:", access ? "Presente" : "Ausente");
      console.log("🔄 Refresh token:", refresh ? "Presente" : "Ausente");
      
      // Always store access token
      localStorage.setItem("accessToken", access);
      // Always store refresh token for automatic token renewal
      localStorage.setItem("refreshToken", refresh);
      
      console.log("📡 Buscando perfil do usuário...");
      // Fetch and store user profile
      const userProfile = await getUserProfile(access);
      console.log("👤 Perfil do usuário:", userProfile);
      localStorage.setItem("user", JSON.stringify(userProfile));
      
      console.log("🚀 Navegando para dashboard...");
      navigate("/");
    } catch (err: any) {
      console.error("❌ Erro no login:", err);
      console.error("❌ Mensagem de erro:", err.message);
      setError(err.message);
    }
  };
  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your Username
            </p>
          </div>
          <div>
            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Username <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    value={username}
                    onChange={e => setUsername((e.target as HTMLInputElement).value)}
                    placeholder="username"
                  />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword((e.target as HTMLInputElement).value)}
                      placeholder="Enter your password"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Keep me logged in
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm">
                    Sign in
                  </Button>
                </div>
              </div>
            </form>

            {/*
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Don&apos;t have an account? {""}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign Up
                </Link>
              </p>
            </div>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}
