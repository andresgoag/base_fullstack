import { FieldError } from "components/FieldError/FieldError";

export type FormControlProps = {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
};

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: (controlProps: FormControlProps) => React.ReactNode;
};

export const FormField = ({ id, label, error, children }: FormFieldProps) => {
  const errorId = `${id}-error`;
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": error !== undefined,
        "aria-describedby": error === undefined ? undefined : errorId,
      })}
      <FieldError id={errorId} message={error} />
    </div>
  );
};
