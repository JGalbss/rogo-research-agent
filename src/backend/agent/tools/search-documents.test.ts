import { describe, expect, it } from "vitest";
import { excerpt } from "./search-documents.ts";

const document = {
  id: "DOC-TEST-001",
  company: "Acme Corp",
  form: "Earnings Call",
  title: "Test call",
  date: "2026-01-01",
  body: `${"a".repeat(500)} backlog grew ${"b".repeat(500)}`,
};

describe("excerpt", () => {
  it("clips around the first matching term and marks both cut edges", () => {
    const text = excerpt(document, ["backlog"]);
    expect(text.startsWith("…")).toBe(true);
    expect(text.endsWith("…")).toBe(true);
    expect(text).toContain("backlog grew");
    expect(text.length).toBeLessThan(document.body.length);
  });

  it("returns the opening of the document when no term matches the body", () => {
    const text = excerpt(document, ["dividend"]);
    expect(text.startsWith("aaaa")).toBe(true);
    expect(text.endsWith("…")).toBe(true);
  });
});
