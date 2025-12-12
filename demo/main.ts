import { compactBox, dendrogram, indented, mindmap } from "../src/index";
import type { HierarchyNode, HierarchyData } from "../src/types";

// Color palettes
const colorPalettes = {
  // 深度色板 - 渐变色
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
  // 分支色板 - 对比色
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
  // 单色
  single: ["#667eea"],
};

// Load datasets
const datasets: Record<string, Promise<HierarchyData>> = {
  tree: fetch("./data/tree.json").then((r) => r.json()),
  organization: fetch("./data/organization.json").then((r) => r.json()),
  mindmap: fetch("./data/mind.json").then((r) => r.json()),
};

// Layout algorithms
const algorithms = {
  compactBox,
  dendrogram,
  indented,
  mindmap,
};

// Current state
let currentData: HierarchyData | null = null;
let currentLayout: HierarchyNode | null = null;

// Get DOM elements
const canvas = document.getElementById("canvas")!;
const algorithmSelect = document.getElementById(
  "algorithm"
) as HTMLSelectElement;
const directionSelect = document.getElementById(
  "direction"
) as HTMLSelectElement;
const datasetSelect = document.getElementById("dataset") as HTMLSelectElement;
const nodeTypeSelect = document.getElementById("nodeType") as HTMLSelectElement;
const colorSchemeSelect = document.getElementById(
  "colorScheme"
) as HTMLSelectElement;
const hgapInput = document.getElementById("hgap") as HTMLInputElement;
const vgapInput = document.getElementById("vgap") as HTMLInputElement;
const renderButton = document.getElementById("render")!;
const downloadButton = document.getElementById("download")!;
const resetButton = document.getElementById("reset")!;
const nodeCountSpan = document.getElementById("nodeCount")!;
const renderTimeSpan = document.getElementById("renderTime")!;
const canvasSizeSpan = document.getElementById("canvasSize")!;

// Update direction options based on algorithm
function updateDirectionOptions() {
  const algorithm = algorithmSelect.value;
  const allOptions = [
    { value: "TB", label: "Top to Bottom (TB)" },
    { value: "BT", label: "Bottom to Top (BT)" },
    { value: "LR", label: "Left to Right (LR)" },
    { value: "RL", label: "Right to Left (RL)" },
    { value: "H", label: "Horizontal (H)" },
    { value: "V", label: "Vertical (V)" },
  ];

  let validOptions: string[] = [];

  switch (algorithm) {
    case "compactBox":
    case "dendrogram":
      validOptions = ["TB", "BT", "LR", "RL"];
      break;
    case "indented":
      validOptions = ["LR", "RL", "H"];
      break;
    case "mindmap":
      validOptions = ["H", "V"];
      break;
  }

  directionSelect.innerHTML = allOptions
    .filter((opt) => validOptions.includes(opt.value))
    .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
    .join("");
}

// Collect all nodes from tree
function collectNodes(root: HierarchyNode): HierarchyNode[] {
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

// Calculate bounds
function calculateBounds(nodes: HierarchyNode[]) {
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

  return { minX, maxX, minY, maxY };
}

// Get node color based on color scheme
function getNodeColor(node: HierarchyNode, colorScheme: string): string {
  const palette =
    colorPalettes[colorScheme as keyof typeof colorPalettes] ||
    colorPalettes.single;

  switch (colorScheme) {
    case "depth":
      // Color by depth level
      return palette[node.depth % palette.length];
    case "branch":
      // Color by branch (using parent index)
      let branchIndex = 0;
      if (node.parent && node.parent.children) {
        branchIndex = node.parent.children.indexOf(node);
      }
      return palette[branchIndex % palette.length];
    case "single":
    default:
      return palette[0];
  }
}

// Assign parent references and branch info
function assignParentInfo(
  node: HierarchyNode,
  parent: HierarchyNode | null = null
) {
  (node as any).parent = parent;
  if (node.children) {
    node.children.forEach((child) => assignParentInfo(child, node));
  }
}

// Update color legend
function updateColorLegend() {
  const colorScheme = colorSchemeSelect.value;
  const legendDiv = document.getElementById("colorLegend")!;
  const palette =
    colorPalettes[colorScheme as keyof typeof colorPalettes] ||
    colorPalettes.single;

  let legendHTML =
    '<div class="legend-title">Color Scheme:</div><div class="legend-items">';

  switch (colorScheme) {
    case "depth":
      palette.forEach((color, index) => {
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color" style="background: ${color}"></div>
            <span>Level ${index}</span>
          </div>
        `;
      });
      break;
    case "branch":
      palette.forEach((color, index) => {
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color" style="background: ${color}"></div>
            <span>Branch ${index + 1}</span>
          </div>
        `;
      });
      break;
    case "single":
      legendHTML += `
        <div class="legend-item">
          <div class="legend-color" style="background: ${palette[0]}"></div>
          <span>All Nodes</span>
        </div>
      `;
      break;
  }

  legendHTML += "</div>";
  legendDiv.innerHTML = legendHTML;
}

// Render layout
function renderLayout() {
  if (!currentLayout) return;

  const nodes = collectNodes(currentLayout);
  const bounds = calculateBounds(nodes);

  const padding = 50;
  const dataWidth = bounds.maxX - bounds.minX;
  const dataHeight = bounds.maxY - bounds.minY;
  const canvasWidth = dataWidth + 2 * padding;
  const canvasHeight = dataHeight + 2 * padding;

  const nodeType = nodeTypeSelect.value;
  const colorScheme = colorSchemeSelect.value;
  const nodeSize = 10; // Base size for all node types

  // Assign parent info for branch coloring
  assignParentInfo(currentLayout);

  // Create SVG
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", canvasWidth.toString());
  svg.setAttribute("height", canvasHeight.toString());
  svg.setAttribute("viewBox", `0 0 ${canvasWidth} ${canvasHeight}`);

  // Transform coordinates
  function transformX(x: number): number {
    return x - bounds.minX + padding;
  }

  function transformY(y: number): number {
    return y - bounds.minY + padding;
  }

  // Draw links (using smooth curves)
  const linksGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );

  // Determine curve direction based on layout algorithm and direction
  // For LR/RL: use horizontal curves (control points on X axis)
  // For TB/BT: use vertical curves (control points on Y axis)
  // For H (indented): use horizontal curves
  // For V: use vertical curves
  const currentDirection = directionSelect.value;
  const useHorizontalCurve =
    currentDirection === "LR" ||
    currentDirection === "RL" ||
    currentDirection === "H";

  nodes.forEach((node) => {
    if (node.children && node.x !== undefined && node.y !== undefined) {
      node.children.forEach((child) => {
        if (child.x !== undefined && child.y !== undefined) {
          const x1 = transformX(node.x);
          const y1 = transformY(node.y);
          const x2 = transformX(child.x);
          const y2 = transformY(child.y);

          // Create smooth bezier curve
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          path.setAttribute("class", "link");

          let d: string;
          if (useHorizontalCurve) {
            // Horizontal curve: control points adjust X coordinate
            const midX = x1 + (x2 - x1) / 2;
            d = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
          } else {
            // Vertical curve: control points adjust Y coordinate
            const midY = y1 + (y2 - y1) / 2;
            d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
          }

          path.setAttribute("d", d);
          linksGroup.appendChild(path);
        }
      });
    }
  });
  svg.appendChild(linksGroup);

  // Draw nodes
  const nodesGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  nodes.forEach((node) => {
    if (node.x !== undefined && node.y !== undefined) {
      const x = transformX(node.x);
      const y = transformY(node.y);
      const color = getNodeColor(node, colorScheme);

      let nodeElement: SVGElement;

      // Create node based on type
      switch (nodeType) {
        case "circle":
          nodeElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          nodeElement.setAttribute("cx", x.toString());
          nodeElement.setAttribute("cy", y.toString());
          nodeElement.setAttribute("r", nodeSize.toString());
          break;

        case "square":
          nodeElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          const squareSize = nodeSize * 1.8;
          nodeElement.setAttribute("x", (x - squareSize / 2).toString());
          nodeElement.setAttribute("y", (y - squareSize / 2).toString());
          nodeElement.setAttribute("width", squareSize.toString());
          nodeElement.setAttribute("height", squareSize.toString());
          nodeElement.setAttribute("rx", "2"); // Slight rounding
          break;

        case "rect":
          nodeElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "rect"
          );
          const rectWidth = nodeSize * 10; // 增大到 5 倍
          const rectHeight = nodeSize * 2; // 增大到 2 倍
          nodeElement.setAttribute("x", (x - rectWidth / 2).toString());
          nodeElement.setAttribute("y", (y - rectHeight / 2).toString());
          nodeElement.setAttribute("width", rectWidth.toString());
          nodeElement.setAttribute("height", rectHeight.toString());
          nodeElement.setAttribute("rx", "4");
          break;

        default:
          nodeElement = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          nodeElement.setAttribute("cx", x.toString());
          nodeElement.setAttribute("cy", y.toString());
          nodeElement.setAttribute("r", nodeSize.toString());
      }

      nodeElement.setAttribute("class", "node");
      nodeElement.setAttribute("fill", color);
      nodeElement.setAttribute("title", node.data.id || "node");
      nodesGroup.appendChild(nodeElement);

      // Node label
      if (node.data.id) {
        const text = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        text.setAttribute("class", "node-label");
        text.setAttribute("x", x.toString());
        text.setAttribute("y", (y - nodeSize - 8).toString());
        text.textContent = node.data.id;
        nodesGroup.appendChild(text);
      }
    }
  });
  svg.appendChild(nodesGroup);

  // Update canvas
  canvas.innerHTML = "";
  canvas.appendChild(svg);

  // Update stats
  nodeCountSpan.textContent = nodes.length.toString();
  canvasSizeSpan.textContent = `${Math.round(canvasWidth)}x${Math.round(
    canvasHeight
  )}`;

  // Update color legend
  updateColorLegend();
}

// Execute layout algorithm
async function executeLayout() {
  if (!currentData) return;

  const algorithm = algorithmSelect.value as keyof typeof algorithms;
  const direction = directionSelect.value;
  const hgap = parseInt(hgapInput.value);
  const vgap = parseInt(vgapInput.value);
  const nodeType = nodeTypeSelect.value;
  const nodeSize = 10; // Base size

  const startTime = performance.now();

  const layoutFn = algorithms[algorithm];

  // Calculate node dimensions based on node type
  const getNodeWidth = () => {
    switch (nodeType) {
      case "circle":
        return nodeSize * 2; // Diameter
      case "square":
        return nodeSize * 2; // Side length
      case "rect":
        return nodeSize * 5; // Rectangle width
      default:
        return nodeSize * 2;
    }
  };

  const getNodeHeight = () => {
    switch (nodeType) {
      case "circle":
        return nodeSize * 2; // Diameter
      case "square":
        return nodeSize * 2; // Side length
      case "rect":
        return nodeSize * 2; // Rectangle height
      default:
        return nodeSize * 2;
    }
  };

  const options: any = {
    direction,
    getHGap: () => hgap,
    getVGap: () => vgap,
    getWidth: getNodeWidth,
    getHeight: getNodeHeight,
  };

  // Algorithm-specific options
  if (algorithm === "dendrogram") {
    options.nodeSep = hgap / 5;
    options.rankSep = vgap;
  }

  if (algorithm === "indented") {
    options.indent = hgap;
  }

  currentLayout = layoutFn(currentData, options);

  const endTime = performance.now();
  renderTimeSpan.textContent = `${(endTime - startTime).toFixed(2)}ms`;

  renderLayout();
}

// Load dataset
async function loadDataset() {
  const dataset = datasetSelect.value;
  currentData = await datasets[dataset];
  await executeLayout();
}

// Reset to defaults
function reset() {
  algorithmSelect.value = "compactBox";
  datasetSelect.value = "tree";
  nodeTypeSelect.value = "rect";
  colorSchemeSelect.value = "depth";
  hgapInput.value = "50";
  vgapInput.value = "50";
  updateDirectionOptions();
  loadDataset();
}

// Event listeners
algorithmSelect.addEventListener("change", () => {
  updateDirectionOptions();
  executeLayout();
});
directionSelect.addEventListener("change", executeLayout);
nodeTypeSelect.addEventListener("change", executeLayout); // Changed: re-layout when node type changes
colorSchemeSelect.addEventListener("change", renderLayout); // Only re-render for color changes
hgapInput.addEventListener("change", executeLayout);
vgapInput.addEventListener("change", executeLayout);
datasetSelect.addEventListener("change", loadDataset);
renderButton.addEventListener("click", executeLayout);
resetButton.addEventListener("click", reset);

// Initialize
updateDirectionOptions();
loadDataset();
