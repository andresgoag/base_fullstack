import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useAuthContext } from "@/context/auth/AuthContext";
import { FieldError } from "@/components/FieldError/FieldError";
import type { LoginData } from "@/auth/types";

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const { login } = useAuthContext();

  const onSubmit = (data: LoginData) => {
    login.mutate(data);
  };

  return (
    <>
      <h3 className="mb-4 text-center">Login</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            type="email"
            className="form-control"
            id="email"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email", {
              required: "Email is required.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Entered value does not match email format",
              },
            })}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", {
              required: "Password is required.",
            })}
          />
          <FieldError id="password-error" message={errors.password?.message} />
        </div>
        <div className="d-flex justify-content-center">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              "Login"
            )}
          </button>
        </div>
      </form>
      <div className="d-flex justify-content-center p-3">
        <Link to="/auth/register">Don't have an Account? Register here</Link>
      </div>
    </>
  );
};
