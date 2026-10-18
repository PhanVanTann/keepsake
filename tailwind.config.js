/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#E9ECEF',
        paper: '#FFFFFF',
        chip: '#EEF0F2',
        chip2: '#DADEE3',
        ink: '#16181C',
        muted: '#5B616B',
        placeholder: '#6B717B',
        line: '#CDD2D8',
        dot: '#B7BCC4',
        red: {
          DEFAULT: '#D93A2B',
          dark: '#B42E21',
          bg: '#FBE9E7',
        },
        green: {
          DEFAULT: '#1F7A4D',
          bg: '#E3F1E9',
        },
        yellow: '#F2B544',
      },
      fontFamily: {
        display: ['BeVietnamPro_400Regular'],
        'display-medium': ['BeVietnamPro_500Medium'],
        'display-semibold': ['BeVietnamPro_600SemiBold'],
        'display-bold': ['BeVietnamPro_700Bold'],
        'display-extrabold': ['BeVietnamPro_800ExtraBold'],
        mono: ['JetBrainsMono_500Medium'],
        'mono-bold': ['JetBrainsMono_700Bold'],
        'mono-extrabold': ['JetBrainsMono_800ExtraBold'],
      },
      borderRadius: {
        receipt: '4px',
        card: '10px',
        input: '12px',
        frame: '6px',
      },
    },
  },
  plugins: [],
};
