import { useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';

export const TOKEN_SIZE = 44;
const WRAPPER_W = 60;

type Props = {
  name: string;
  team: 'A' | 'B';
  cx: number; // center x in field px
  cy: number; // center y in field px
  onDrop: (dx: number, dy: number) => void;
};

export default function PlayerToken({ name, team, cx, cy, onDrop }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, g) => {
        setDragging(false);
        onDrop(g.dx, g.dy);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 7,
          tension: 80,
        }).start();
      },
    })
  ).current;

  const initials = name
    .split(' ')
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        styles.wrapper,
        {
          left: cx - WRAPPER_W / 2,
          top: cy - TOKEN_SIZE / 2,
          zIndex: dragging ? 200 : 10,
          elevation: dragging ? 10 : 2,
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <View style={[styles.circle, team === 'A' ? styles.teamA : styles.teamB]}>
        <Text style={[styles.initials, team === 'B' && styles.initialsLight]}>
          {initials}
        </Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    width: WRAPPER_W,
    alignItems: 'center',
  },
  circle: {
    width: TOKEN_SIZE,
    height: TOKEN_SIZE,
    borderRadius: TOKEN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  teamA: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  teamB: {
    backgroundColor: '#1565C0',
    borderColor: '#0D47A1',
  },
  initials: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  initialsLight: {
    color: '#fff',
  },
  name: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    marginTop: 3,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    textAlign: 'center',
    width: WRAPPER_W,
  },
});
