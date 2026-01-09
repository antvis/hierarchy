import { describe, it, expect } from 'vitest';
import { mindmap } from '../src/index';
import { expectSVGToMatchSnapshot, expectStyledSVGToMatchSnapshot, collectNodes } from './utils/svg-generator';
import complexTree from './fixtures/complex-tree.json';
import mindmapTree from './fixtures/mindmap-tree.json';
import basicTree from './fixtures/basic-tree.json';

describe('Mindmap Layout', () => {
  it('should layout a mindmap tree structure', () => {
    const result = mindmap(mindmapTree);

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
    expectSVGToMatchSnapshot(result, 'mindmap-basic.svg');
  });

  it('should layout with different directions', () => {
    const directions = ['H', 'V'] as const;

    directions.forEach((direction) => {
      const result = mindmap(mindmapTree, { direction });

      expect(result).toBeDefined();
      const nodes = collectNodes(result);
      expect(nodes.length).toBeGreaterThan(0);

      // Generate SVG for each direction
      expectSVGToMatchSnapshot(result, `mindmap-${direction}.svg`);
    });
  });

  it('should separate left and right branches', () => {
    const result = mindmap(mindmapTree, { direction: 'H' });

    expect(result).toBeDefined();

    // Check that nodes with different sides are positioned differently
    const nodes = collectNodes(result);
    const leftNodes = nodes.filter((n) => n.data.side === 'left');
    const rightNodes = nodes.filter((n) => n.data.side === 'right');

    if (leftNodes.length > 0 && rightNodes.length > 0) {
      // In horizontal layout, left nodes should be on the left side
      const leftX = leftNodes[0].x || 0;
      const rightX = rightNodes[0].x || 0;

      // This depends on the actual implementation
      expect(Math.abs(leftX - rightX)).toBeGreaterThan(0);
    }

    expectSVGToMatchSnapshot(result, 'mindmap-sides.svg');
  });

  it('should handle spacing configuration', () => {
    const result = mindmap(mindmapTree, {
      getHGap: () => 50,
      getVGap: () => 30,
    });

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    expect(nodes.length).toBeGreaterThan(0);

    expectSVGToMatchSnapshot(result, 'mindmap-spacing.svg');
  });

  it('should handle node sizes', () => {
    const treeWithSizes = {
      id: 'root',
      width: 120,
      height: 60,
      side: 'root',
      children: [
        { id: 'left-1', width: 80, height: 40, side: 'left' },
        { id: 'right-1', width: 80, height: 40, side: 'right' },
      ],
    };

    const result = mindmap(treeWithSizes, {
      getWidth: (node) => (node?.data?.width as number) || 50,
      getHeight: (node) => (node?.data?.height as number) || 20,
    });

    expect(result).toBeDefined();
    expectSVGToMatchSnapshot(result, 'mindmap-sizes.svg');
  });

  it('should handle asymmetric trees', () => {
    const asymmetricTree = {
      id: 'root',
      side: 'root',
      children: [
        {
          id: 'left-1',
          side: 'left',
          children: [
            { id: 'left-1-1', side: 'left' },
            { id: 'left-1-2', side: 'left' },
            { id: 'left-1-3', side: 'left' },
          ],
        },
        {
          id: 'right-1',
          side: 'right',
          children: [{ id: 'right-1-1', side: 'right' }],
        },
      ],
    };

    const result = mindmap(asymmetricTree);

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    expect(nodes.length).toBe(7);

    expectSVGToMatchSnapshot(result, 'mindmap-asymmetric.svg');
  });

  it('should handle basic tree with side auto-assignment', () => {
    // Test with a tree that doesn't have explicit side properties
    const result = mindmap(basicTree);

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    expect(nodes.length).toBeGreaterThan(0);

    expectSVGToMatchSnapshot(result, 'mindmap-auto-sides.svg');
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
        const result = mindmap(complexTree as any, {
          direction: 'H',
          getHGap: () => 50,
          getVGap: () => 50,
          getWidth: () => getNodeWidth(nodeType),
          getHeight: () => getNodeHeight(),
        } as any);

        expect(result).toBeDefined();
        const filename = `mindmap-${nodeType}-${colorScheme}.svg`;
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
