import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  addons: ['@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // Serves public/ (icons, the web manifest) to the stories, as the app does.
  staticDirs: ['../public'],
};

export default config;
