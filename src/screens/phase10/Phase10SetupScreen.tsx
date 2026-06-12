import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Player, Phase10Game, Phase10Player } from '../../types';
import { savePhase10Game } from '../../storage/gameStorage';
import PlayerSetup from '../../components/PlayerSetup';
import Button from '../../components/Button';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Phase10Setup'>;
  route: RouteProp<RootStackParamList, 'Phase10Setup'>;
};

export default function Phase10SetupScreen({ navigation }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);

  async function startGame() {
    if (players.length < 2) {
      Alert.alert('Zu wenige Spieler', 'Mindestens 2 Spieler benötigt.');
      return;
    }

    const gamePlayers: Phase10Player[] = players.map((p) => ({
      ...p,
      currentPhase: 1,
      totalPoints: 0,
      completedGame: false,
    }));

    const game: Phase10Game = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      players: gamePlayers,
      rounds: [],
      finished: false,
      winnerId: null,
    };

    await savePhase10Game(game);
    navigation.replace('Phase10Game', { gameId: game.id });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🃏 Phase 10</Text>
        <Text style={styles.infoText}>
          2–6 Spieler. Wer als erster alle 10 Phasen abschließt gewinnt.
          Phasen vorankommen unabhängig von Punkten – du brauchst nur deine
          Phase in einer Runde abzulegen.
        </Text>
      </View>

      <PlayerSetup
        players={players}
        onChange={setPlayers}
        minPlayers={2}
        maxPlayers={6}
      />

      <Button
        label="Spiel starten"
        onPress={startGame}
        disabled={players.length < 2}
        style={styles.startBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  infoTitle: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  startBtn: { marginTop: spacing.xl },
});
