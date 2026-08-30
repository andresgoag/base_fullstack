type FieldErrorProps = {
  id?: string;
  message?: string;
};

export const FieldError = ({ id, message }: FieldErrorProps) =>
  message ? (
    <p id={id} role="alert" className="text-danger small mb-0 mt-1">
      {message}
    </p>
  ) : null;
