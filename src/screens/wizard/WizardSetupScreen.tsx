import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Player, WizardGame, WizardPlayer } from '../../types';
import { saveWizardGame } from '../../storage/gameStorage';
import PlayerSetup from '../../components/PlayerSetup';
import Button from '../../components/Button';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WizardSetup'>;
};

function totalRounds(playerCount: number): number {
  return Math.floor(60 / playerCount);
}

export default function WizardSetupScreen({ navigation }: Props) {
  const [players, setPlayers] = useState<Player[]>([]);

  async function startGame() {
    if (players.length < 3) {
      Alert.alert('Zu wenige Spieler', 'Wizard benötigt mindestens 3 Spieler.');
      return;
    }

    const gamePlayers: WizardPlayer[] = players.map((p) => ({
      ...p,
      totalPoints: 0,
    }));

    const rounds = totalRounds(players.length);

    const game: WizardGame = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      players: gamePlayers,
      rounds: [],
      totalRounds: rounds,
      finished: false,
    };

    await saveWizardGame(game);
    navigation.replace('WizardGame', { gameId: game.id });
  }

  const rounds = players.length >= 3 ? totalRounds(players.length) : '–';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🧙 Wizard</Text>
        <Text style={styles.infoText}>
          3–6 Spieler. Sage deine Stiche an – wer richtig liegt bekommt
          20 + (10 × Stiche) Punkte. Falsch: −10 × Differenz.{'\n'}
          Mit {players.length || '?'} Spielern gibt es {rounds} Runden.
        </Text>
      </View>

      <PlayerSetup
        players={players}
        onChange={setPlayers}
        minPlayers={3}
        maxPlayers={6}
      />

      <Button
        label="Spiel starten"
        onPress={startGame}
        disabled={players.length < 3}
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
    borderColor: '#a855f7',
  },
  infoTitle: {
    color: '#a855f7',
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
