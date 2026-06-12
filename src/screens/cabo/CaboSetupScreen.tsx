import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Player, CaboGame, CaboPlayer } from '../../types';
import { saveCaboGame } from '../../storage/gameStorage';
import PlayerSetup from '../../components/PlayerSetup';
import Button from '../../components/Button';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CaboSetup'>;
};

export default function CaboSetupScreen({ navigation }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);

  async function startGame() {
    if (players.length < 2) {
      Alert.alert('Zu wenige Spieler', 'Mindestens 2 Spieler benötigt.');
      return;
    }

    const gamePlayers: CaboPlayer[] = players.map((p) => ({
      ...p,
      totalPoints: 0,
      eliminated: false,
    }));

    const game: CaboGame = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      players: gamePlayers,
      rounds: [],
      finished: false,
      winnerId: null,
    };

    await saveCaboGame(game);
    navigation.replace('CaboGame', { gameId: game.id });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🎴 Cabo</Text>
        <Text style={styles.infoText}>
          2–6 Spieler. Jeder hat 4 verdeckte Karten (0–13 Punkte).
          Niedrigste Gesamtpunktzahl gewinnt die Runde.{'\n\n'}
          Wer "Cabo" ruft, beendet die Runde:{'\n'}
          • Rufer hat die niedrigste Summe → −5 Bonus{'\n'}
          • Rufer hat NICHT die niedrigste → +10 Strafe{'\n\n'}
          Das Spiel endet, wenn ein Spieler ≥100 Punkte erreicht.
          Der Spieler mit den wenigsten Punkten gewinnt.
        </Text>
      </View>

      <View style={styles.cardValues}>
        <Text style={styles.cardValuesTitle}>Kartenwerte</Text>
        <Text style={styles.cardValuesText}>
          König (K) = 0 · Ass (A) = 1 · 2–10 = Nennwert · Bube (J) = 11 · Dame (Q) = 12
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accentGreen,
  },
  infoTitle: {
    color: colors.accentGreen,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  infoText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  cardValues: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardValuesTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  cardValuesText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 17,
  },
  startBtn: { marginTop: spacing.xl },
});
