# Maritime Operations Dashboard - Centralized Theme System

## Overview

The Maritime Operations Dashboard now uses a centralized theme system that provides consistent theming across all components. This system includes:

- **Centralized CSS variables** for colors, gradients, shadows, and transitions
- **TypeScript utilities** for theme management
- **Utility classes** for common theme-aware components
- **Automatic light/dark mode switching** with system preference detection

## File Structure

```
src/
├── lib/
│   ├── styles/
│   │   └── theme.css          # Centralized CSS variables and utility classes
│   └── utils/
│       └── theme.ts           # TypeScript utilities for theme management
└── app.css                    # Imports theme.css
```

## Usage

### 1. Using CSS Custom Properties

The easiest way to use the theme system is through CSS custom properties:

```css
.my-component {
  background: var(--maritime-bg-primary);
  color: var(--maritime-text-primary);
  border: 1px solid var(--maritime-border);
  transition: var(--maritime-transition);
}

.my-component:hover {
  background: var(--maritime-bg-secondary);
  border-color: var(--maritime-border-hover);
}
```

### 2. Using Utility Classes

Pre-built utility classes are available for common patterns:

```svelte
<div class="theme-card">
  <h2 class="theme-text-primary">Card Title</h2>
  <p class="theme-text-secondary">Card content</p>
  <button class="theme-button-primary">Action</button>
</div>
```

### 3. Using TypeScript Utilities

For dynamic theming in JavaScript/TypeScript:

```javascript
import { 
  getCurrentTheme, 
  setTheme, 
  toggleTheme, 
  getStatusColor,
  THEME_VARIABLES 
} from '$lib/utils/theme';

// Get current theme
const theme = getCurrentTheme(); // 'dark' | 'light'

// Toggle theme
const newTheme = toggleTheme();

// Set specific theme
setTheme('light');

// Get status color for incidents
const criticalColor = getStatusColor('critical');
```

## Available Theme Variables

### Background Colors
- `--maritime-bg-primary` - Main background
- `--maritime-bg-secondary` - Secondary background
- `--maritime-bg-tertiary` - Tertiary background
- `--maritime-bg-surface` - Surface elements

### Text Colors
- `--maritime-text-primary` - Primary text
- `--maritime-text-secondary` - Secondary text
- `--maritime-text-muted` - Muted text
- `--maritime-text-accent` - Accent text

### Accent Colors
- `--maritime-accent` - Primary accent
- `--maritime-accent-secondary` - Secondary accent
- `--maritime-accent-hover` - Hover state
- `--maritime-accent-light` - Light variant

### Status Colors
- `--maritime-status-critical` - Critical incidents
- `--maritime-status-high` - High priority
- `--maritime-status-medium` - Medium priority
- `--maritime-status-low` - Low priority
- `--maritime-status-resolved` - Resolved incidents

### Border Colors
- `--maritime-border` - Default borders
- `--maritime-border-hover` - Hover borders
- `--maritime-border-light` - Light borders

### Shadows
- `--maritime-shadow` - Default shadow
- `--maritime-shadow-light` - Light shadow
- `--maritime-shadow-heavy` - Heavy shadow

### Gradients
- `--maritime-gradient-surface` - Surface gradients
- `--maritime-gradient-surface-hover` - Surface hover gradients
- `--maritime-gradient-header` - Header gradients
- `--maritime-gradient-hero` - Hero section gradients
- `--maritime-gradient-button` - Button gradients

### Transitions
- `--maritime-transition` - Standard transition (0.3s)
- `--maritime-transition-fast` - Fast transition (0.2s)
- `--maritime-transition-slow` - Slow transition (0.5s)

### Backdrop Filters
- `--maritime-blur` - Standard blur
- `--maritime-blur-heavy` - Heavy blur

## Utility Classes

### Component Classes
- `.theme-surface` - Theme-aware surface
- `.theme-card` - Theme-aware card
- `.theme-hero` - Hero section styling
- `.theme-button-primary` - Primary button styling

### Text Classes
- `.theme-text-primary` - Primary text color
- `.theme-text-secondary` - Secondary text color
- `.theme-text-muted` - Muted text color

### Status Classes
- `.theme-status-critical` - Critical status color
- `.theme-status-high` - High priority color
- `.theme-status-medium` - Medium priority color
- `.theme-status-low` - Low priority color
- `.theme-status-resolved` - Resolved status color

## TypeScript API

### Functions

#### `getCurrentTheme(): ThemeType`
Returns the current theme ('dark' | 'light').

#### `setTheme(theme: ThemeType): void`
Sets the theme and persists to localStorage.

#### `toggleTheme(): ThemeType`
Toggles between light and dark themes.

#### `getStatusColor(status?: string): string`
Returns the CSS custom property for a status color.

#### `isDarkTheme(): boolean`
Returns true if current theme is dark.

#### `isLightTheme(): boolean`
Returns true if current theme is light.

#### `initializeTheme(): void`
Initializes the theme system (call on app startup).

### Constants

#### `THEME_VARIABLES`
Object containing all CSS custom property references.

#### `THEME_CLASSES`
Object containing utility class names.

#### `STATUS_COLORS`
Mapping of status levels to colors.

## Migration Guide

### From Old Theme System

**Before:**
```css
.component {
  background: #1e293b;
  color: #f8fafc;
}
```

**After:**
```css
.component {
  background: var(--maritime-bg-secondary);
  color: var(--maritime-text-primary);
  transition: var(--maritime-transition);
}
```

### Adding New Theme Variables

1. Add the variable to both light and dark themes in `theme.css`
2. Add the constant to `THEME_VARIABLES` in `theme.ts`
3. Update this documentation

## Best Practices

1. **Always use CSS custom properties** instead of hardcoded colors
2. **Include transitions** for smooth theme switching
3. **Use utility classes** for common patterns
4. **Test both themes** when creating new components
5. **Follow the naming convention** for consistency

## Examples

See `src/lib/components/examples/ThemeExample.svelte` for a complete example of using the centralized theme system.

## Troubleshooting

### Theme not switching
- Ensure `initializeTheme()` is called on app startup
- Check that CSS variables are properly defined
- Verify theme classes are applied to `document.documentElement`

### Colors not updating
- Make sure to use CSS custom properties, not hardcoded values
- Include transition properties for smooth updates
- Check that theme-specific selectors use `:global(.light)` syntax

### TypeScript errors
- Import from `'$lib/utils/theme'` (without .ts extension)
- Use proper types: `ThemeType` and `StatusLevel`
- Ensure the theme utilities are initialized before use