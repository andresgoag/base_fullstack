import { useTranslation } from "react-i18next";
import { evaluatePasswordStrength } from "auth/passwordStrength";

type PasswordStrengthMeterProps = {
  password: string;
  similarTo?: string[];
};

export const PasswordStrengthMeter = ({
  password,
  similarTo = [],
}: PasswordStrengthMeterProps) => {
  const { t } = useTranslation();
  const strength = evaluatePasswordStrength(password, similarTo);
  if (strength.score === 0) return null;

  const label = t(strength.labelKey);

  return (
    <div className="mt-2">
      <div className="progress" style={{ height: "6px" }}>
        <div
          className={`progress-bar bg-${strength.variant}`}
          role="progressbar"
          aria-label={t("passwordStrength.label")}
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuetext={label}
          style={{ width: `${String(strength.score * 25)}%` }}
        />
      </div>
      <div aria-live="polite">
        <small className={`text-${strength.variant}-emphasis`}>{label}</small>
        {strength.problems.map((problem) => (
          <small key={problem.key} className="d-block text-muted">
            {t(problem.key, { count: problem.count })}
          </small>
        ))}
      </div>
    </div>
  );
};
