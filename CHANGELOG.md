# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Full TypeScript support with comprehensive type definitions
- Modern build system using Vite
- ES module format support
- Type declaration files (.d.ts) for better IDE support
- TypeScript examples in README

### Changed
- **BREAKING**: Package now uses ES modules by default (set `"type": "module"`)
- Migrated entire codebase from JavaScript to TypeScript
- Replaced Webpack with Vite for faster builds
- Replaced Babel with native TypeScript compiler
- Updated build output structure:
  - `dist/hierarchy.es.js` - ES module format
  - `dist/hierarchy.umd.js` - UMD format
  - `lib/*.d.ts` - TypeScript declarations
- Improved package.json exports for better module resolution
- Updated README with TypeScript usage examples

### Removed
- Webpack build system and configuration
- Babel transpilation
- ESLint configuration (to be replaced with modern linting later)
- UglifyJS (replaced with Vite's built-in Terser)
- 664 obsolete npm packages from dependencies

### Performance
- Reduced bundle size: 9.88 kB (ES) / 10.19 kB (UMD)
- Gzipped size: ~3.8 kB
- Faster build times with Vite
- Tree-shakeable ES module exports

### Developer Experience
- Full IntelliSense support in TypeScript and JavaScript projects
- Better error detection at compile time
- Source maps included for easier debugging
- Cleaner dependency tree (15 dev dependencies vs 24 previously)

## [0.6.14] - Previous versions
See git history for previous changes.
