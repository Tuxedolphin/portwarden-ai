/**
 * Maritime Operations Dashboard - Theme Utilities
 * Centralized theme management and utility functions
 */

// Type definitions
export type ThemeType = 'dark' | 'light';
export type StatusLevel = 'critical' | 'high' | 'medium' | 'low' | 'resolved';

// Theme constants and configuration
export const THEME_CONFIG = {
	STORAGE_KEY: 'maritime-theme',
	THEMES: {
		DARK: 'dark' as const,
		LIGHT: 'light' as const
	},
	DEFAULT_THEME: 'dark' as const
} as const;

// CSS custom property mappings for theme variables
export const THEME_VARIABLES = {
	// Background colors
	BG_PRIMARY: 'var(--maritime-bg-primary)',
	BG_SECONDARY: 'var(--maritime-bg-secondary)',
	BG_TERTIARY: 'var(--maritime-bg-tertiary)',
	BG_SURFACE: 'var(--maritime-bg-surface)',

	// Text colors
	TEXT_PRIMARY: 'var(--maritime-text-primary)',
	TEXT_SECONDARY: 'var(--maritime-text-secondary)',
	TEXT_MUTED: 'var(--maritime-text-muted)',
	TEXT_ACCENT: 'var(--maritime-text-accent)',

	// Accent colors
	ACCENT: 'var(--maritime-accent)',
	ACCENT_SECONDARY: 'var(--maritime-accent-secondary)',
	ACCENT_HOVER: 'var(--maritime-accent-hover)',
	ACCENT_LIGHT: 'var(--maritime-accent-light)',

	// Border colors
	BORDER: 'var(--maritime-border)',
	BORDER_HOVER: 'var(--maritime-border-hover)',
	BORDER_LIGHT: 'var(--maritime-border-light)',

	// Shadow values
	SHADOW: 'var(--maritime-shadow)',
	SHADOW_LIGHT: 'var(--maritime-shadow-light)',
	SHADOW_HEAVY: 'var(--maritime-shadow-heavy)',

	// Status colors
	STATUS_CRITICAL: 'var(--maritime-status-critical)',
	STATUS_HIGH: 'var(--maritime-status-high)',
	STATUS_MEDIUM: 'var(--maritime-status-medium)',
	STATUS_LOW: 'var(--maritime-status-low)',
	STATUS_RESOLVED: 'var(--maritime-status-resolved)',

	// Gradients
	GRADIENT_SURFACE: 'var(--maritime-gradient-surface)',
	GRADIENT_SURFACE_HOVER: 'var(--maritime-gradient-surface-hover)',
	GRADIENT_HEADER: 'var(--maritime-gradient-header)',
	GRADIENT_HERO: 'var(--maritime-gradient-hero)',
	GRADIENT_BUTTON: 'var(--maritime-gradient-button)',

	// Transitions
	TRANSITION: 'var(--maritime-transition)',
	TRANSITION_FAST: 'var(--maritime-transition-fast)',
	TRANSITION_SLOW: 'var(--maritime-transition-slow)',

	// Backdrop filters
	BLUR: 'var(--maritime-blur)',
	BLUR_HEAVY: 'var(--maritime-blur-heavy)'
} as const;

// Status level to color mapping
export const STATUS_COLORS: Record<StatusLevel, string> = {
	critical: THEME_VARIABLES.STATUS_CRITICAL,
	high: THEME_VARIABLES.STATUS_HIGH,
	medium: THEME_VARIABLES.STATUS_MEDIUM,
	low: THEME_VARIABLES.STATUS_LOW,
	resolved: THEME_VARIABLES.STATUS_RESOLVED
} as const;

// Common CSS class names for theme-aware components
export const THEME_CLASSES = {
	SURFACE: 'theme-surface',
	TEXT_PRIMARY: 'theme-text-primary',
	TEXT_SECONDARY: 'theme-text-secondary',
	TEXT_MUTED: 'theme-text-muted',
	BUTTON_PRIMARY: 'theme-button-primary',
	CARD: 'theme-card',
	HERO: 'theme-hero'
} as const;

/**
 * Get the current theme from localStorage or system preference
 */
export function getCurrentTheme(): ThemeType {
	if (typeof window === 'undefined') return THEME_CONFIG.DEFAULT_THEME;

	const stored = localStorage.getItem(THEME_CONFIG.STORAGE_KEY);
	if (stored && Object.values(THEME_CONFIG.THEMES).includes(stored as ThemeType)) {
		return stored as ThemeType;
	}

	// Check system preference
	if (window.matchMedia('(prefers-color-scheme: light)').matches) {
		return THEME_CONFIG.THEMES.LIGHT;
	}

	return THEME_CONFIG.DEFAULT_THEME;
}

/**
 * Set theme and persist to localStorage
 */
export function setTheme(theme: ThemeType): void {
	if (typeof window === 'undefined') return;

	if (!Object.values(THEME_CONFIG.THEMES).includes(theme)) {
		console.warn(`Invalid theme: ${theme}. Using default.`);
		theme = THEME_CONFIG.DEFAULT_THEME;
	}

	localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
	applyThemeToDocument(theme);
}

/**
 * Apply theme class to document
 */
export function applyThemeToDocument(theme: ThemeType): void {
	if (typeof document === 'undefined') return;

	// Remove all theme classes
	Object.values(THEME_CONFIG.THEMES).forEach((t) => {
		document.documentElement.classList.remove(t);
	});

	// Add current theme class
	document.documentElement.classList.add(theme);

	// Force background color change with inline styles as backup
	if (theme === 'light') {
		document.documentElement.style.backgroundColor = '#f8fafc';
		document.body.style.backgroundColor = '#f8fafc';
		document.body.style.color = '#0f172a';
	} else {
		document.documentElement.style.backgroundColor = '#0a0f1c';
		document.body.style.backgroundColor = '#0a0f1c';
		document.body.style.color = '#f8fafc';
	}

	// Debug logging
	console.log(`Theme applied: ${theme}`, document.documentElement.classList.toString());
}

/**
 * Toggle between light and dark themes
 */
export function toggleTheme(): ThemeType {
	const current = getCurrentTheme();
	const newTheme =
		current === THEME_CONFIG.THEMES.DARK ? THEME_CONFIG.THEMES.LIGHT : THEME_CONFIG.THEMES.DARK;

	setTheme(newTheme);
	return newTheme;
}

/**
 * Get status color for a given incident severity
 */
export function getStatusColor(status?: string): string {
	if (!status) return THEME_VARIABLES.TEXT_MUTED;
	const normalizedStatus = status.toLowerCase() as StatusLevel;
	return STATUS_COLORS[normalizedStatus] || THEME_VARIABLES.TEXT_MUTED;
}

/**
 * Generate inline styles object using theme variables
 */
export function createThemeStyles(styles: Record<string, string>): Record<string, string> {
	const themeStyles: Record<string, string> = {};

	Object.entries(styles).forEach(([property, value]) => {
		// If value is a theme variable key, convert it
		if (typeof value === 'string' && value in THEME_VARIABLES) {
			themeStyles[property] = THEME_VARIABLES[value as keyof typeof THEME_VARIABLES];
		} else {
			themeStyles[property] = value;
		}
	});

	return themeStyles;
}

/**
 * Check if current theme is dark
 */
export function isDarkTheme(): boolean {
	return getCurrentTheme() === THEME_CONFIG.THEMES.DARK;
}

/**
 * Check if current theme is light
 */
export function isLightTheme(): boolean {
	return getCurrentTheme() === THEME_CONFIG.THEMES.LIGHT;
}

/**
 * Initialize theme system
 */
export function initializeTheme(): void {
	if (typeof window === 'undefined') return;

	const theme = getCurrentTheme();
	applyThemeToDocument(theme);

	// Listen for system theme changes
	window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
		// Only auto-switch if no manual preference is stored
		if (!localStorage.getItem(THEME_CONFIG.STORAGE_KEY)) {
			const newTheme = e.matches ? THEME_CONFIG.THEMES.LIGHT : THEME_CONFIG.THEMES.DARK;
			applyThemeToDocument(newTheme);
		}
	});
}
