import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create theme store
function createThemeStore() {
	// Initialize with system preference or default to dark
	const getInitialTheme = () => {
		if (!browser) return 'dark';

		// Check localStorage first
		const stored = localStorage.getItem('theme');
		if (stored && (stored === 'light' || stored === 'dark')) {
			return stored;
		}

		// Fall back to system preference
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}

		return 'light';
	};

	const { subscribe, set, update } = writable(getInitialTheme());

	return {
		subscribe,
		/** @param {'light' | 'dark'} theme */
		setTheme: (theme) => {
			if (browser) {
				localStorage.setItem('theme', theme);
				// Apply theme class to document
				document.documentElement.classList.remove('light', 'dark');
				document.documentElement.classList.add(theme);
			}
			set(theme);
		},
		toggle: () => {
			update((current) => {
				const newTheme = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', newTheme);
					// Apply theme class to document
					document.documentElement.classList.remove('light', 'dark');
					document.documentElement.classList.add(newTheme);
				}
				return newTheme;
			});
		},
		init: () => {
			if (browser) {
				const theme = getInitialTheme();
				document.documentElement.classList.remove('light', 'dark');
				document.documentElement.classList.add(theme);
				set(theme);
			}
		}
	};
}

export const theme = createThemeStore();
