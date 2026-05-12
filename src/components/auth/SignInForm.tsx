import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    setError("");
    try {
      const { access, refresh } = await login(username, password);
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      const userProfile = await getUserProfile(access);
      localStorage.setItem("user", JSON.stringify(userProfile));
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Sign in failed");
    }
  };

  return (
    <div className="w-full max-w-md bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl border border-gray-200/80 dark:border-gray-800 rounded-3xl p-8 sm:p-9 space-y-7 ring-1 ring-black/5 dark:ring-white/10">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/images/logo/logo.svg"
          alt="Plásticos Dão"
          className="block h-16 w-auto max-w-fit shrink-0 object-contain sm:h-20 dark:hidden drop-shadow-sm"
        />
        <img
          src="/images/logo/logo-dark.svg"
          alt="Plásticos Dão"
          className="block h-16 w-auto max-w-fit shrink-0 object-contain hidden dark:block sm:h-20 drop-shadow-sm"
        />
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Sign in
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Worker portal — enter your credentials
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center rounded-lg bg-red-50 dark:bg-red-950/40 px-3 py-2">
          {error}
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label>
            Username <span className="text-error-500">*</span>
          </Label>
          <Input
            value={username}
            onChange={(e) => setUsername((e.target as HTMLInputElement).value)}
            placeholder="username"
          />
        </div>
        <div className="space-y-2">
          <Label>
            Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword((e.target as HTMLInputElement).value)}
              placeholder="Enter your password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 right-3 top-1/2 rounded-lg p-1 text-gray-500 hover:text-brand-500 dark:text-gray-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeIcon className="fill-current size-5" />
              ) : (
                <EyeCloseIcon className="fill-current size-5" />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
          <div className="flex items-center gap-3">
            <Checkbox checked={isChecked} onChange={setIsChecked} />
            <span className="font-normal text-gray-700 dark:text-gray-400">Keep me logged in</span>
          </div>
          <Link
            to="/reset-password"
            className="text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:underline text-left sm:text-right"
          >
            Forgot password?
          </Link>
        </div>
        <Button
          className="w-full !h-12 !text-base font-semibold shadow-lg shadow-brand-500/20"
          size="sm"
        >
          Sign in
        </Button>
      </form>

      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 text-center">
        <div className="font-medium text-gray-800 dark:text-gray-200">Need help?</div>
        <div>Contact your supervisor or IT support.</div>
      </div>
    </div>
  );
}
