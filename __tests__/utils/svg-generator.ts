import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { expect } from "vitest";
import { HierarchyNode } from "../../src";

type NodeType = "circle" | "square" | "rect";
type ColorScheme = "depth" | "branch" | "single";

const colorPalettes = {
  depth: [
    "#667eea",
    "#764ba2",
    "#f093fb",
    "#4facfe",
    "#43e97b",
    "#fa709a",
    "#fee140",
    "#30cfd0",
    "#a8edea",
    "#fed6e3",
    "#c471f5",
    "#fa71cd",
  ],
  branch: [
    "#667eea",
    "#f093fb",
    "#43e97b",
    "#fee140",
    "#4facfe",
    "#fa709a",
    "#30cfd0",
    "#764ba2",
    "#a8edea",
    "#fed6e3",
    "#c471f5",
    "#fa71cd",
  ],
  single: ["#667eea"],
};

/**
 * Helper to assign parent references (used for branch coloring)
 */
function assignParent(node: HierarchyNode, parent: HierarchyNode | null = null): void {
  (node as any).parent = parent || undefined;
  if (node.children) node.children.forEach((c) => assignParent(c, node));
}

/**
 * Get node color based on color scheme
 */
function getNodeColor(node: HierarchyNode, colorScheme: ColorScheme): string {
  const palette = colorPalettes[colorScheme] || colorPalettes.single;
  switch (colorScheme) {
    case "depth":
      return palette[node.depth % palette.length];
    case "branch": {
      let idx = 0;
      if ((node as any).parent && (node as any).parent.children) {
        idx = (node as any).parent.children.indexOf(node);
      }
      return palette[idx % palette.length];
    }
    case "single":
    default:
      return palette[0];
  }
}

/**
 * Generate styled SVG with support for node types and color schemes
 */
export function generateStyledSVG(
  root: HierarchyNode,
  options: {
    width?: number;
    height?: number;
    nodeType?: NodeType;
    colorScheme?: ColorScheme;
    nodeSize?: number;
    showLabels?: boolean;
  } = {}
): string {
  const {
    width = 900,
    height = 700,
    nodeType = "circle",
    colorScheme = "single",
    nodeSize = 10,
    showLabels = true,
  } = options;

  assignParent(root);
  const nodes = collectNodes(root);

  // Calculate bounds
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  nodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x);
    minY = Math.min(minY, n.y);
    maxY = Math.max(maxY, n.y);
  });

  const padding = 50;
  const dataW = Math.max(1, maxX - minX);
  const dataH = Math.max(1, maxY - minY);
  const scale = Math.min((width - 2 * padding) / dataW, (height - 2 * padding) / dataH);

  const tx = (x: number) => (x - minX) * scale + padding;
  const ty = (y: number) => (y - minY) * scale + padding;

  // Collect links
  const links: Array<{ s: HierarchyNode; t: HierarchyNode }> = [];
  nodes.forEach((n) => {
    if (n.children) n.children.forEach((c) => links.push({ s: n, t: c }));
  });

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .link { stroke: #9aa0a6; stroke-width: 1.2; fill: none; }
    .label { font: 12px sans-serif; text-anchor: middle; fill: #3c4043; }
  </style>
  <g>`;

  // Draw links
  links.forEach(({ s, t }) => {
    svg += `\n    <line class="link" x1="${tx(s.x)}" y1="${ty(s.y)}" x2="${tx(t.x)}" y2="${ty(t.y)}"/>`;
  });

  // Draw nodes
  nodes.forEach((n) => {
    const x = tx(n.x);
    const y = ty(n.y);
    const fill = getNodeColor(n, colorScheme);
    if (nodeType === "circle") {
      svg += `\n    <circle cx="${x}" cy="${y}" r="${nodeSize}" fill="${fill}" stroke="#1f2937" stroke-width="1"/>`;
    } else if (nodeType === "square") {
      const side = nodeSize * 2;
      svg += `\n    <rect x="${x - side / 2}" y="${y - side / 2}" width="${side}" height="${side}" rx="2" fill="${fill}" stroke="#1f2937" stroke-width="1"/>`;
    } else {
      // rect
      const w = nodeSize * 10;
      const h = nodeSize * 2;
      svg += `\n    <rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="#1f2937" stroke-width="1"/>`;
    }
    if (showLabels && n.data?.id) {
      svg += `\n    <text class="label" x="${x}" y="${y - (nodeSize + 8)}">${n.data.id}</text>`;
    }
  });

  svg += `\n  </g>\n</svg>`;
  return svg;
}

/**
 * Generate basic SVG from layout result for snapshot testing
 */
export function generateSVG(
  root: HierarchyNode,
  options: {
    width?: number;
    height?: number;
    nodeRadius?: number;
    showLabels?: boolean;
  } = {}
): string {
  const {
    width = 800,
    height = 600,
    nodeRadius = 5,
    showLabels = true,
  } = options;

  // Calculate bounds
  const nodes: HierarchyNode[] = [];
  const links: Array<{ source: HierarchyNode; target: HierarchyNode }> = [];

  function traverse(node: HierarchyNode) {
    nodes.push(node);
    if (node.children) {
      node.children.forEach((child) => {
        links.push({ source: node, target: child });
        traverse(child);
      });
    }
  }
  traverse(root);

  // Find bounds
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    if (node.x !== undefined) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
    }
    if (node.y !== undefined) {
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
  });

  const padding = 50;
  const dataWidth = maxX - minX;
  const dataHeight = maxY - minY;
  const scale = Math.min(
    (width - 2 * padding) / dataWidth,
    (height - 2 * padding) / dataHeight
  );

  function transformX(x: number): number {
    return (x - minX) * scale + padding;
  }

  function transformY(y: number): number {
    return (y - minY) * scale + padding;
  }

  // Generate SVG
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .link { stroke: #999; stroke-width: 1.5; fill: none; }
    .node { fill: #69b3a2; stroke: #333; stroke-width: 1.5; }
    .label { font-family: Arial, sans-serif; font-size: 12px; text-anchor: middle; }
  </style>
  <g>
`;

  // Draw links
  links.forEach(({ source, target }) => {
    if (
      source.x !== undefined &&
      source.y !== undefined &&
      target.x !== undefined &&
      target.y !== undefined
    ) {
      svg += `    <line class="link" x1="${transformX(
        source.x
      )}" y1="${transformY(source.y)}" x2="${transformX(
        target.x
      )}" y2="${transformY(target.y)}" />\n`;
    }
  });

  // Draw nodes
  nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      const x = transformX(node.x);
      const y = transformY(node.y);
      svg += `    <circle class="node" cx="${x}" cy="${y}" r="${nodeRadius}" />\n`;
      if (showLabels && node.data?.id) {
        svg += `    <text class="label" x="${x}" y="${y - 10}">${
          node.data.id
        }</text>\n`;
      }
    }
  });

  svg += `  </g>
</svg>`;

  return svg;
}

/**
 * Base snapshot comparison function
 */
function matchSnapshot(svg: string, filename: string): void {
  const filepath = join(process.cwd(), "__tests__/snapshots", filename);

  if (!existsSync(filepath)) {
    // Generate snapshot if it doesn't exist
    writeFileSync(filepath, svg, "utf-8");
    console.log(`✨ Generated new snapshot: ${filename}`);
  } else {
    // Compare with existing snapshot
    const existingSVG = readFileSync(filepath, "utf-8");

    try {
      expect(svg).toBe(existingSVG);
    } catch (error) {
      // If snapshots don't match, save the new version with .new suffix for comparison
      writeFileSync(filepath + ".new", svg, "utf-8");
      console.error(`❌ Snapshot mismatch: ${filename}`);
      console.error(`   New snapshot saved as: ${filename}.new`);
      console.error(`   To update: mv ${filename}.new ${filename}`);
      throw error;
    }
  }
}

/**
 * Compare SVG with snapshot - generates if not exists, compares if exists
 * This is similar to Jest's toMatchSnapshot but for SVG files
 */
export function expectSVGToMatchSnapshot(
  root: HierarchyNode,
  filename: string,
  options?: Parameters<typeof generateSVG>[1]
): void {
  const svg = generateSVG(root, options);
  matchSnapshot(svg, filename);
}

/**
 * Compare styled SVG with snapshot
 */
export function expectStyledSVGToMatchSnapshot(
  root: HierarchyNode,
  filename: string,
  options?: Parameters<typeof generateStyledSVG>[1]
): void {
  const svg = generateStyledSVG(root, options);
  matchSnapshot(svg, filename);
}

/**
 * Update snapshot - always overwrites the existing snapshot
 * Use this when you intentionally want to update snapshots
 */
export function updateSVGSnapshot(
  root: HierarchyNode,
  filename: string,
  options?: Parameters<typeof generateSVG>[1]
): void {
  const svg = generateSVG(root, options);
  const filepath = join(process.cwd(), "__tests__/snapshots", filename);
  writeFileSync(filepath, svg, "utf-8");
  // eslint-disable-next-line no-console
  console.log(`✅ Updated snapshot: ${filename}`);
}

/**
 * Helper to collect all nodes from a tree
 */
export function collectNodes(root: HierarchyNode): HierarchyNode[] {
  const nodes: HierarchyNode[] = [];
  function traverse(node: HierarchyNode) {
    nodes.push(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }
  traverse(root);
  return nodes;
}
