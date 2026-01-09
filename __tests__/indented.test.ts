import { describe, it, expect } from 'vitest';
import { indented } from '../src/index';
import { expectSVGToMatchSnapshot, expectStyledSVGToMatchSnapshot, collectNodes } from './utils/svg-generator';
import complexTree from './fixtures/complex-tree.json';
import basicTree from './fixtures/basic-tree.json';

describe('Indented Layout', () => {
  it('should layout a basic tree structure', () => {
    const result = indented(basicTree);

    // Check root node
    expect(result).toBeDefined();
    expect(result.data.id).toBe('root');
    expect(result.x).toBeDefined();
    expect(result.y).toBeDefined();

    // Check all nodes have coordinates
    const nodes = collectNodes(result);
    nodes.forEach((node) => {
      expect(node.x).toBeDefined();
      expect(node.y).toBeDefined();
    });

    // Generate SVG for visual inspection
    expectSVGToMatchSnapshot(result, 'indented-basic.svg');
  });

  it('should layout with different directions', () => {
    const directions = ['LR', 'RL', 'H'] as const;

    directions.forEach((direction) => {
      const result = indented(basicTree, { direction });

      expect(result).toBeDefined();
      const nodes = collectNodes(result);
      expect(nodes.length).toBeGreaterThan(0);

      // Generate SVG for each direction
      expectSVGToMatchSnapshot(result, `indented-${direction}.svg`);
    });
  });

  it('should respect indent configuration', () => {
    const result = indented(basicTree, {
      indent: 50,
    });

    expect(result).toBeDefined();

    // Check that child nodes are indented relative to parent
    if (result.children && result.children.length > 0) {
      const child = result.children[0];
      const xDiff = Math.abs((child.x || 0) - (result.x || 0));
      expect(xDiff).toBeGreaterThan(0);
    }

    expectSVGToMatchSnapshot(result, 'indented-spacing.svg');
  });

  it('should handle vertical spacing', () => {
    const result = indented(basicTree, {
      getVGap: () => 30,
    });

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    expect(nodes.length).toBeGreaterThan(0);

    expectSVGToMatchSnapshot(result, 'indented-vgap.svg');
  });

  it('should handle deep nested structures', () => {
    const deepTree = {
      id: 'root',
      children: [
        {
          id: 'level-1',
          children: [
            {
              id: 'level-2',
              children: [
                {
                  id: 'level-3',
                  children: [{ id: 'level-4' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = indented(deepTree);

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    expect(nodes.length).toBe(5);

    // Check that each level is properly indented
    let prevDepth = -1;
    nodes.forEach((node) => {
      if (node.depth !== undefined) {
        expect(node.depth).toBeGreaterThanOrEqual(prevDepth);
        prevDepth = node.depth;
      }
    });

    expectSVGToMatchSnapshot(result, 'indented-deep.svg');
  });

  it('should layout nodes with custom sizes', () => {
    const treeWithSizes = {
      id: 'root',
      height: 50,
      children: [
        { id: 'c1', height: 30 },
        { id: 'c2', height: 40 },
        { id: 'c3', height: 20 },
      ],
    };

    const result = indented(treeWithSizes, {
      getHeight: (node) => (node?.data?.height as number) || 20,
    });

    expect(result).toBeDefined();
    expectSVGToMatchSnapshot(result, 'indented-custom-sizes.svg');
  });

  it('complex styled snapshots (nodeType × colorScheme)', () => {
    const nodeTypes = ['rect', 'square', 'circle'] as const;
    const colorSchemes = ['depth', 'branch', 'single'] as const;

    const nodeSize = 10;
    const getNodeWidth = (nodeType: string) => {
      switch (nodeType) {
        case 'circle':
        case 'square':
          return nodeSize * 2;
        case 'rect':
        default:
          return nodeSize * 10;
      }
    };
    const getNodeHeight = () => nodeSize * 2;

    nodeTypes.forEach((nodeType) => {
      colorSchemes.forEach((colorScheme) => {
        const result = indented(complexTree as any, {
          direction: 'LR',
          indent: 50,
          getHGap: () => 50,
          getVGap: () => 50,
          getWidth: () => getNodeWidth(nodeType),
          getHeight: () => getNodeHeight(),
        } as any);

        expect(result).toBeDefined();
        const filename = `indented-${nodeType}-${colorScheme}.svg`;
        expectStyledSVGToMatchSnapshot(result, filename, {
          nodeType: nodeType as any,
          colorScheme: colorScheme as any,
          nodeSize,
          showLabels: true,
          width: 900,
          height: 700,
        });
      });
    });
  });
});
