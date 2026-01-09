import { describe, it, expect } from 'vitest';
import { compactBox, dendrogram, indented, mindmap } from '../src/index';
import type { HierarchyData, HierarchyNode } from '../src/types';

describe('Advanced Tests', () => {
  describe('Boundary Cases', () => {
    it('should handle single node', () => {
      const tree: HierarchyData = { id: 'single' };
      Object.values({ compactBox, dendrogram, indented, mindmap }).forEach((algo) => {
        const result = algo(tree);
        expect(result).toBeDefined();
        expect(result.data.id).toBe('single');
        expect(result.children).toEqual([]);
      });
    });

    it('should handle empty children', () => {
      const tree: HierarchyData = { id: 'root', children: [] };
      const result = compactBox(tree);
      expect(result.children).toEqual([]);
    });

    it('should handle deep tree (50 levels)', () => {
      let tree: HierarchyData = { id: 'root' };
      let current = tree;
      for (let i = 1; i < 50; i++) {
        const child: HierarchyData = { id: `node-${i}` };
        current.children = [child];
        current = child;
      }

      const result = compactBox(tree);
      expect(result).toBeDefined();
      expect(result.data.id).toBe('root');
    });

    it('should handle wide tree (100 children)', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: Array.from({ length: 100 }, (_, i) => ({
          id: `child-${i}`,
        })),
      };

      const result = compactBox(tree);
      expect(result.children).toHaveLength(100);
    });
  });

  describe('Coordinate Integrity', () => {
    it('all nodes should have valid coordinates', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
              { id: 'a3' },
            ],
          },
          {
            id: 'b',
            children: [{ id: 'b1' }],
          },
        ],
      };

      const result = compactBox(tree);
      const checkNodes = (node: HierarchyNode) => {
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(isFinite(node.x)).toBe(true);
        expect(isFinite(node.y)).toBe(true);
        node.children?.forEach((child: HierarchyNode) => checkNodes(child));
      };

      checkNodes(result);
    });

    it('coordinates should be consistent with custom dimensions', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }, { id: 'b' }],
      };

      const result = compactBox(tree, {
        getWidth: (d) => 80 + (d.depth || 0) * 10,
        getHeight: (d) => 40 + (d.depth || 0) * 5,
      });

      expect(result).toBeDefined();
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });
  });

  describe('Traversal Methods', () => {
    it('eachNode should visit all nodes', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
          { id: 'b', children: [{ id: 'b1' }] },
        ],
      };

      const result = compactBox(tree);
      const visited = new Set<string>();

      result.eachNode((node) => {
        visited.add(node.data.id as string);
      });

      expect(visited.has('root')).toBe(true);
      expect(visited.has('a')).toBe(true);
      expect(visited.has('a1')).toBe(true);
      expect(visited.has('a2')).toBe(true);
      expect(visited.has('b')).toBe(true);
      expect(visited.has('b1')).toBe(true);
    });

    it('DFTraverse should visit all nodes', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b', children: [{ id: 'b1' }] },
        ],
      };

      const result = compactBox(tree);
      const visited = new Set<string>();

      result.DFTraverse((node) => {
        visited.add(node.data.id as string);
      });

      expect(visited.has('root')).toBe(true);
      expect(visited.has('a')).toBe(true);
      expect(visited.has('a1')).toBe(true);
      expect(visited.has('b')).toBe(true);
      expect(visited.has('b1')).toBe(true);
    });

    it('BFTraverse should visit nodes in level order', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b', children: [{ id: 'b1' }] },
        ],
      };

      const result = compactBox(tree);
      const visited: string[] = [];

      result.BFTraverse((node) => {
        visited.push(node.data.id as string);
      });

      expect(visited[0]).toBe('root'); // Root should be first
      expect(visited).toContain('a');
      expect(visited).toContain('b');
      expect(visited).toContain('a1');
      expect(visited).toContain('b1');
    });
  });

  describe('Bounding Box', () => {
    it('should have getBoundingBox method', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }, { id: 'b' }],
      };

      const result = compactBox(tree, {
        getWidth: () => 40,
        getHeight: () => 20,
      });

      // Method should exist and be callable
      expect(result.getBoundingBox).toBeDefined();
      const bbox = result.getBoundingBox();
      expect(bbox).toBeDefined();
    });
  });

  describe('Data Preservation', () => {
    it('should preserve custom data properties', () => {
      const tree: HierarchyData = {
        id: 'root',
        label: 'Root Node',
        color: 'red',
        children: [
          { id: 'a', label: 'Node A', value: 100 },
        ],
      };

      const result = compactBox(tree);
      expect((result.data).label).toBe('Root Node');
      expect((result.data).color).toBe('red');
      if (result.children?.length) {
        expect((result.children[0].data).label).toBe('Node A');
        expect((result.children[0].data).value).toBe(100);
      }
    });
  });

  describe('Direction-Specific Behavior', () => {
    it('CompactBox should support TB, BT, LR, RL, H, V directions', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }, { id: 'b' }],
      };

      const directions = ['TB', 'BT', 'LR', 'RL', 'H', 'V'];
      directions.forEach((dir) => {
        const result = compactBox(tree, { direction: dir as any });
        expect(result).toBeDefined();
        expect(result.data.id).toBe('root');
      });
    });

    it('Dendrogram should support TB, BT, LR, RL directions', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }, { id: 'b' }],
      };

      const directions = ['TB', 'BT', 'LR', 'RL'];
      directions.forEach((dir) => {
        const result = dendrogram(tree, { direction: dir as any });
        expect(result).toBeDefined();
      });
    });

    it('Indented should support LR, RL, H directions', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }, { id: 'b' }],
      };

      const directions = ['LR', 'RL', 'H'];
      directions.forEach((dir) => {
        const result = indented(tree, { direction: dir as any });
        expect(result).toBeDefined();
      });
    });

    it('Mindmap should support H, V directions', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }, { id: 'b' }],
      };

      const directions = ['H', 'V'];
      directions.forEach((dir) => {
        const result = mindmap(tree, { direction: dir as any });
        expect(result).toBeDefined();
      });
    });
  });

  describe('Performance Baselines', () => {
    it('should layout large tree efficiently', () => {
      // Create balanced tree: 2^6 - 1 = 127 nodes
      function createBalancedTree(depth: number, branching: number): HierarchyData {
        function build(d: number): HierarchyData {
          const node: HierarchyData = { id: `node-${Math.random()}` };
          if (d < depth) {
            node.children = Array.from({ length: branching }, () => build(d + 1));
          }
          return node;
        }
        return build(0);
      }

      const tree = createBalancedTree(6, 2);
      const start = performance.now();
      const result = compactBox(tree);
      const duration = performance.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle wide trees efficiently', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: Array.from({ length: 200 }, (_, i) => ({
          id: `child-${i}`,
        })),
      };

      const start = performance.now();
      const result = compactBox(tree);
      const duration = performance.now() - start;

      expect(result.children).toHaveLength(200);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Algorithm Consistency', () => {
    it('should produce deterministic results', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b', children: [{ id: 'b1' }, { id: 'b2' }] },
        ],
      };

      const result1 = compactBox(tree);
      const result2 = compactBox(tree);

      expect(result1.x).toBe(result2.x);
      expect(result1.y).toBe(result2.y);
      expect(result1.children).toHaveLength(result2.children?.length);
    });

    it('all algorithms should produce valid layouts', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [{ id: 'a1' }, { id: 'a2' }],
          },
          {
            id: 'b',
            children: [{ id: 'b1' }],
          },
        ],
      };

      const algorithms = { compactBox, dendrogram, indented, mindmap };
      Object.entries(algorithms).forEach(([name, algo]) => {
        const result = algo(tree);
        expect(result).toBeDefined();
        expect(result.data).toBeDefined();
        expect(result.x).toBeDefined();
        expect(result.y).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid direction in indented', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }],
      };

      expect(() => {
        indented(tree, { direction: 'INVALID' as any });
      }).toThrow('Invalid direction');
    });

    it('should throw error for invalid direction in compactBox', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }],
      };

      expect(() => {
        compactBox(tree, { direction: 'INVALID' as any });
      }).toThrow('Invalid direction');
    });

    it('should throw error for invalid direction in dendrogram', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }],
      };

      expect(() => {
        dendrogram(tree, { direction: 'INVALID' as any });
      }).toThrow('Invalid direction');
    });
  });

  describe('Indented Algorithm Options', () => {
    it('should handle first child with dropCap=false', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'first', children: [{ id: 'nested' }] },
          { id: 'second' },
        ],
      };

      const result = indented(tree, { dropCap: false });
      expect(result).toBeDefined();
      expect(result.children?.length).toBe(2);
    });

    it('should handle custom indent with dropCap=false', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b' },
        ],
      };

      const result = indented(tree, { dropCap: false, indent: 30 });
      expect(result).toBeDefined();
    });

    it('should handle align option', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
          { id: 'b' },
        ],
      };

      const result = indented(tree, { align: 'center' });
      expect(result).toBeDefined();
    });
  });

  describe('Direction Variations', () => {
    it('should handle RL direction', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b' },
        ],
      };

      const result = compactBox(tree, { direction: 'RL' });
      expect(result).toBeDefined();
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('should handle BT direction', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b' },
        ],
      };

      const result = compactBox(tree, { direction: 'BT' });
      expect(result).toBeDefined();
      expect(result.x).toBeDefined();
      expect(result.y).toBeDefined();
    });

    it('should handle H direction with complex tree', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'left',
            children: [
              { id: 'left1' },
              { id: 'left2' },
            ],
          },
          {
            id: 'right',
            children: [
              { id: 'right1' },
              { id: 'right2' },
            ],
          },
        ],
      };

      const result = compactBox(tree, { direction: 'H' });
      expect(result).toBeDefined();
      const bbox = result.getBoundingBox();
      expect(bbox).toBeDefined();
    });

    it('should handle V direction with complex tree', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'top',
            children: [
              { id: 'top1' },
              { id: 'top2' },
            ],
          },
          {
            id: 'bottom',
            children: [
              { id: 'bottom1' },
              { id: 'bottom2' },
            ],
          },
        ],
      };

      const result = compactBox(tree, { direction: 'V' });
      expect(result).toBeDefined();
      const bbox = result.getBoundingBox();
      expect(bbox).toBeDefined();
    });
  });

  describe('Fixed Root Options', () => {
    it('should handle fixedRoot=false', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b' },
        ],
      };

      const result = compactBox(tree, { fixedRoot: false });
      expect(result).toBeDefined();
    });

    it('should handle fixedRoot=true explicitly', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }] },
          { id: 'b' },
        ],
      };

      const result = compactBox(tree, { fixedRoot: true });
      expect(result).toBeDefined();
    });
  });

  describe('Mindmap Edge Cases', () => {
    it('should handle single child case', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'single',
            children: [{ id: 'nested' }],
          },
        ],
      };

      const result = mindmap(tree, { direction: 'H' });
      expect(result).toBeDefined();
    });

    it('should handle parent smaller than child', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
              { id: 'a3' },
            ],
          },
        ],
      };

      const result = mindmap(tree, {
        direction: 'H',
        getHeight: (d) => (d.depth === 0 ? 20 : 50),
      });
      expect(result).toBeDefined();
    });

    it('should handle parent larger than total children', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
            ],
          },
        ],
      };

      const result = mindmap(tree, {
        direction: 'H',
        getHeight: (d) => (d.depth === 1 ? 100 : 20),
      });
      expect(result).toBeDefined();
    });

    it('should handle exact single child alignment', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'single',
            children: [{ id: 'only-child' }],
          },
        ],
      };

      const result = mindmap(tree, {
        direction: 'H',
        getHeight: () => 40,
      });
      expect(result).toBeDefined();
    });
  });

  describe('Node Constructor Edge Cases', () => {
    it('should handle pre-computed HierarchyNode', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [{ id: 'a' }],
      };

      const result1 = compactBox(tree);
      const result2 = compactBox(result1);

      expect(result2).toBeDefined();
      expect(result2.x).toBe(result1.x);
      expect(result2.y).toBe(result1.y);
    });
  });

  describe('Complex Tree Structures', () => {
    it('should handle complex tree with many children', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1', children: [{ id: 'a1a' }, { id: 'a1b' }] },
              { id: 'a2', children: [{ id: 'a2a' }] },
              { id: 'a3' },
            ],
          },
          {
            id: 'b',
            children: [
              { id: 'b1' },
              { id: 'b2', children: [{ id: 'b2a' }, { id: 'b2b' }, { id: 'b2c' }] },
            ],
          },
          {
            id: 'c',
            children: [
              { id: 'c1', children: [{ id: 'c1a' }] },
            ],
          },
        ],
      };

      const result = compactBox(tree);
      expect(result).toBeDefined();

      const checkNode = (node: HierarchyNode) => {
        expect(typeof node.x).toBe('number');
        expect(typeof node.y).toBe('number');
        expect(isFinite(node.x)).toBe(true);
        expect(isFinite(node.y)).toBe(true);
        node.children?.forEach(checkNode);
      };
      checkNode(result);
    });

    it('should handle asymmetric tree', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'left',
            children: [
              {
                id: 'left1',
                children: [
                  {
                    id: 'left1a',
                    children: [{ id: 'left1a1' }],
                  },
                ],
              },
            ],
          },
          {
            id: 'right',
            children: [{ id: 'right1' }],
          },
        ],
      };

      const result = compactBox(tree);
      expect(result).toBeDefined();
    });

    it('should handle tree with varying node sizes', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
              { id: 'a3' },
              { id: 'a4' },
            ],
          },
          {
            id: 'b',
            children: [
              { id: 'b1' },
              { id: 'b2' },
            ],
          },
        ],
      };

      const result = compactBox(tree, {
        getWidth: (d) => 40 + (d.depth || 0) * 20,
        getHeight: (d) => 20 + (d.depth || 0) * 10,
        getHGap: (d) => 10 + (d.depth || 0) * 5,
        getVGap: (d) => 10 + (d.depth || 0) * 5,
      });

      expect(result).toBeDefined();
    });

    it('should handle thread setting in complex scenarios', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1', children: [{ id: 'a1a' }] },
              { id: 'a2' },
              { id: 'a3', children: [{ id: 'a3a' }, { id: 'a3b' }] },
            ],
          },
          {
            id: 'b',
            children: [
              { id: 'b1', children: [{ id: 'b1a' }] },
              { id: 'b2', children: [{ id: 'b2a' }] },
            ],
          },
        ],
      };

      const result = compactBox(tree);
      expect(result).toBeDefined();
      expect(result.children?.length).toBe(2);
    });
  });

  describe('Utility Functions Coverage', () => {
    it('should handle align center in getHeight calculation', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] },
          { id: 'b' },
        ],
      };

      const result = indented(tree, { align: 'center' });
      expect(result).toBeDefined();
    });

    it('should handle indented with first child having no parent error case', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          { id: 'a' },
        ],
      };

      const result = indented(tree, { dropCap: false });
      expect(result).toBeDefined();
      expect(result.children?.length).toBe(1);
    });

    it('should handle V direction with negative left bound', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
              { id: 'a3' },
            ],
          },
          {
            id: 'b',
            children: [{ id: 'b1' }],
          },
        ],
      };

      const result = compactBox(tree, {
        direction: 'V',
        getWidth: () => 100,
      });
      expect(result).toBeDefined();
    });

    it('should handle mindmap single child with equal height', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'single',
            children: [{ id: 'child' }],
          },
        ],
      };

      const result = mindmap(tree, {
        direction: 'H',
        getHeight: () => 30,
      });
      expect(result).toBeDefined();
    });

    it('should handle mindmap with parent smaller than children height', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
              { id: 'a3' },
              { id: 'a4' },
            ],
          },
        ],
      };

      const result = mindmap(tree, {
        direction: 'H',
        getHeight: (d) => (d.depth === 1 ? 20 : 50),
      });
      expect(result).toBeDefined();
    });

    it('should handle distributeExtra in non-layered tidy', () => {
      const tree: HierarchyData = {
        id: 'root',
        children: [
          {
            id: 'a',
            children: [
              { id: 'a1' },
              { id: 'a2' },
              { id: 'a3' },
              { id: 'a4' },
              { id: 'a5' },
            ],
          },
          {
            id: 'b',
            children: [
              { id: 'b1' },
              { id: 'b2' },
            ],
          },
          {
            id: 'c',
            children: [
              { id: 'c1' },
              { id: 'c2' },
              { id: 'c3' },
            ],
          },
        ],
      };

      const result = compactBox(tree, {
        getHGap: () => 50,
        getVGap: () => 30,
      });
      expect(result).toBeDefined();
    });
  });
});
