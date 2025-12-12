import { describe, it, expect } from 'vitest';
import { compactBox } from '../src/index';
import { expectSVGToMatchSnapshot, collectNodes } from './utils/svg-generator';
import basicTree from './fixtures/basic-tree.json';

describe('CompactBox Layout', () => {
  it('should layout a basic tree structure', () => {
    const result = compactBox(basicTree);

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
    expectSVGToMatchSnapshot(result, 'compact-box-basic.svg');
  });

  it('should layout with different directions', () => {
    const directions = ['TB', 'BT', 'LR', 'RL'] as const;

    directions.forEach((direction) => {
      const result = compactBox(basicTree, { direction });

      expect(result).toBeDefined();
      const nodes = collectNodes(result);
      expect(nodes.length).toBeGreaterThan(0);

      // Generate SVG for each direction
      expectSVGToMatchSnapshot(result, `compact-box-${direction}.svg`);
    });
  });

  it('should respect node sizes', () => {
    const treeWithSizes = {
      id: 'root',
      width: 100,
      height: 50,
      children: [
        { id: 'c1', width: 80, height: 40 },
        { id: 'c2', width: 80, height: 40 },
      ],
    };

    const result = compactBox(treeWithSizes, {
      getWidth: (node) => (node?.data?.width as number) || 50,
      getHeight: (node) => (node?.data?.height as number) || 20,
    });

    expect(result).toBeDefined();
    expectSVGToMatchSnapshot(result, 'compact-box-sizes.svg');
  });

  it('should handle spacing configuration', () => {
    const result = compactBox(basicTree, {
      getHGap: () => 50,
      getVGap: () => 30,
    });

    expect(result).toBeDefined();

    // Check that siblings have proper spacing
    const nodes = collectNodes(result);
    expect(nodes.length).toBeGreaterThan(0);

    expectSVGToMatchSnapshot(result, 'compact-box-spacing.svg');
  });

  it('should handle deep tree structures', () => {
    const deepTree = {
      id: 'root',
      children: [
        {
          id: 'c1',
          children: [
            {
              id: 'c1-1',
              children: [
                {
                  id: 'c1-1-1',
                  children: [{ id: 'c1-1-1-1' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const result = compactBox(deepTree);

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    expect(nodes.length).toBe(5);

    expectSVGToMatchSnapshot(result, 'compact-box-deep.svg');
  });

  it('should handle single node tree', () => {
    const singleNode = { id: 'root' };
    const result = compactBox(singleNode);

    expect(result).toBeDefined();
    expect(result.data.id).toBe('root');
    expect(result.x).toBeDefined();
    expect(result.y).toBeDefined();
  });

  it('should preserve data properties', () => {
    const treeWithData = {
      id: 'root',
      customProp: 'custom value',
      children: [{ id: 'child', anotherProp: 123 }],
    };

    const result = compactBox(treeWithData);

    expect(result.data.customProp).toBe('custom value');
    expect(result.children![0].data.anotherProp).toBe(123);
  });
});
