import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';

export function ProductVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <View style={styles.wrap}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls
        allowsFullscreen
      />
      <Text style={styles.label}>Video giới thiệu</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 4,
    backgroundColor: Colors.black,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.black,
  },
  label: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: Colors.overlay,
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
});