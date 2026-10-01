import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, Typography, makeShadows } from '@/constants/theme';
import {
  ONBOARDING_KEY,
  brandPalette,
  googleClientId,
  googleDiscovery,
  onboardingSlides,
  type AuthMode,
  type ViewMode,
} from '@/features/auth/auth-config';
import { GoogleMark, RankioMark, RankioWordmark } from '@/features/auth/AuthBrand';
import { useSession } from '@/hooks/use-session';
import { useTheme } from '@/hooks/use-theme';
import { loginAccount, loginWithGoogle, registerAccount } from '@/services/auth';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const palette = useTheme();
  const session = useSession();
  const shadows = useMemo(() => makeShadows(palette), [palette]);

  const [view, setView] = useState<ViewMode>('splash');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [slideIndex, setSlideIndex] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [splashFade] = useState(() => new Animated.Value(0));
  const [splashScale] = useState(() => new Animated.Value(0.88));
  const [wordFade] = useState(() => new Animated.Value(0));
  const [splashCardOne] = useState(() => new Animated.Value(24));
  const [splashCardTwo] = useState(() => new Animated.Value(30));
  const [splashCardThree] = useState(() => new Animated.Value(36));
  const [splashCardFour] = useState(() => new Animated.Value(42));

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'rankeverything', path: 'auth/callback' }),
      scopes: ['openid', 'profile', 'email'],
      responseType: 'code',
      extraParams: { prompt: 'select_account' },
    },
    googleDiscovery,
  );

  const isLogin = authMode === 'login';
  const currentSlide = onboardingSlides[slideIndex];
  const canSubmit =
    (isLogin
      ? loginIdentifier.trim() && password.trim()
      : name.trim() && email.trim() && handle.trim() && password.trim() && confirmPassword.trim() && agreeToTerms) &&
    !busy;

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (active) {
          setTimeout(() => {
            if (active) {
              setView(seen === 'true' ? 'auth' : 'onboarding');
            }
          }, 2300);
        }
      } catch {
        if (active) {
          setTimeout(() => setView('auth'), 2300);
        }
      }
    };

    Animated.parallel([
      Animated.timing(splashFade, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(splashScale, { toValue: 1, tension: 28, friction: 8, useNativeDriver: true }),
      Animated.timing(wordFade, { toValue: 1, duration: 700, delay: 500, useNativeDriver: true }),
      Animated.stagger(120, [
        Animated.timing(splashCardOne, { toValue: 0, duration: 700, delay: 260, useNativeDriver: true }),
        Animated.timing(splashCardTwo, { toValue: 0, duration: 700, delay: 380, useNativeDriver: true }),
        Animated.timing(splashCardThree, { toValue: 0, duration: 700, delay: 500, useNativeDriver: true }),
        Animated.timing(splashCardFour, { toValue: 0, duration: 700, delay: 620, useNativeDriver: true }),
      ]),
    ]).start();

    void bootstrap();
    return () => {
      active = false;
    };
  }, [splashCardFour, splashCardOne, splashCardThree, splashCardTwo, splashFade, splashScale, wordFade]);

  useEffect(() => {
    if (session.ready && session.handle) {
      router.replace('/');
    }
  }, [router, session.handle, session.ready]);

  useEffect(() => {
    const resolveGoogle = async () => {
      if (!response || response.type !== 'success' || !response.params?.code) {
        return;
      }

      try {
        setBusy(true);
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: googleClientId,
            code: response.params.code,
            redirectUri: AuthSession.makeRedirectUri({ scheme: 'rankeverything', path: 'auth/callback' }),
            extraParams: { code_verifier: request?.codeVerifier ?? '' },
          },
          googleDiscovery,
        );

        const auth = await loginWithGoogle({ accessToken: tokenResult.accessToken });

        await session.signIn(auth.user.handle, auth.token, true);
        await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
        router.replace('/');
      } catch (signInError) {
        setError(signInError instanceof Error ? signInError.message : 'Google sign-in failed.');
      } finally {
        setBusy(false);
      }
    };

    void resolveGoogle();
  }, [request, response, router, session]);

  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setView('auth');
  };

  const submit = async () => {
    if (!canSubmit) {
      setError(isLogin ? 'Add your email or username and password to continue.' : 'Fill in all fields to create your account.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (isLogin) {
        const auth = await loginAccount({
          identifier: loginIdentifier,
          password,
        });
        await session.signIn(auth.user.handle, auth.token, keepLoggedIn);
      } else {
        const auth = await registerAccount({ name, email, handle, password });
        await session.signIn(auth.user.handle, auth.token, true);
      }
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setBusy(true);

    try {
      if (!googleClientId) {
        throw new Error('Google sign-in is not configured.');
      }

      const result = await promptAsync();

      if (result.type !== 'success') {
        throw new Error('Google sign-in was cancelled.');
      }

      if (result.params?.code) {
        return;
      }

      if (!result.authentication?.accessToken) {
        throw new Error('Google sign-in could not be completed.');
      }

      const auth = await loginWithGoogle({ accessToken: result.authentication.accessToken });

      await session.signIn(auth.user.handle, auth.token, true);
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/');
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const renderTextInput = (
    value: string,
    onChangeText: (next: string) => void,
    placeholder: string,
    keyboardType?: 'default' | 'email-address' | 'numeric',
    autoCapitalize?: 'none' | 'sentences' | 'words',
    secure?: boolean,
    showToggle?: boolean,
    visible?: boolean,
    onToggleVisible?: () => void,
  ) => (
    <View style={styles.inputWrap}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        secureTextEntry={secure && !visible}
        placeholderTextColor={brandPalette.secondary}
        onFocus={() => setFocusedField(placeholder)}
        onBlur={() => setFocusedField('')}
        style={[styles.inputField, focusedField === placeholder && styles.inputFieldFocused]}
      />
      {showToggle ? (
        <Pressable onPress={onToggleVisible} hitSlop={10} style={styles.inputIconButton}>
          <MaterialCommunityIcons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={brandPalette.primary} />
        </Pressable>
      ) : null}
    </View>
  );

  if (view === 'splash') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View style={[styles.screen, styles.splashScreen, { opacity: splashFade, backgroundColor: brandPalette.background }]}>
          <View style={styles.splashGlowOne} />
          <View style={styles.splashGlowTwo} />
          <Animated.View style={[styles.splashCardStack, { transform: [{ translateY: splashCardOne }, { translateX: -18 }, { scale: 0.96 }] }]}>
            <View style={styles.splashCardInner} />
          </Animated.View>
          <Animated.View style={[styles.splashCardStack, { transform: [{ translateY: splashCardTwo }, { translateX: 18 }, { scale: 0.98 }] }]}>
            <View style={[styles.splashCardInner, { backgroundColor: 'rgba(255,255,255,0.48)' }]} />
          </Animated.View>
          <Animated.View style={[styles.splashCardStack, { transform: [{ translateY: splashCardThree }, { translateX: 0 }, { scale: 1 }] }]}>
            <View style={[styles.splashCardInner, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
          </Animated.View>
          <Animated.View style={[styles.splashCardStack, { transform: [{ translateY: splashCardFour }, { translateX: 14 }, { scale: 1.02 }] }]}>
            <View style={[styles.splashCardInner, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: splashScale }] }}>
            <RankioMark size={118} />
          </Animated.View>
          <Animated.View style={{ opacity: wordFade, alignItems: 'center' }}>
            <RankioWordmark />
            <Text style={styles.motto}>YOUR TASTE, RANKED.</Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (view === 'onboarding') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.onboardingScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.bgDecor} pointerEvents="none">
              <View style={[styles.orb, styles.orbOne]} />
              <View style={[styles.orb, styles.orbTwo]} />
              <View style={styles.softCardA} />
              <View style={styles.softCardB} />
              <View style={styles.softCardC} />
            </View>

            <View style={styles.onboardingTop}>
              <View style={styles.brandPill}>
                <RankioWordmark compact />
              </View>
            </View>

            <View style={[styles.slideCard, { borderColor: currentSlide.accent + '33' }]}>
              <View style={[styles.slideGlow, { backgroundColor: currentSlide.accent + '1A' }]} />
              <Text style={styles.slideTitle}>{currentSlide.title}</Text>
              <Text style={styles.slideSubtitle}>{currentSlide.subtitle}</Text>
            </View>

            <View style={styles.dotRow}>
              {onboardingSlides.map((slide, index) => (
                <Pressable
                  key={slide.title}
                  onPress={() => setSlideIndex(index)}
                  style={[styles.dot, slideIndex === index && { width: 28, backgroundColor: slide.accent }]}
                />
              ))}
            </View>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: currentSlide.accent }]}
              onPress={() => {
                if (slideIndex === onboardingSlides.length - 1) {
                  void finishOnboarding();
                  return;
                }
                setSlideIndex((current) => Math.min(current + 1, onboardingSlides.length - 1));
              }}
            >
              <Text style={styles.primaryButtonText}>{slideIndex === onboardingSlides.length - 1 ? 'Get started' : 'Next'}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: brandPalette.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.authScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.bgDecor} pointerEvents="none">
            <View style={[styles.orb, styles.orbOne]} />
            <View style={[styles.orb, styles.orbTwo]} />
            <View style={[styles.orb, styles.orbThree]} />
            <View style={[styles.orb, styles.orbFour]} />
            <View style={styles.softCardA} />
            <View style={styles.softCardB} />
            <View style={styles.softCardC} />
          </View>

          <View style={styles.authContainer}>
            <View style={styles.logoLockup}>
              <RankioMark size={64} />
              <RankioWordmark />
              <Text style={styles.productTagline}>Rank what you love. Share what you think.</Text>
            </View>

            <View style={[styles.authCard, shadows.card]}>
              <View style={styles.authHeader}>
                <Text style={styles.heroTitle}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
                <Text style={styles.heroSubtitle}>
                  {isLogin ? 'Sign in to continue ranking your favorites.' : 'Join RANK.io and start ranking what you love.'}
                </Text>
              </View>

              <View style={styles.modeRow}>
                <Pressable
                  onPress={() => setAuthMode('login')}
                  style={[styles.modeButton, isLogin && styles.modeButtonActive]}
                >
                  <Text style={[styles.modeText, isLogin && styles.modeTextActive]}>Login</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAuthMode('register')}
                  style={[styles.modeButton, !isLogin && styles.modeButtonActive]}
                >
                  <Text style={[styles.modeText, !isLogin && styles.modeTextActive]}>Register</Text>
                </Pressable>
              </View>

              {!isLogin && (
                renderTextInput(name, (next) => {
                  setName(next);
                  if (error) setError('');
                }, 'Full name', 'default', 'words')
              )}

              {isLogin
                ? renderTextInput(
                    loginIdentifier,
                    (next) => {
                      setLoginIdentifier(next);
                      if (error) setError('');
                    },
                    'Email or Username',
                    'default',
                    'none',
                  )
                : renderTextInput(
                    email,
                    (next) => {
                      setEmail(next);
                      if (error) setError('');
                    },
                    'Email',
                    'email-address',
                    'none',
                  )}

              {!isLogin && (
                renderTextInput(
                  handle,
                  (next) => {
                    setHandle(next);
                    if (error) setError('');
                  },
                  'Handle / Username',
                  'default',
                  'none',
                )
              )}

              {isLogin
                ? renderTextInput(
                    password,
                    (next) => {
                      setPassword(next);
                      if (error) setError('');
                    },
                      'Password',
                    'default',
                    'none',
                    true,
                    true,
                    showPassword,
                    () => setShowPassword((current) => !current),
                  )
                : renderTextInput(
                    password,
                    (next) => {
                      setPassword(next);
                      if (error) setError('');
                    },
                    'Password',
                    'default',
                    'none',
                    true,
                    true,
                    showRegisterPassword,
                    () => setShowRegisterPassword((current) => !current),
                  )}

              {!isLogin && (
                renderTextInput(
                  confirmPassword,
                  (next) => {
                    setConfirmPassword(next);
                    if (error) setError('');
                  },
                  'Confirm Password',
                  'default',
                  'none',
                  true,
                  true,
                  showConfirmPassword,
                  () => setShowConfirmPassword((current) => !current),
                )
              )}

              {isLogin && (
                <View style={styles.rowBetween}>
                  <Pressable onPress={() => setKeepLoggedIn((current) => !current)} style={styles.checkboxRow}>
                    <View style={[styles.toggle, keepLoggedIn && styles.toggleOn]}>
                      <View style={[styles.toggleThumb, keepLoggedIn && styles.toggleThumbOn]} />
                    </View>
                    <Text style={styles.helperText}>Remember me</Text>
                  </Pressable>

                  <Pressable onPress={() => setError('Password reset is not available yet.')}>
                    <Text style={styles.linkText}>Forgot password?</Text>
                  </Pressable>
                </View>
              )}

              {!isLogin && (
                <Pressable onPress={() => setAgreeToTerms((current) => !current)} style={styles.checkboxRowTerms}>
                  <View style={[styles.termsCheck, agreeToTerms && styles.termsCheckActive]}>
                    {agreeToTerms && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.helperText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </Pressable>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable onPress={handleGoogleSignIn} style={({ pressed }) => [styles.socialButton, pressed && styles.buttonPressed]}>
                <GoogleMark />
                <Text style={styles.socialButtonText}>Continue with Google</Text>
              </Pressable>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠ {error}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={submit}
                disabled={busy || !canSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  (busy || !canSubmit) && styles.primaryButtonDisabled,
                  pressed && canSubmit && styles.primaryButtonPressed,
                ]}
              >
                {busy ? (
                  <View style={styles.buttonLoadingRow}>
                    <ActivityIndicator size="small" color={brandPalette.primary} />
                    <Text style={[styles.primaryButtonText, styles.primaryButtonTextDisabled]}>
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.primaryButtonText, (!canSubmit || busy) && styles.primaryButtonTextDisabled]}>
                    {isLogin ? 'Sign In →' : 'Create Account →'}
                  </Text>
                )}
              </Pressable>

              <Text style={styles.footerText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text onPress={() => setAuthMode(isLogin ? 'register' : 'login')} style={styles.footerLink}>
                  {isLogin ? 'Create one' : 'Sign In'}
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandPalette.background,
  },
  splashScreen: {
    gap: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  splashCardStack: {
    position: 'absolute',
    width: 116,
    height: 76,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.10)',
    shadowColor: '#2864F0',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashCardInner: {
    width: '72%',
    height: '52%',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.14)',
  },
  splashGlowOne: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(61, 123, 255, 0.15)',
  },
  splashGlowTwo: {
    position: 'absolute',
    right: -50,
    bottom: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(40, 100, 240, 0.12)',
  },
  logoMark: {
    width: 118,
    height: 118,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2864F0',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  brandName: {
    ...Typography.display,
    fontSize: 30,
    color: '#101B3A',
    letterSpacing: 1.4,
    fontWeight: '800',
    textAlign: 'center',
  },
  brandNameSmall: {
    ...Typography.subheading,
    color: '#101B3A',
    letterSpacing: 1.8,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
  motto: {
    ...Typography.caption,
    letterSpacing: 1.5,
    color: '#64708A',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  authContainer: {
    width: '100%',
    maxWidth: 440,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  logoLockup: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  productTagline: {
    ...Typography.caption,
    color: '#72809A',
    textAlign: 'center',
    marginTop: 2,
  },
  topBrand: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.08)',
  },
  authCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 22,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.12)',
    gap: Spacing.md,
  },
  authHeader: {
    gap: Spacing.xs,
  },
  heroTitle: {
    ...Typography.title,
    color: '#101B3A',
    fontWeight: '800',
  },
  heroSubtitle: {
    ...Typography.body,
    color: '#64708A',
    lineHeight: 22,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#EDF4FF',
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: Spacing.md,
  },
  modeButtonActive: {
    backgroundColor: '#2864F0',
  },
  modeText: {
    ...Typography.bodyStrong,
    color: '#101B3A',
  },
  modeTextActive: {
    color: '#ffffff',
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputField: {
    ...Typography.body,
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE4F0',
    backgroundColor: '#FBFCFF',
    paddingHorizontal: Spacing.lg,
    paddingRight: 48,
    color: '#101B3A',
  },
  inputFieldFocused: {
    borderColor: '#2864F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2864F0',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  inputIconButton: {
    position: 'absolute',
    right: 14,
    top: 17,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxRowTerms: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  toggle: {
    width: 30,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#dfe9ff',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: '#2864F0',
  },
  toggleThumb: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  helperText: {
    ...Typography.caption,
    color: '#64708A',
  },
  linkText: {
    ...Typography.caption,
    color: '#2864F0',
    fontWeight: '700',
  },
  termsLink: {
    ...Typography.caption,
    color: '#2864F0',
    fontWeight: '700',
  },
  termsCheck: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.25)',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsCheckActive: {
    backgroundColor: '#2864F0',
    borderColor: '#2864F0',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0E4EA',
    paddingVertical: Spacing.md,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  socialButtonText: {
    ...Typography.bodyStrong,
    color: '#101B3A',
  },
  primaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2864F0',
    shadowColor: '#2864F0',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryButtonDisabled: {
    backgroundColor: '#EAF1FF',
    shadowOpacity: 0,
  },
  primaryButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    ...Typography.bodyStrong,
    color: '#fff',
  },
  primaryButtonTextDisabled: {
    color: '#2864F0',
  },
  buttonLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6EAF1',
  },
  dividerText: {
    ...Typography.caption,
    color: '#8A94A8',
  },
  errorBox: {
    backgroundColor: '#FFF2F3',
    borderWidth: 1,
    borderColor: '#F2C3C9',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: '#A13A46',
  },
  footerText: {
    ...Typography.caption,
    textAlign: 'center',
    color: '#64708A',
  },
  footerLink: {
    color: '#2864F0',
    fontWeight: '700',
  },
  onboardingScroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
    gap: Spacing.lg,
    position: 'relative',
  },
  onboardingTop: {
    alignItems: 'center',
  },
  brandPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.10)',
  },
  slideCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 28,
    borderWidth: 1,
    padding: Spacing.xl,
    minHeight: 240,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  slideGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  slideTitle: {
    ...Typography.title,
    color: '#101B3A',
    marginBottom: Spacing.sm,
  },
  slideSubtitle: {
    ...Typography.body,
    color: '#64708A',
    maxWidth: 280,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#c7d8ff',
  },
  bgDecor: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(61, 123, 255, 0.08)',
  },
  orbOne: {
    width: 220,
    height: 220,
    top: -60,
    left: -30,
  },
  orbTwo: {
    width: 300,
    height: 300,
    right: -80,
    top: 80,
  },
  orbThree: {
    width: 180,
    height: 180,
    left: -40,
    bottom: 90,
  },
  orbFour: {
    width: 220,
    height: 220,
    right: -50,
    bottom: -40,
  },
  softCardA: {
    position: 'absolute',
    width: 110,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.32)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.12)',
    right: 28,
    top: 160,
    transform: [{ rotate: '12deg' }],
  },
  softCardB: {
    position: 'absolute',
    width: 130,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(222,234,255,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.12)',
    left: 22,
    bottom: 120,
    transform: [{ rotate: '-10deg' }],
  },
  softCardC: {
    position: 'absolute',
    width: 96,
    height: 62,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderWidth: 1,
    borderColor: 'rgba(40,100,240,0.10)',
    right: 70,
    bottom: 68,
    transform: [{ rotate: '9deg' }],
  },
});
