# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Build & Development

- **Package Manager**: Uses Bun (not npm/yarn) - `bun.lock` present
- **Dev Server**: `bun run dev` (uses Next.js with Turbopack)
- **Type Checking**: `bun run typecheck` (no tests configured yet)
- **Formatting**: `bun run format` - formats only `.ts` and `.tsx` files

## Code Style (Non-Obvious)

- **No semicolons**: Prettier configured with `"semi": false`
- **Double quotes**: Use `"` not `'` for strings
- **Tailwind sorting**: Prettier configured to sort classes in `cn()` and `cva()` functions via `tailwindFunctions` config
- **Import alias**: Use `@/*` for all imports (maps to project root via tsconfig paths)

## UI Components (Critical Differences)

- **Base UI React**: Uses `@base-ui/react` primitives (NOT standard Radix/shadcn primitives)
  - Example: `import { Button as ButtonPrimitive } from "@base-ui/react/button"`
  - Components wrap Base UI primitives, not Radix UI
- **Icon Library**: Uses `@hugeicons/react` (configured in `components.json`)
- **Tailwind v4**: Uses new inline `@theme` syntax and `@custom-variant` in `globals.css`
- **Custom Tailwind Variant**: `in-[.selected]` for React Flow node selection styling (see `components/base-node.tsx`)

## React Flow Integration

- `BaseNode` component in `components/base-node.tsx` provides custom node styling
- Uses `in-[.selected]` variant to style nodes when React Flow adds `.selected` class to parent
- Node components should use `BaseNodeHeader`, `BaseNodeContent`, `BaseNodeFooter` for consistency

## CSS Architecture

- **Import order matters**: `@import "tailwindcss"` → `@import "tw-animate-css"` → `@import "shadcn/tailwind.css"`
- Uses OKLCH color space for all theme colors (not HSL)
- Custom dark mode variant: `@custom-variant dark (&:is(.dark *))`