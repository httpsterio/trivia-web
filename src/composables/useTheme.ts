import { ref, watchEffect } from 'vue';
import type { Theme } from '../types';

export function useTheme() {
  const theme = ref<Theme>((localStorage.getItem('toxictype:theme') as Theme) || 'light');

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  };

  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value);
    localStorage.setItem('toxictype:theme', theme.value);
  });

  return {
    theme,
    toggleTheme
  };
}
