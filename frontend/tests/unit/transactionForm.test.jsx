import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransactionForm from "../../src/components/TransactionForm.jsx";

const categories = [
  { id: 1, name: "Food & Dining", type: "expense" },
  { id: 2, name: "Transport", type: "expense" },
  { id: 3, name: "Salary", type: "income" },
];

describe("TransactionForm", () => {
  it("submits a valid expense with numeric amount and category id", async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const onSaved = vi.fn();
    render(<TransactionForm categories={categories} onSubmit={onSubmit} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText("Amount"), "12.50");
    await userEvent.type(screen.getByLabelText("Description"), "lunch");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "expense", amount: 12.5, categoryId: 1, description: "lunch" }));
    expect(screen.getByLabelText("Amount")).toHaveValue(null); // reset after a successful create
  });

  it("only offers categories of the selected type", async () => {
    render(<TransactionForm categories={categories} onSubmit={vi.fn()} />);
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Expense", "Income", "Food & Dining", "Transport"]);
    await userEvent.selectOptions(screen.getByLabelText("Type"), "income");
    expect(screen.getByLabelText("Category")).toHaveValue("3");
    expect(screen.queryByRole("option", { name: "Transport" })).not.toBeInTheDocument();
  });

  it.each(["", "0", "-5"])("rejects the amount %j without calling the API", async (amount) => {
    const onSubmit = vi.fn();
    render(<TransactionForm categories={categories} onSubmit={onSubmit} />);
    if (amount) await userEvent.type(screen.getByLabelText("Amount"), amount);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Enter an amount greater than 0.");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows the API error and keeps the entered values", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Category does not exist"));
    render(<TransactionForm categories={categories} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Amount"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Category does not exist");
    expect(screen.getByLabelText("Amount")).toHaveValue(5);
  });

  it("pre-fills when editing and does not clear on save", async () => {
    const onSubmit = vi.fn().mockResolvedValue({});
    const initial = { type: "income", amount: 1000, categoryId: 3, date: "2026-05-01", description: "pay" };
    render(<TransactionForm categories={categories} initial={initial} submitLabel="Update" onSubmit={onSubmit} />);
    expect(screen.getByLabelText("Amount")).toHaveValue(1000);
    expect(screen.getByLabelText("Category")).toHaveValue("3");
    await userEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ type: "income", amount: 1000, categoryId: 3, date: "2026-05-01", description: "pay" }));
    expect(screen.getByLabelText("Amount")).toHaveValue(1000);
  });
});
