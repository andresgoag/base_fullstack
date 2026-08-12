import { useForm, Controller } from "react-hook-form";
import { Link } from "react-router";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import "react-phone-number-input/style.css";
import { useAuthContext } from "@/context/auth/AuthContext";
import { FieldError } from "@/components/FieldError/FieldError";
import type { RegisterData } from "@/auth/types";

export const RegisterForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterData>();

  const { register: registerUser } = useAuthContext();

  const onSubmit = (data: RegisterData) => {
    registerUser.mutate(data);
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
            aria-invalid={!!errors.first_name}
            aria-describedby={
              errors.first_name ? "first_name-error" : undefined
            }
            {...register("first_name", { required: "Name is required." })}
          />
          <FieldError
            id="first_name-error"
            message={errors.first_name?.message}
          />
        </div>

        <div className="mb-3">
          <label htmlFor="last_name" className="form-label">
            Last Name
          </label>
          <input
            type="text"
            className="form-control"
            id="last_name"
            aria-invalid={!!errors.last_name}
            aria-describedby={errors.last_name ? "last_name-error" : undefined}
            {...register("last_name", { required: "Last name is required." })}
          />
          <FieldError
            id="last_name-error"
            message={errors.last_name?.message}
          />
        </div>

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
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <Controller
            name="phone"
            control={control}
            rules={{
              required: "Phone number is required.",
              validate: (value) =>
                isValidPhoneNumber(value || "") ||
                "Enter a valid international phone number",
            }}
            render={({ field: { onChange, value } }) => (
              <PhoneInput
                international
                defaultCountry="US"
                value={value}
                onChange={onChange}
                flags={flags}
                className="form-control d-flex align-items-center"
                id="phone"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
            )}
          />
          <FieldError id="phone-error" message={errors.phone?.message} />
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
            {...register("password", { required: "Password is required." })}
          />
          <FieldError id="password-error" message={errors.password?.message} />
        </div>

        <div className="mb-3">
          <label htmlFor="re_password" className="form-label">
            Confirm Password
          </label>
          <input
            type="password"
            className="form-control"
            id="re_password"
            aria-invalid={!!errors.re_password}
            aria-describedby={
              errors.re_password ? "re_password-error" : undefined
            }
            {...register("re_password", {
              required: "Please confirm your password.",
              validate: (value, formValues) =>
                value === formValues.password || "Passwords do not match.",
            })}
          />
          <FieldError
            id="re_password-error"
            message={errors.re_password?.message}
          />
        </div>

        <div className="d-flex justify-content-center">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={registerUser.isPending}
          >
            {registerUser.isPending ? (
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
