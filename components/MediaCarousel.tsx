/**
 * Carousel media kiểu Shopee: ảnh + video nằm chung một slider ngang.
 * - Slide video đứng đầu, hiển thị poster + nút play; bấm vào mới phát inline.
 * - Vuốt sang slide khác sẽ tự tạm dừng video.
 */
import { Play, Video } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { DEFAULT_PRODUCT_IMAGE } from '@/constants/config';

type Slide = { type: 'image'; uri: string } | { type: 'video' };

interface MediaCarouselProps {
  images: string[];
  video?: string | null;
  height?: number;
}

export function MediaCarousel({ images, video, height = 300 }: MediaCarouselProps) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const baseImages = useMemo(
    () => (images?.length ? images : [DEFAULT_PRODUCT_IMAGE]),
    [images],
  );
  // Shopee đặt video ở slide đầu tiên
  const slides = useMemo<Slide[]>(
    () =>
      video
        ? [{ type: 'video' }, ...baseImages.map((uri) => ({ type: 'image' as const, uri }))]
        : baseImages.map((uri) => ({ type: 'image' as const, uri })),
    [video, baseImages],
  );

  const player = useVideoPlayer(video ?? null, (p) => {
    p.loop = true;
  });

  // Rời khỏi slide video -> tự dừng phát, quay lại trạng thái poster
  useEffect(() => {
    if (slides[index]?.type !== 'video') {
      player.pause();
      setPlaying(false);
    }
  }, [index, player, slides]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    setIndex(viewableItems[0]?.index ?? 0);
  }).current;

  const handlePlay = useCallback(() => {
    player.play();
    setPlaying(true);
  }, [player]);

  const renderItem = useCallback(
    ({ item }: { item: Slide }) =>
      item.type === 'image' ? (
        <Image
          source={{ uri: item.uri }}
          style={{ width, height }}
          contentFit="cover"
          transition={150}
        />
      ) : playing ? (
        <VideoView
          player={player}
          style={{ width, height }}
          contentFit="contain"
          nativeControls
          fullscreenOptions={{ enable: true }}
        />
      ) : (
        <Pressable style={[styles.videoSlide, { width, height }]} onPress={handlePlay}>
          <Image
            source={{ uri: baseImages[0] }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
          <View style={styles.videoDim} />
          <View style={styles.playButton}>
            <Play size={34} color={Colors.white} fill={Colors.white} />
          </View>
        </Pressable>
      ),
    [width, height, playing, player, handlePlay, baseImages],
  );

  return (
    <View style={{ height }}>
      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={renderItem}
      />

      {/* Badge "Video" góc trên trái */}
      {video ? (
        <View style={styles.videoTag}>
          <Video size={12} color={Colors.white} />
          <Text style={styles.videoTagText}>Video</Text>
        </View>
      ) : null}

      {/* Bộ đếm trang kiểu Shopee: n/total */}
      {slides.length > 1 ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {index + 1}/{slides.length}
          </Text>
        </View>
      ) : null}

      {/* Dots điều hướng */}
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  videoSlide: {
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  videoTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoTagText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  counter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  counterText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  dots: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 16,
  },
});
