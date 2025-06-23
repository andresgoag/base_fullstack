import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useAuthContext } from "context/auth/AuthContext";

type LoginFormValues = {
  email: string;
  password: string;
};

export const LoginForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const { login, isPendingLogin } = useAuthContext();

  const onSubmit = (data: LoginFormValues) => {
    login({ ...data, username: data.email });
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
            {...register("email", {
              required: "Email is required.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Entered value does not match email format",
              },
            })}
          />
          <p className="text-danger">{errors.email?.message}</p>
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            type="password"
            className="form-control"
            id="password"
            {...register("password", {
              required: "Password is required.",
            })}
          />
          <p className="text-danger">{errors.password?.message}</p>
        </div>
        <div className="d-flex justify-content-center">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isPendingLogin}
          >
            {isPendingLogin ? (
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
