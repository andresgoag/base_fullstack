type FieldErrorProps = {
  id: string;
  message?: string;
};

export const FieldError = ({ id, message }: FieldErrorProps) => {
  if (!message) return null;
  return (
    <p id={id} className="text-danger mb-0 mt-1" role="alert">
      {message}
    </p>
  );
};
