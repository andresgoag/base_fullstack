import axe from "axe-core";

export type AccessibilityViolation = {
  id: string;
  impact: string;
  nodes: number;
};

export const findAccessibilityViolations = async (
  container: HTMLElement,
): Promise<AccessibilityViolation[]> => {
  const results = await axe.run(container, {
    resultTypes: ["violations"],
  });
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact ?? "unknown",
    nodes: violation.nodes.length,
  }));
};
