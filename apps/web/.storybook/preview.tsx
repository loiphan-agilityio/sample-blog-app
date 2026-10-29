import '../src/styles/index.css';

import type { Preview } from '@storybook/react-vite';

import { StoryProviders } from './story-providers';

const preview: Preview = {
  decorators: [
    (Story) => (
      <StoryProviders>
        <Story />
      </StoryProviders>
    ),
  ],
};

export default preview;
