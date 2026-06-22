import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlignJustify, Cloud, Database, FileText, Image, List, Menu, MousePointer2 } from "lucide-react";
import { useTree, VirtualizedTree, type TreeNode } from "shadcn-virtualized-tree";
import "../../src/styles.css";
import "./playground.css";

function createNodes(): TreeNode[] {
  const virtualFolders = Array.from({ length: 1000 }, (_, index) => ({
    id: `folder-${index + 1}`,
    label: `Virtual Folder ${index + 1}`,
    children: ["A", "B", "C"].map(letter => ({ id: `file-${index + 1}-${letter}`, label: `Data Item ${letter}`, icon: Database })),
  }));
  return [
    { id: "paper", label: "Paper", children: [
      { id: "header", label: "Header container", children: [{ id: "image", label: "Image", icon: Image }] },
      { id: "content", label: "Content", children: [{ id: "text", label: "Text Content", icon: FileText }] },
      { id: "actions", label: "Action Bar", children: [{ id: "button", label: "Icon Button", icon: MousePointer2 }] },
    ] },
    { id: "large", label: "Large Dataset (1000 folders)", children: virtualFolders },
    { id: "cloud", label: "Cloud Storage (lazy demo)", icon: Cloud, childrenCount: 3 },
  ];
}

function updateChildren(nodes: TreeNode[], id: string, children: TreeNode[]): TreeNode[] {
  return nodes.map(node => node.id === id ? { ...node, children } : node.children ? { ...node, children: updateChildren(node.children, id, children) } : node);
}

function toggleNodeDisabled(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.map(node => node.id === id
    ? { ...node, disabled: !node.disabled }
    : node.children ? { ...node, children: toggleNodeDisabled(node.children, id) } : node);
}

function Playground() {
  const initial = useMemo(createNodes, []);
  const [nodes, setNodes] = useState(initial);
  const [expanded, setExpanded] = useState(new Set(["paper", "header", "content", "actions"]));
  const [loading, setLoading] = useState(new Set<string>());
  const [multiple, setMultiple] = useState(true);
  const [checkboxes, setCheckboxes] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [density, setDensity] = useState<"compact" | "normal" | "relaxed">("normal");
  const [showIcons, setShowIcons] = useState(true);
  const [showSecondary, setShowSecondary] = useState(false);
  const [showDisable, setShowDisable] = useState(false);
  const [selectParents, setSelectParents] = useState(true);
  const [selectDescendants, setSelectDescendants] = useState(true);
  const [theme, setTheme] = useState<"blue" | "purple" | "orange">("blue");
  const [radius, setRadius] = useState<"none" | "medium" | "full">("medium");
  const [indent, setIndent] = useState(20);
  const [overscan, setOverscan] = useState(6);

  const onExpandedChange = (next: Set<string>) => {
    setExpanded(next);
    if (next.has("cloud") && !loading.has("cloud") && !nodes.find(node => node.id === "cloud")?.children) {
      setLoading(current => new Set(current).add("cloud"));
      window.setTimeout(() => {
        setNodes(current => updateChildren(current, "cloud", [
          { id: "cloud-folder", label: "Projects", icon: Cloud, childrenCount: 2 },
          { id: "cloud-file-1", label: "Report.pdf", icon: FileText },
          { id: "cloud-file-2", label: "Design.png", icon: Image },
        ]));
        setLoading(current => { const copy = new Set(current); copy.delete("cloud"); return copy; });
      }, 900);
    }
  };

  const tree = useTree({
    nodes,
    onNodesChange: setNodes,
    expandedIds: expanded,
    onExpandedChange,
    selectionMode: multiple ? "multiple" : "single",
    selectDescendants: multiple && selectDescendants,
    selectParents: multiple && selectParents,
  });
  const rowHeight = { compact: 28, normal: 34, relaxed: 42 }[density];

  return <main className={`app-shell theme-${theme}`}>
    <section className="stage">
      <div className="tree-card">
        <header><div><strong>Project structure</strong><span>{tree.flatNodes.length.toLocaleString()} visible nodes</span></div></header>
        <VirtualizedTree
          tree={tree}
          height={560}
          rowHeight={rowHeight}
          overscan={overscan}
          indent={indent}
          viewportPadding={8}
          rowRadius={radius}
          showIcons={showIcons}
          showCheckboxes={checkboxes}
          enableOrdering={ordering}
          loadingIds={loading}
          renderLabel={node => <>
            <span>{node.label}</span>
            {showSecondary && <small>{node.children?.length || node.childrenCount ? "Group" : "Item"}</small>}
            {showDisable && <button className="node-action" aria-label={node.disabled ? `Enable ${String(node.label)}` : `Disable ${String(node.label)}`} onClick={event => { event.stopPropagation(); setNodes(current => toggleNodeDisabled(current, node.id)); }}>{node.disabled ? "Enable" : "Disable"}</button>}
          </>}
        />
      </div>
    </section>
    <aside>
      <div><p className="eyebrow">Playground</p><h1>Virtualized Tree</h1><p>Built entirely against the package’s public API.</p></div>
      <SettingsGroup title="Behavior" description="Interaction features exposed by the tree API.">
        <Control label="Enable ordering" checked={ordering} setChecked={setOrdering} />
        <Control label="Checkbox selection" checked={checkboxes} setChecked={setCheckboxes} />
        <Control label="Multiple selection" checked={multiple} setChecked={setMultiple} />
        <Control label="Select parents" checked={selectParents} setChecked={setSelectParents} disabled={!multiple} />
        <Control label="Select descendants" checked={selectDescendants} setChecked={setSelectDescendants} disabled={!multiple} />
        <Control label="Node disable actions" checked={showDisable} setChecked={setShowDisable} />
      </SettingsGroup>
      <SettingsGroup title="Appearance" description="Defaults are optional and completely replaceable.">
        <Control label="Folder and file icons" checked={showIcons} setChecked={setShowIcons} />
        <Control label="Secondary labels" checked={showSecondary} setChecked={setShowSecondary} />
        <ColorChoice value={theme} setValue={setTheme} />
        <RadiusChoice value={radius} setValue={setRadius} />
        <DensityChoice value={density} setValue={setDensity} />
      </SettingsGroup>
      <SettingsGroup title="Virtualization" description="Tune rendering for the size and shape of your data.">
        <Range label="Indent" value={indent} min={12} max={32} suffix="px" setValue={setIndent} />
        <Range label="Overscan" value={overscan} min={1} max={16} suffix=" rows" setValue={setOverscan} />
      </SettingsGroup>
      <div className="stats"><span>Selected</span><strong>{tree.selectedIds.size}</strong><span>Total indexed</span><strong>{tree.nodeMap.size.toLocaleString()}</strong></div>
    </aside>
  </main>;
}

function SettingsGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="settings-group"><header><strong>{title}</strong><span>{description}</span></header>{children}</section>;
}

function Control({ label, checked, setChecked, disabled = false }: { label: string; checked: boolean; setChecked: (value: boolean) => void; disabled?: boolean }) {
  return <label className={`control${disabled ? " disabled" : ""}`}><span>{label}</span><button disabled={disabled} role="switch" aria-checked={checked} className={checked ? "switch on" : "switch"} onClick={() => setChecked(!checked)}><i /></button></label>;
}

function ColorChoice({ value, setValue }: { value: "blue" | "purple" | "orange"; setValue: (value: "blue" | "purple" | "orange") => void }) {
  return <VisualSetting label="Color"><div className="visual-options color-options">{(["blue", "purple", "orange"] as const).map(option => <button aria-label={`${option} color`} aria-pressed={value === option} className={value === option ? "selected" : ""} onClick={() => setValue(option)} key={option}><i className={`swatch swatch-${option}`} /></button>)}</div></VisualSetting>;
}

function RadiusChoice({ value, setValue }: { value: "none" | "medium" | "full"; setValue: (value: "none" | "medium" | "full") => void }) {
  return <VisualSetting label="Border radius"><div className="visual-options shape-options">{(["none", "medium", "full"] as const).map(option => <button aria-label={`${option} row radius`} aria-pressed={value === option} className={value === option ? "selected" : ""} onClick={() => setValue(option)} key={option}><i className={`corner corner-${option}`} /></button>)}</div></VisualSetting>;
}

function DensityChoice({ value, setValue }: { value: "compact" | "normal" | "relaxed"; setValue: (value: "compact" | "normal" | "relaxed") => void }) {
  const icons = { compact: AlignJustify, normal: Menu, relaxed: List };
  return <VisualSetting label="Density"><div className="visual-options density-options">{(["compact", "normal", "relaxed"] as const).map(option => { const Icon = icons[option]; return <button aria-label={`${option} density`} aria-pressed={value === option} className={value === option ? "selected" : ""} onClick={() => setValue(option)} key={option}><Icon size={19} /></button>; })}</div></VisualSetting>;
}

function VisualSetting({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="visual-setting"><span>{label}</span>{children}</div>;
}

function Range({ label, value, min, max, suffix, setValue }: { label: string; value: number; min: number; max: number; suffix: string; setValue: (value: number) => void }) {
  return <label className="range"><span>{label}<output>{value}{suffix}</output></span><input type="range" min={min} max={max} value={value} onChange={event => setValue(Number(event.target.value))} /></label>;
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><Playground /></React.StrictMode>);
