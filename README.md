# shadcn-virtualized-tree

A typed React tree library with a headless state hook and an optional virtualized UI. It is designed for large hierarchical datasets while keeping tree data, async loading, and application state under your control.

[Live playground](https://usamakhangt4.github.io/shadcn-virtualized-tree/)

## Features

- Headless `useTree` hook for custom renderers and design systems
- Optional fixed-row virtualized tree UI
- Thousands of nodes with configurable overscan
- Controlled or uncontrolled expansion and selection
- No selection, single selection, or multiple selection
- Optional descendant selection propagation
- Tri-state parent selection: unchecked, mixed, and checked
- Disabled nodes excluded from selection propagation
- Immutable move, reorder, and reparent operations
- Desktop drag-and-drop ordering in the styled component
- Lazy-loading indicators driven by application state
- Arrow-key navigation and keyboard activation
- ARIA tree metadata and mixed checkbox semantics
- Custom node data, labels, icons, and label rendering
- Replaceable structural icons from any React icon library
- Theme tokens, CSS variables, and class-based styling
- Configurable height, row height, indentation, inner padding, radius, and overscan

## Installation

### Install from npm

```bash
npm install shadcn-virtualized-tree
```

Import the hook/component and the default styles:

```tsx
import { useTree, VirtualizedTree } from "shadcn-virtualized-tree";
import "shadcn-virtualized-tree/styles.css";
```

The styled component includes Lucide icons as defaults. They can be replaced completely through icon slots.

### Install from GitHub

You can also install directly from GitHub if you want the latest unreleased changes:

```bash
npm install github:usamakhangt4/shadcn-virtualized-tree#main
```

The repository's `prepare` script builds the distributable files automatically during installation. Imports use the package name normally:

```tsx
import { useTree, VirtualizedTree } from "shadcn-virtualized-tree";
import "shadcn-virtualized-tree/styles.css";
```

For reproducible production installs, pin a release tag or commit instead of `main`:

```bash
npm install github:usamakhangt4/shadcn-virtualized-tree#COMMIT_SHA
```

## Quick start

```tsx
import { useState } from "react";
import {
  useTree,
  VirtualizedTree,
  type TreeNode,
} from "shadcn-virtualized-tree";
import "shadcn-virtualized-tree/styles.css";

export function FileTree() {
  const [nodes, setNodes] = useState<TreeNode[]>([
    {
      id: "src",
      label: "src",
      children: [
        { id: "components", label: "components", children: [
          { id: "tree.tsx", label: "tree.tsx" },
        ] },
        { id: "index.ts", label: "index.ts" },
      ],
    },
  ]);

  const tree = useTree({
    nodes,
    onNodesChange: setNodes,
    selectionMode: "multiple",
    selectParents: true,
    selectDescendants: true,
    defaultExpandedIds: ["src", "components"],
  });

  return (
    <VirtualizedTree
      tree={tree}
      height={360}
      showCheckboxes
      showIcons
    />
  );
}
```

## Tree data

Each node has a stable, globally unique `id`.

```ts
interface TreeNode<T = unknown> {
  id: string;
  label: React.ReactNode;
  children?: TreeNode<T>[];
  childrenCount?: number;
  disabled?: boolean;
  icon?: React.ElementType;
  data?: T;
}
```

- `children` contains loaded descendants.
- `childrenCount` marks a node expandable before its children are loaded.
- `disabled` prevents selecting or dragging that node.
- `icon` accepts a component from any React icon library.
- `data` carries application-specific typed metadata.

Duplicate IDs throw an error during indexing.

## Headless usage

`useTree` supplies tree state and algorithms without requiring the default renderer.

```tsx
const tree = useTree({ nodes, selectionMode: "single" });

return tree.flatNodes.map(({ node, depth }) => (
  <button
    key={node.id}
    disabled={node.disabled}
    style={{ paddingInlineStart: depth * 20 }}
    onClick={() => tree.toggleSelected(node.id)}
  >
    {node.label}
  </button>
));
```

The returned API includes:

- `flatNodes` — currently visible nodes with depth and ARIA position metadata
- `nodeMap` — node lookup by ID
- `parentMap` — parent lookup by node ID
- `expandedIds`, `selectedIds`, and `indeterminateIds`
- `toggleExpanded(id)` and `toggleSelected(id)`
- `setExpandedIds(ids)` and `setSelectedIds(ids)`
- `moveNode({ nodeId, targetId, position })`

## Selection behavior

```tsx
const tree = useTree({
  nodes,
  selectionMode: "multiple",
  selectDescendants: true,
  selectParents: true,
});
```

`selectionMode` supports `"none"`, `"single"`, and `"multiple"`.

With `selectDescendants`, selecting a branch selects every loaded, enabled descendant.

With `selectParents`, parent checkboxes are derived from their enabled children:

- No children selected → unchecked
- Some children selected → indeterminate
- Every enabled child selected → checked

The headless hook exposes mixed parents through `indeterminateIds`. The styled component renders a minus icon and sets `aria-checked="mixed"`.

## Controlled state

Selection and expansion can be controlled independently.

```tsx
const [selectedIds, setSelectedIds] = useState(new Set<string>());
const [expandedIds, setExpandedIds] = useState(new Set(["src"]));

const tree = useTree({
  nodes,
  selectedIds,
  onSelectedChange: setSelectedIds,
  expandedIds,
  onExpandedChange: setExpandedIds,
  selectionMode: "multiple",
});
```

Use `defaultSelectedIds` and `defaultExpandedIds` when internal state is preferred.

## Lazy loading

Network behavior remains application-owned. Set `childrenCount`, react to expansion, update `nodes`, and pass active request IDs to the renderer.

```tsx
const [loadingIds, setLoadingIds] = useState(new Set<string>());

const handleExpandedChange = async (next: Set<string>) => {
  setExpandedIds(next);
  if (!next.has("cloud") || loadingIds.has("cloud")) return;

  setLoadingIds(current => new Set(current).add("cloud"));
  try {
    const children = await loadChildren("cloud");
    setNodes(current => replaceChildren(current, "cloud", children));
  } finally {
    setLoadingIds(current => {
      const copy = new Set(current);
      copy.delete("cloud");
      return copy;
    });
  }
};

const tree = useTree({
  nodes,
  expandedIds,
  onExpandedChange: handleExpandedChange,
});

return <VirtualizedTree tree={tree} loadingIds={loadingIds} />;
```

While a node is loading, its chevron is replaced by a spinner and expansion clicks are disabled.

## Ordering and reparenting

Enable native desktop drag-and-drop in the styled tree:

```tsx
const tree = useTree({ nodes, onNodesChange: setNodes });

return <VirtualizedTree tree={tree} enableOrdering />;
```

Drop zones support `before`, `inside`, and `after`. Self-drops and drops into descendants are rejected. Moving inside a branch expands the target.

For custom renderers or sensor-based drag-and-drop libraries, call the immutable operation directly:

```tsx
tree.moveNode({
  nodeId: "report.pdf",
  targetId: "archive",
  position: "inside",
});
```

Native HTML drag-and-drop is desktop-oriented. Use a sensor-based library such as dnd-kit for touch ordering and call `moveNode` when the gesture completes.

## Custom labels and node actions

`renderLabel` can return any React content.

```tsx
<VirtualizedTree
  tree={tree}
  renderLabel={node => (
    <>
      <span>{node.label}</span>
      <small>{node.children ? "Group" : "Item"}</small>
      <button onClick={event => {
        event.stopPropagation();
        toggleDisabled(node.id);
      }}>
        {node.disabled ? "Enable" : "Disable"}
      </button>
    </>
  )}
/>
```

Stop propagation on nested actions when clicking them should not select the row.

## Custom icon libraries

Lucide icons are defaults, not a requirement. Replace any or all structural icons with components from React Icons, Material Icons, Font Awesome, or another React-compatible library.

```tsx
<VirtualizedTree
  tree={tree}
  icons={{
    chevron: MyChevron,
    folder: MyFolder,
    folderOpen: MyOpenFolder,
    file: MyFile,
    check: MyCheck,
    indeterminate: MyMinus,
    grip: MyDragHandle,
    loader: MySpinner,
  }}
/>
```

Icon components receive common `size` and `className` props. A node-level `icon` overrides the default file icon for that node.

## Colors and theming

Colors are arbitrary tokens, not limited to the playground presets.

```tsx
<VirtualizedTree
  tree={tree}
  theme={{
    accent: "#10b981",
    focusRing: "#34d399",
    selectedForeground: "#a7f3d0",
    selectedBackground: "rgb(16 185 129 / 18%)",
    hoverBackground: "rgb(16 185 129 / 10%)",
    dropBackground: "rgb(16 185 129 / 25%)",
    background: "#07130f",
    foreground: "#a7bdb4",
    border: "#164e3d",
    muted: "#5d7c70",
  }}
/>
```

Available CSS variables are:

```css
--svt-background
--svt-foreground
--svt-border
--svt-muted
--svt-hover-background
--svt-selected-background
--svt-selected-foreground
--svt-focus-ring
--svt-accent
--svt-drop-background
```

Use `className`, `style`, the variables above, or replace the included stylesheet entirely.

## VirtualizedTree props

| Prop | Default | Purpose |
| --- | --- | --- |
| `tree` | required | API returned by `useTree` |
| `height` | `400` | Viewport height in pixels |
| `rowHeight` | `32` | Fixed row height in pixels |
| `overscan` | `6` | Extra rows rendered above and below the viewport |
| `indent` | `20` | Indentation per hierarchy level |
| `viewportPadding` | `8` | Inner gutter around virtual rows |
| `rowRadius` | `"medium"` | `"none"`, `"medium"`, or `"full"` row radius |
| `showIcons` | `true` | Display folder and file icons |
| `showCheckboxes` | `false` | Display checkbox state |
| `enableOrdering` | `false` | Enable native desktop drag-and-drop |
| `loadingIds` | — | IDs whose chevrons should show loaders |
| `icons` | Lucide defaults | Partial structural icon-slot overrides |
| `theme` | dark defaults | Color-token overrides |
| `renderLabel` | node label | Custom row-label renderer |
| `onActivate` | — | Called when a row is activated |
| `className` | — | Viewport class name |
| `style` | — | Viewport inline styles |

## Keyboard and accessibility

- `Arrow Down` and `Arrow Up` move through visible nodes.
- `Arrow Right` expands a branch or moves to its first visible child.
- `Arrow Left` collapses a branch or moves to its parent.
- `Enter` and `Space` toggle selection.
- Focused virtual rows are automatically scrolled into view.
- The container uses `role="tree"` and `aria-activedescendant`.
- Rows expose level, position, set size, expansion, selection, disabled, and mixed-checkbox metadata.

## Utility exports

The package also exports pure helpers:

- `indexTree(nodes)`
- `flattenTree(nodes, expandedIds)`
- `getDescendantIds(node)`
- `isDescendant(parentMap, ancestorId, nodeId)`
- `moveTreeNode(nodes, instruction)`

These are useful for custom renderers, reducers, tests, and non-React state layers.

## Current constraints

- Virtualization requires fixed row heights.
- Selection propagation only includes children currently present in `nodes`; apply selection when lazy children arrive if required.
- Built-in drag-and-drop uses native HTML drag events and is not a touch implementation.
- Tree data is immutable and consumer-owned; async errors, persistence, and server synchronization remain application concerns.

## Development

```bash
npm install
npm test
npm run typecheck
npm run build
npm run playground
```

The playground is deployed automatically from `main` through GitHub Pages.
