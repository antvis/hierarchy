import { assign } from '../util';
import type { HierarchyData, HierarchyNode, HierarchyOptions, BoundingBox } from '../types';

const PEM = 18;
const DEFAULT_HEIGHT = PEM * 2;
const DEFAULT_GAP = PEM;

const DEFAULT_OPTIONS: Required<
  Pick<
    HierarchyOptions,
    | 'getId'
    | 'getPreH'
    | 'getPreV'
    | 'getHGap'
    | 'getVGap'
    | 'getChildren'
    | 'getHeight'
    | 'getWidth'
  >
> = {
  getId(d: HierarchyData): string {
    return (d.id || d.name) as string;
  },
  getPreH(d: HierarchyData): number {
    return d.preH || 0;
  },
  getPreV(d: HierarchyData): number {
    return d.preV || 0;
  },
  getHGap(d: HierarchyData): number {
    return d.hgap || DEFAULT_GAP;
  },
  getVGap(d: HierarchyData): number {
    return d.vgap || DEFAULT_GAP;
  },
  getChildren(d: HierarchyData): HierarchyData[] | undefined {
    return d.children;
  },
  getHeight(d: HierarchyData): number {
    return d.height || DEFAULT_HEIGHT;
  },
  getWidth(d: HierarchyData): number {
    const label = d.label || ' ';
    return d.width || label.split('').length * PEM; // FIXME DO NOT get width like this
  },
};

class Node implements HierarchyNode {
  data: HierarchyData;
  id: string;
  x: number = 0;
  y: number = 0;
  width: number;
  height: number;
  depth: number = 0;
  children: HierarchyNode[] = [];
  parent?: HierarchyNode;
  hgap: number = 0;
  vgap: number = 0;
  preH: number;
  preV: number;

  constructor(data: HierarchyData | HierarchyNode, options: HierarchyOptions) {
    if (data instanceof Node || ('x' in data && 'y' in data && 'children' in data)) {
      // If it's already a Node, cast and return
      const node = data as Node;
      this.data = node.data;
      this.id = node.id;
      this.x = node.x;
      this.y = node.y;
      this.width = node.width;
      this.height = node.height;
      this.depth = node.depth;
      this.children = node.children;
      this.parent = node.parent;
      this.hgap = node.hgap;
      this.vgap = node.vgap;
      this.preH = node.preH;
      this.preV = node.preV;
      return;
    }

    this.data = data as HierarchyData;

    /*
     * Gaps: filling space between nodes
     * (x, y) ----------------------
     * |            vgap            |
     * |    --------------------    h
     * | h |                    |   e
     * | g |                    |   i
     * | a |                    |   g
     * | p |                    |   h
     * |   ---------------------    t
     * |                            |
     *  -----------width------------
     */
    const hgap = options.getHGap!(data);
    const vgap = options.getVGap!(data);
    this.preH = options.getPreH!(data);
    this.preV = options.getPreV!(data);
    this.width = options.getWidth!(data);
    this.height = options.getHeight!(data);
    this.width += this.preH;
    this.height += this.preV;
    this.id = options.getId!(data);

    this.addGap(hgap, vgap);
  }

  isRoot(): boolean {
    return this.depth === 0;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  addGap(hgap: number, vgap: number): void {
    this.hgap += hgap;
    this.vgap += vgap;
    this.width += 2 * hgap;
    this.height += 2 * vgap;
  }

  eachNode(callback: (node: HierarchyNode) => void): void {
    let nodes: HierarchyNode[] = [this];
    let current: HierarchyNode | undefined;
    while ((current = nodes.shift())) {
      callback(current);
      nodes = current.children.concat(nodes);
    }
  }

  DFTraverse(callback: (node: HierarchyNode) => void): void {
    this.eachNode(callback);
  }

  BFTraverse(callback: (node: HierarchyNode) => void): void {
    let nodes: HierarchyNode[] = [this];
    let current: HierarchyNode | undefined;
    while ((current = nodes.shift())) {
      callback(current);
      nodes = nodes.concat(current.children);
    }
  }

  getBoundingBox(): BoundingBox {
    const bb: BoundingBox = {
      left: Number.MAX_VALUE,
      top: Number.MAX_VALUE,
      width: 0,
      height: 0,
    };
    this.eachNode((node) => {
      bb.left = Math.min(bb.left, node.x);
      bb.top = Math.min(bb.top, node.y);
      bb.width = Math.max(bb.width, node.x + node.width);
      bb.height = Math.max(bb.height, node.y + node.height);
    });
    return bb;
  }

  translate(tx: number = 0, ty: number = 0): void {
    this.eachNode((node) => {
      node.x += tx;
      node.y += ty;
      node.x += node.preH;
      node.y += node.preV;
    });
  }

  right2left(): void {
    const bb = this.getBoundingBox();
    this.eachNode((node) => {
      node.x = node.x - (node.x - bb.left) * 2 - node.width;
    });
    this.translate(bb.width, 0);
  }

  bottom2top(): void {
    const bb = this.getBoundingBox();
    this.eachNode((node) => {
      node.y = node.y - (node.y - bb.top) * 2 - node.height;
    });
    this.translate(0, bb.height);
  }
}

export default function hierarchy(
  data: HierarchyData,
  options: HierarchyOptions = {},
  isolated?: boolean,
): HierarchyNode {
  options = assign({}, DEFAULT_OPTIONS, options);
  const root = new Node(data, options);
  const nodes: HierarchyNode[] = [root];
  let node: HierarchyNode | undefined;

  if (!isolated && !data.collapsed) {
    while ((node = nodes.shift())) {
      if (!node.data.collapsed) {
        const children = options.getChildren!(node.data);
        const length = children ? children.length : 0;
        node.children = new Array(length);
        if (children && length) {
          for (let i = 0; i < length; i++) {
            const child = new Node(children[i], options);
            node.children[i] = child;
            nodes.push(child);
            child.parent = node;
            child.depth = node.depth + 1;
          }
        }
      }
    }
  }

  return root;
}
