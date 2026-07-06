import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import TextField from "../components/ui/TextField";
import Button from "../components/ui/Button";

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/login", formData);
      const { user, accessToken, refreshToken } = res.data.data;
      login(user, accessToken, refreshToken);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Agency & Agent Access"
      title="Sign in"
      subtitle="Enter your credentials to reach your dashboard."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <TextField
          label="Email"
          type="email"
          placeholder="you@agency.com"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />
        <TextField
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password", { required: "Password is required" })}
        />

        {serverError && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {serverError}
          </p>
        )}

        <Button type="submit" loading={loading}>Sign in</Button>
      </form>

      {/* <p className="text-sm text-ink-600 mt-6">
        New agency?{" "}
        <Link to="/register" className="text-navy-900 font-semibold hover:text-gold-600">
          Create an account
        </Link>
      </p> */}
    </AuthLayout>
  );
};

export default Login;