
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  colorScheme: 'dark',
  primaryColor: 'pink',

  colors: {
    dark: [
      '#FFFFFF',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B2E',
      '#141517',
      '#101113',
    ],
  },

  fontFamily: 'Poppins, sans-serif',

  radius: {
    sm: 8,
    md: 12,
    lg: 20,
  },

  components: {
    Button: {
      defaultProps: {
        radius: 'lg',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
      },
    },
  },
});
