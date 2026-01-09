import { describe, it, expect } from 'vitest';
import { dendrogram } from '../src/index';
import { expectSVGToMatchSnapshot, expectStyledSVGToMatchSnapshot, collectNodes } from './utils/svg-generator';
import complexTree from './fixtures/complex-tree.json';
import basicTree from './fixtures/basic-tree.json';

describe('Dendrogram Layout', () => {
  it('should layout a basic tree structure', () => {
    const result = dendrogram(basicTree);

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

    // Snapshot test: compare with saved SVG
    expectSVGToMatchSnapshot(result, 'dendrogram-basic.svg');
  });

  it('should layout with different directions', () => {
    const directions = ['TB', 'BT', 'LR', 'RL'] as const;

    directions.forEach((direction) => {
      const result = dendrogram(basicTree, { direction });

      expect(result).toBeDefined();
      const nodes = collectNodes(result);
      expect(nodes.length).toBeGreaterThan(0);

      // Snapshot test for each direction
      expectSVGToMatchSnapshot(result, `dendrogram-${direction}.svg`);
    });
  });

  it('should handle node sizes', () => {
    const result = dendrogram(basicTree, {
      nodeSep: 20,
      rankSep: 100,
    });

    expect(result).toBeDefined();
    expectSVGToMatchSnapshot(result, 'dendrogram-spacing.svg');
  });

  it('should handle radial layout', () => {
    const result = dendrogram(basicTree, {
      radial: true,
    });

    expect(result).toBeDefined();
    const nodes = collectNodes(result);
    nodes.forEach((node) => {
      expect(node.x).toBeDefined();
      expect(node.y).toBeDefined();
    });

    expectSVGToMatchSnapshot(result, 'dendrogram-radial.svg');
  });

  it('should calculate proper depths', () => {
    const result = dendrogram(basicTree);

    expect(result.depth).toBe(0);

    const nodes = collectNodes(result);
    const leaf = nodes.find((n) => !n.children || n.children.length === 0);
    if (leaf) {
      expect(leaf.depth).toBeGreaterThan(0);
    }
  });

  it('should handle wide tree structures', () => {
    const wideTree = {
      id: 'root',
      children: Array.from({ length: 10 }, (_, i) => ({
        id: `child-${i}`,
      })),
    };

    const result = dendrogram(wideTree);

    expect(result).toBeDefined();
    expect(result.children?.length).toBe(10);

    expectSVGToMatchSnapshot(result, 'dendrogram-wide.svg');
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
        const result = dendrogram(complexTree as any, {
          direction: 'TB',
          getHGap: () => 50,
          getVGap: () => 50,
          getWidth: () => getNodeWidth(nodeType),
          getHeight: () => getNodeHeight(),
        } as any);

        expect(result).toBeDefined();
        const filename = `dendrogram-${nodeType}-${colorScheme}.svg`;
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
