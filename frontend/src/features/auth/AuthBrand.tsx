import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { styles } from './auth-styles';

export const RankioWordmark = ({ compact = false }: { compact?: boolean }) => (
  <Text style={[styles.brandWordmark, compact && styles.brandWordmarkCompact]}>
    <Text style={styles.rankWord}>RANK</Text>
    <Text style={styles.ioWord}>.io</Text>
  </Text>
);

export const RankioMark = ({ size = 84 }: { size?: number }) => (
  <View style={[styles.markShell, { width: size, height: size }]}>
    <View style={[styles.markCard, styles.markCardOne]} />
    <View style={[styles.markCard, styles.markCardTwo]} />
    <View style={[styles.markCard, styles.markCardThree]} />
    <View style={styles.markBar} />
    <View style={styles.markArrow} />
  </View>
);

export const GoogleMark = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" accessibilityLabel="Google">
    <Path
      fill="#4285F4"
      d="M21.35 11.1h-9.18v3.02h5.29c-.23 1.52-1.78 4.46-5.29 4.46-3.18 0-5.77-2.63-5.77-5.87s2.59-5.87 5.77-5.87c1.81 0 3.02.77 3.71 1.43l2.54-2.47C16.79 4.2 14.83 3.3 12.17 3.3 7.43 3.3 3.6 7.14 3.6 11.9s3.83 8.6 8.57 8.6c4.98 0 8.3-3.5 8.3-8.43 0-.57-.06-.99-.12-1.37z"
    />
    <Path
      fill="#EA4335"
      d="M12.17 6.84c1.31 0 2.49.45 3.42 1.34l2.54-2.47C16.6 4.19 14.65 3.3 12.17 3.3c-3.5 0-6.48 2.01-7.94 4.94l2.95 2.29c.74-2.2 2.8-3.69 4.99-3.69z"
    />
    <Path
      fill="#FBBC05"
      d="M4.23 8.24c-.4 1.2-.63 2.49-.63 3.81s.23 2.61.63 3.81l2.95-2.29c-.18-.48-.29-.99-.29-1.52s.1-1.04.29-1.52L4.23 8.24z"
    />
    <Path
      fill="#34A853"
      d="M12.17 20.5c2.48 0 4.56-.82 6.08-2.23l-2.82-2.18c-.77.52-1.76.82-3.26.82-2.2 0-4.25-1.49-4.99-3.69l-2.95 2.29c1.46 2.93 4.44 4.99 7.94 4.99z"
    />
  </Svg>
);
