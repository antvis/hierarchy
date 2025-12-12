import TreeLayout from './layout/base';
import mindmap from './layout/mindmap';
import doTreeLayout from './layout/do-layout';
import { assign } from './util';
import type { HierarchyData, HierarchyNode, MindmapOptions } from './types';

class MindmapLayout extends TreeLayout {
  execute(): HierarchyNode {
    return doTreeLayout(this.rootNode, this.options, mindmap);
  }
}

const DEFAULT_OPTIONS: MindmapOptions = {};

export default function mindmapLayout(
  root: HierarchyData,
  options?: MindmapOptions,
): HierarchyNode {
  const mergedOptions = assign({}, DEFAULT_OPTIONS, options);
  return new MindmapLayout(root, mergedOptions).execute();
}
