import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../src/contexts/AuthContext.jsx";
import ProtectedRoute from "../../src/components/ProtectedRoute.jsx";
import Login from "../../src/pages/Login.jsx";
import Register from "../../src/pages/Register.jsx";
import { setToken, getToken } from "../../src/services/session.js";
import { ApiError } from "../../src/services/api.js";
import * as finance from "../../src/services/finance.js";

vi.mock("../../src/services/finance.js");

const user = { id: 1, name: "Ada", email: "ada@example.com" };

function app(initial = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<h1>Secret dashboard</h1>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => vi.resetAllMocks());

describe("ProtectedRoute", () => {
  it("redirects an anonymous visitor to the login page", () => {
    app();
    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(screen.queryByText("Secret dashboard")).not.toBeInTheDocument();
  });

  it("shows a loading state, then the page, when a stored token is valid", async () => {
    setToken("good");
    finance.getCurrentUser.mockResolvedValue(user);
    app();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(await screen.findByText("Secret dashboard")).toBeInTheDocument();
  });

  it("sends the visitor to login and drops the token when it is rejected", async () => {
    setToken("expired");
    finance.getCurrentUser.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "expired"));
    app();
    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});

describe("Login", () => {
  it("signs in and lands on the requested page", async () => {
    finance.loginUser.mockResolvedValue({ user, token: "t1" });
    app();
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("Secret dashboard")).toBeInTheDocument();
    expect(finance.loginUser).toHaveBeenCalledWith({ email: "ada@example.com", password: "password123" });
    expect(getToken()).toBe("t1");
  });

  it("shows the server's message for invalid credentials", async () => {
    finance.loginUser.mockRejectedValue(new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password"));
    app("/login");
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(getToken()).toBeNull();
  });

  it("shows a network failure message", async () => {
    finance.loginUser.mockRejectedValue(new ApiError(0, "NETWORK_ERROR", "Cannot reach the server."));
    app("/login");
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server.");
  });

  it("validates empty fields without calling the API", async () => {
    app("/login");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter your email and password.");
    expect(finance.loginUser).not.toHaveBeenCalled();
  });

  it("disables the button while signing in", async () => {
    let finish;
    finance.loginUser.mockReturnValue(new Promise((r) => (finish = r)));
    app("/login");
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    finish({ user, token: "t" });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Signing in…" })).not.toBeInTheDocument());
  });
});

describe("Register", () => {
  it("creates an account and signs in", async () => {
    finance.registerUser.mockResolvedValue({ user, token: "t2" });
    app("/register");
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(await screen.findByText("Secret dashboard")).toBeInTheDocument();
    expect(finance.registerUser).toHaveBeenCalledWith({ name: "Ada", email: "ada@example.com", password: "password123" });
  });

  it("shows server validation errors", async () => {
    finance.registerUser.mockRejectedValue(new ApiError(409, "CONFLICT", "An account with this email already exists"));
    app("/register");
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
  });
});
