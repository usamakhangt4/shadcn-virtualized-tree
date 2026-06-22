import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTree } from "../src/use-tree";

describe("useTree selection propagation", () => {
  it("selects every ancestor when selectParents is enabled", () => {
    const nodes = [{
      id: "root",
      label: "Root",
      children: [{
        id: "parent",
        label: "Parent",
        children: [{ id: "child", label: "Child" }],
      }],
    }];
    const { result } = renderHook(() => useTree({ nodes, selectionMode: "multiple", selectParents: true }));

    act(() => result.current.toggleSelected("child"));

    expect([...result.current.selectedIds]).toEqual(["child", "parent", "root"]);
  });

  it("marks a parent mixed until all enabled children are selected", () => {
    const nodes = [{ id: "parent", label: "Parent", children: [
      { id: "first", label: "First" },
      { id: "second", label: "Second" },
    ] }];
    const { result } = renderHook(() => useTree({ nodes, selectionMode: "multiple", selectParents: true }));

    act(() => result.current.toggleSelected("first"));
    expect(result.current.selectedIds.has("parent")).toBe(false);
    expect(result.current.indeterminateIds.has("parent")).toBe(true);

    act(() => result.current.toggleSelected("second"));
    expect(result.current.selectedIds.has("parent")).toBe(true);
    expect(result.current.indeterminateIds.has("parent")).toBe(false);
  });
});
