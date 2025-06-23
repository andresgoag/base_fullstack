import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { useAuthContext } from "context/auth/AuthContext";

type RegisterFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export const RegisterForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const { register: registerUser, isPendingRegister } = useAuthContext();

  const onSubmit = (data: RegisterFormValues) => {
    registerUser({ ...data, username: data.email, re_password: data.password });
  };

  return (
    <>
      <h3 className="mb-4 text-center">Register</h3>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="mb-3">
          <label htmlFor="first_name" className="form-label">
            First Name
          </label>
          <input
            type="text"
            className="form-control"
            id="first_name"
            {...register("first_name", {
              required: "Name is required.",
            })}
          />
          <p className="text-danger">{errors.first_name?.message}</p>
        </div>

        <div className="mb-3">
          <label htmlFor="last_name" className="form-label">
            Last Name
          </label>
          <input
            type="text"
            className="form-control"
            id="last_name"
            {...register("last_name", {
              required: "Last name is required.",
            })}
          />
          <p className="text-danger">{errors.last_name?.message}</p>
        </div>

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
            disabled={isPendingRegister}
          >
            {isPendingRegister ? (
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            ) : (
              "Register"
            )}
          </button>
        </div>
      </form>
      <div className="d-flex justify-content-center p-3">
        <Link to="/auth/login">Already have an Account? Login here</Link>
      </div>
    </>
  );
};
