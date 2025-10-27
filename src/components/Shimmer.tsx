import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
}

const Shimmer: React.FC<ShimmerProps> = ({ width, height, borderRadius = 8 }) => {
  const shimmerValue = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmerValue]);

  const translateX = shimmerValue.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width as number, width as number],
  });

  return (
    <View style={[styles.shimmerContainer, { width, height, borderRadius }]}>
      <Animated.View
        style={[
          styles.shimmerBar,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerContainer: {
    backgroundColor: '#eee',
    overflow: 'hidden',
  },
  shimmerBar: {
    flex: 1,
    width: '30%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
});

export default Shimmer;
