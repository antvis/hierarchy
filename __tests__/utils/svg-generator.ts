import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { expect } from "vitest";
import { HierarchyNode } from "../../src";

/**
 * Generate SVG from layout result for snapshot testing
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
 * Compare SVG with snapshot - generates if not exists, compares if exists
 * This is similar to Jest's toMatchSnapshot but for SVG files
 */
export function expectSVGToMatchSnapshot(
  root: HierarchyNode,
  filename: string,
  options?: Parameters<typeof generateSVG>[1]
): void {
  const svg = generateSVG(root, options);
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
