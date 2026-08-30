type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  isPending: boolean;
  isDisabled?: boolean;
  className?: string;
};

export const SubmitButton = ({
  label,
  pendingLabel,
  isPending,
  isDisabled = false,
  className = "btn btn-primary w-100",
}: SubmitButtonProps) => (
  <button
    type="submit"
    className={className}
    disabled={isPending || isDisabled}
  >
    {isPending ? (
      <span className="d-inline-flex align-items-center gap-2">
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        {pendingLabel}
      </span>
    ) : (
      label
    )}
  </button>
);
