import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuthContext } from "./AuthContext";
import { useToastContext } from "@/context/toast/ToastContext";

describe("context guards", () => {
  it("throws when useAuthContext is used outside its provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderHook(() => useAuthContext())).toThrow(
      /must be used within an AuthContextProvider/,
    );

    consoleError.mockRestore();
  });

  it("throws when useToastContext is used outside its provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderHook(() => useToastContext())).toThrow(
      /must be used within a ToastContextProvider/,
    );

    consoleError.mockRestore();
  });
});
