// lib/fonts.ts
import { Be_Vietnam_Pro as BeVietnamPro } from 'next/font/google';

export const beVietnamPro = BeVietnamPro({
  weight: ['400', '500', '600', '700'],
  subsets: ['vietnamese', 'latin'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
});