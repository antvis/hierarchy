import type { HierarchyNode, HierarchyOptions } from '../types';

interface WrappedTreeNode {
  w: number;
  h: number;
  y: number;
  x: number;
  c: WrappedTreeNode[];
  cs: number;
  prelim: number;
  mod: number;
  shift: number;
  change: number;
  tl: WrappedTreeNode | null;
  tr: WrappedTreeNode | null;
  el: WrappedTreeNode | null;
  er: WrappedTreeNode | null;
  msel: number;
  mser: number;
}

class WrappedTree implements WrappedTreeNode {
  w: number;
  h: number;
  y: number;
  x: number = 0;
  c: WrappedTreeNode[];
  cs: number;
  prelim: number = 0;
  mod: number = 0;
  shift: number = 0;
  change: number = 0;
  tl: WrappedTreeNode | null = null;
  tr: WrappedTreeNode | null = null;
  el: WrappedTreeNode | null = null;
  er: WrappedTreeNode | null = null;
  msel: number = 0;
  mser: number = 0;

  constructor(w: number = 0, h: number = 0, y: number = 0, c: WrappedTreeNode[] = []) {
    this.w = w || 0;
    this.h = h || 0;
    this.y = y || 0;
    this.c = c || [];
    this.cs = c.length;
  }

  static fromNode(root: HierarchyNode | null, isHorizontal?: boolean): WrappedTreeNode | null {
    if (!root) return null;
    const children: WrappedTreeNode[] = [];
    root.children.forEach((child) => {
      const wrappedChild = WrappedTree.fromNode(child, isHorizontal);
      if (wrappedChild) children.push(wrappedChild);
    });
    if (isHorizontal) {
      return new WrappedTree(root.height, root.width, root.x, children);
    }
    return new WrappedTree(root.width, root.height, root.y, children);
  }
}

function moveRight(node: HierarchyNode, move: number, isHorizontal?: boolean): void {
  if (isHorizontal) {
    node.y += move;
  } else {
    node.x += move;
  }
  node.children.forEach((child) => {
    moveRight(child, move, isHorizontal);
  });
}

function getMin(node: HierarchyNode, isHorizontal?: boolean): number {
  let res = isHorizontal ? node.y : node.x;
  node.children.forEach((child) => {
    res = Math.min(getMin(child, isHorizontal), res);
  });
  return res;
}

function normalize(node: HierarchyNode, isHorizontal?: boolean): void {
  const min = getMin(node, isHorizontal);
  moveRight(node, -min, isHorizontal);
}

function convertBack(
  converted: WrappedTreeNode,
  root: HierarchyNode,
  isHorizontal?: boolean,
): void {
  if (isHorizontal) {
    root.y = converted.x;
  } else {
    root.x = converted.x;
  }
  converted.c.forEach((child, i) => {
    convertBack(child, root.children[i], isHorizontal);
  });
}

function layer(node: HierarchyNode, isHorizontal?: boolean, d: number = 0): void {
  if (isHorizontal) {
    node.x = d;
    d += node.width;
  } else {
    node.y = d;
    d += node.height;
  }
  node.children.forEach((child) => {
    layer(child, isHorizontal, d);
  });
}

interface IYL {
  low: number;
  index: number;
  nxt: IYL | null;
}

export default function nonLayeredTidy(
  root: HierarchyNode,
  options: HierarchyOptions = {},
): HierarchyNode {
  const isHorizontal = options.isHorizontal;

  function firstWalk(t: WrappedTreeNode): void {
    if (t.cs === 0) {
      setExtremes(t);
      return;
    }
    firstWalk(t.c[0]);
    let ih: IYL | null = updateIYL(bottom(t.c[0].el!), 0, null);
    for (let i = 1; i < t.cs; ++i) {
      firstWalk(t.c[i]);
      const min = bottom(t.c[i].er!);
      separate(t, i, ih);
      ih = updateIYL(min, i, ih);
    }
    positionRoot(t);
    setExtremes(t);
  }

  function setExtremes(t: WrappedTreeNode): void {
    if (t.cs === 0) {
      t.el = t;
      t.er = t;
      t.msel = t.mser = 0;
    } else {
      t.el = t.c[0].el;
      t.msel = t.c[0].msel;
      t.er = t.c[t.cs - 1].er;
      t.mser = t.c[t.cs - 1].mser;
    }
  }

  function separate(t: WrappedTreeNode, i: number, ih: IYL | null): void {
    let sr: WrappedTreeNode | null = t.c[i - 1];
    let mssr = sr.mod;
    let cl: WrappedTreeNode | null = t.c[i];
    let mscl = cl.mod;
    while (sr !== null && cl !== null) {
      if (bottom(sr) > ih!.low) ih = ih!.nxt;
      const dist = mssr + sr.prelim + sr.w - (mscl + cl.prelim);
      if (dist > 0) {
        mscl += dist;
        moveSubtree(t, i, ih!.index, dist);
      }
      const sy = bottom(sr);
      const cy = bottom(cl);
      if (sy <= cy) {
        sr = nextRightContour(sr);
        if (sr !== null) mssr += sr.mod;
      }
      if (sy >= cy) {
        cl = nextLeftContour(cl);
        if (cl !== null) mscl += cl.mod;
      }
    }
    if (!sr && !!cl) {
      setLeftThread(t, i, cl, mscl);
    } else if (!!sr && !cl) {
      setRightThread(t, i, sr, mssr);
    }
  }

  function moveSubtree(t: WrappedTreeNode, i: number, si: number, dist: number): void {
    t.c[i].mod += dist;
    t.c[i].msel += dist;
    t.c[i].mser += dist;
    distributeExtra(t, i, si, dist);
  }

  function nextLeftContour(t: WrappedTreeNode): WrappedTreeNode | null {
    return t.cs === 0 ? t.tl : t.c[0];
  }

  function nextRightContour(t: WrappedTreeNode): WrappedTreeNode | null {
    return t.cs === 0 ? t.tr : t.c[t.cs - 1];
  }

  function bottom(t: WrappedTreeNode): number {
    return t.y + t.h;
  }

  function setLeftThread(
    t: WrappedTreeNode,
    i: number,
    cl: WrappedTreeNode,
    modsumcl: number,
  ): void {
    const li = t.c[0].el!;
    li.tl = cl;
    const diff = modsumcl - cl.mod - t.c[0].msel;
    li.mod += diff;
    li.prelim -= diff;
    t.c[0].el = t.c[i].el;
    t.c[0].msel = t.c[i].msel;
  }

  function setRightThread(
    t: WrappedTreeNode,
    i: number,
    sr: WrappedTreeNode,
    modsumsr: number,
  ): void {
    const ri = t.c[i].er!;
    ri.tr = sr;
    const diff = modsumsr - sr.mod - t.c[i].mser;
    ri.mod += diff;
    ri.prelim -= diff;
    t.c[i].er = t.c[i - 1].er;
    t.c[i].mser = t.c[i - 1].mser;
  }

  function positionRoot(t: WrappedTreeNode): void {
    t.prelim =
      (t.c[0].prelim + t.c[0].mod + t.c[t.cs - 1].mod + t.c[t.cs - 1].prelim + t.c[t.cs - 1].w) /
        2 -
      t.w / 2;
  }

  function secondWalk(t: WrappedTreeNode, modsum: number): void {
    modsum += t.mod;
    t.x = t.prelim + modsum;
    addChildSpacing(t);
    for (let i = 0; i < t.cs; i++) {
      secondWalk(t.c[i], modsum);
    }
  }

  function distributeExtra(t: WrappedTreeNode, i: number, si: number, dist: number): void {
    if (si !== i - 1) {
      const nr = i - si;
      t.c[si + 1].shift += dist / nr;
      t.c[i].shift -= dist / nr;
      t.c[i].change -= dist - dist / nr;
    }
  }

  function addChildSpacing(t: WrappedTreeNode): void {
    let d = 0;
    let modsumdelta = 0;
    for (let i = 0; i < t.cs; i++) {
      d += t.c[i].shift;
      modsumdelta += d + t.c[i].change;
      t.c[i].mod += modsumdelta;
    }
  }

  function updateIYL(low: number, index: number, ih: IYL | null): IYL {
    while (ih !== null && low >= ih.low) {
      ih = ih.nxt;
    }
    return {
      low,
      index,
      nxt: ih,
    };
  }

  // do layout
  layer(root, isHorizontal);
  const wt = WrappedTree.fromNode(root, isHorizontal);
  if (wt) {
    firstWalk(wt);
    secondWalk(wt, 0);
    convertBack(wt, root, isHorizontal);
    normalize(root, isHorizontal);
  }

  return root;
}
