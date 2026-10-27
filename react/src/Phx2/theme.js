import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

// Phoenix 2 look: piugame.com's green rgb(4, 164, 35) (#04A423, phx2.500) on its near-black
// background (#1A1B1E). Used as colorPalette="phx2".
const config = defineConfig({
    theme: {
        tokens: {
            // piugame.com's own text font (Phx2.css loads it)
            fonts: {
                body: { value: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
                heading: { value: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif" },
            },
            colors: {
                phx2: {
                    50: { value: '#edfdf0' },
                    100: { value: '#d3f9da' },
                    200: { value: '#a8f0b5' },
                    300: { value: '#6fe286' },
                    400: { value: '#34c853' },
                    500: { value: '#04a423' },
                    600: { value: '#038a1d' },
                    700: { value: '#036f18' },
                    800: { value: '#055a15' },
                    900: { value: '#064a13' },
                    950: { value: '#022a09' },
                },
            },
        },
        semanticTokens: {
            colors: {
                phx2: {
                    // the piugame green itself for fills and for green text/lines on the dark background
                    solid: { value: { _light: '{colors.phx2.500}', _dark: '{colors.phx2.500}' } },
                    contrast: { value: { _light: '{colors.white}', _dark: '{colors.white}' } },
                    fg: { value: { _light: '{colors.phx2.700}', _dark: '{colors.phx2.500}' } },
                    subtle: { value: { _light: '{colors.phx2.100}', _dark: '{colors.phx2.950}' } },
                    muted: { value: { _light: '{colors.phx2.200}', _dark: '{colors.phx2.900}' } },
                    emphasized: { value: { _light: '{colors.phx2.300}', _dark: '{colors.phx2.800}' } },
                    focusRing: { value: { _light: '{colors.phx2.500}', _dark: '{colors.phx2.500}' } },
                    border: { value: { _light: '{colors.phx2.300}', _dark: '{colors.phx2.600}' } },
                },
                // piugame.com's dark background instead of pure black
                bg: {
                    DEFAULT: { value: { _light: '{colors.white}', _dark: '#1a1b1e' } },
                    subtle: { value: { _light: '{colors.gray.50}', _dark: '#141518' } },
                    panel: { value: { _light: '{colors.white}', _dark: '#222327' } },
                },
            },
        },
    },
});

const system = createSystem(defaultConfig, config);

export default system;
