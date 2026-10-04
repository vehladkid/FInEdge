import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { clearToken } from "../src/services/session.js";

afterEach(() => {
  cleanup();
  clearToken();
});
