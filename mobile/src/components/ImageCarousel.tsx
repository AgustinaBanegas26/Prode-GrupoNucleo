import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  ViewToken,
  FlatList,
  Image,
} from 'react-native';

import { useAppTheme } from '../providers/ThemeProvider';
import { spacing, radius, shadows } from '../theme/theme';

type CarouselItem = {
  id: string;
  title: string;
  imageUrl: string;
  link?: string;
};

type ImageCarouselProps = {
  items: CarouselItem[];
  onItemPress?: (item: CarouselItem) => void;
  autoplayInterval?: number;
};

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = screenWidth - spacing.lg * 2;

export function ImageCarousel({ items, onItemPress, autoplayInterval = 5000 }: ImageCarouselProps) {
  const { theme } = useAppTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index || 0);
      }
    },
    [],
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
    }),
    [],
  );

  const renderItem = ({ item }: { item: CarouselItem }) => (
    <Pressable
      onPress={() => onItemPress?.(item)}
      style={[styles.itemContainer, { width: ITEM_WIDTH }]}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={[
          styles.image,
          {
            borderRadius: radius.lg,
          },
        ]}
        defaultSource={require('../../assets/images/placeholder.png')}
      />
      <View
        style={[
          styles.overlay,
          {
            borderRadius: radius.lg,
            backgroundColor: theme.colors.overlay,
          },
        ]}
      />
    </Pressable>
  );

  const renderDot = (index: number) => (
    <Pressable
      key={index}
      style={[
        styles.dot,
        {
          backgroundColor: index === activeIndex ? theme.colors.primary : theme.colors.border,
        },
      ]}
    />
  );

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={ITEM_WIDTH + spacing.md}
        decelerationRate="fast"
      />
      <View style={styles.dotsContainer}>{items.map((_, i) => renderDot(i))}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  flatListContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  itemContainer: {
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
});
