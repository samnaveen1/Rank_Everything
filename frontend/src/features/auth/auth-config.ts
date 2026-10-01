export const ONBOARDING_KEY = 'rankio:seen-onboarding';

export const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};

export const brandPalette = {
  background: '#F7F9FF',
  backgroundSoft: '#EEF4FF',
  panel: 'rgba(255,255,255,0.82)',
  panelStrong: '#FFFFFF',
  border: 'rgba(40, 100, 240, 0.15)',
  borderStrong: 'rgba(23, 70, 209, 0.28)',
  primary: '#2864F0',
  primaryBright: '#3D7BFF',
  primaryDeep: '#1746D1',
  primarySoft: '#EAF1FF',
  white: '#FFFFFF',
  navy: '#101B3A',
  secondary: '#64708A',
  gold: '#F2B84B',
  shadow: 'rgba(25, 62, 170, 0.16)',
} as const;

export const onboardingSlides = [
  {
    title: 'Curate your taste',
    subtitle: 'Capture what matters to you and turn every rating into a personal signal.',
    accent: '#2864F0',
  },
  {
    title: 'Discover smarter',
    subtitle: 'Find the best books, films, games, restaurants, and more from people who think like you.',
    accent: '#3D7BFF',
  },
  {
    title: 'Rank with intent',
    subtitle: 'Build a profile that reflects your actual taste, not a generic recommendation feed.',
    accent: '#1746D1',
  },
] as const;

export type ViewMode = 'splash' | 'onboarding' | 'auth';
export type AuthMode = 'login' | 'register';
