import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  RootStackParamList,
  Phase10Game,
  Phase10Round,
} from '../../types';
import {
  loadPhase10Games,
  savePhase10Game,
} from '../../storage/gameStorage';
import Button from '../../components/Button';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Phase10Game'>;
  route: RouteProp<RootStackParamList, 'Phase10Game'>;
};

const PHASE_NAMES: Record<number, string> = {
  1: 'Phase 1 – 2 Drillinge',
  2: 'Phase 2 – 1 Drilling + 1 Viererfolge',
  3: 'Phase 3 – 1 Vierling + 1 Viererfolge',
  4: 'Phase 4 – 1 Siebenerfolge',
  5: 'Phase 5 – 1 Achterfolge',
  6: 'Phase 6 – 1 Neunerfolge',
  7: 'Phase 7 – 2 Vierlinge',
  8: 'Phase 8 – 7 Karten einer Farbe',
  9: 'Phase 9 – 1 Fünferfolge + 1 Drilling',
  10: 'Phase 10 – 1 Fünferfolge + 1 Vierling',
};

export default function Phase10GameScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<Phase10Game | null>(null);

  // Per-round input state: points and completedPhase per player
  const [roundPoints, setRoundPoints] = useState<Record<string, string>>({});
  const [phaseCompleted, setPhaseCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPhase10Games().then((games) => {
      const found = games.find((g) => g.id === gameId);
      if (found) setGame(found);
    });
  }, [gameId]);

  const initRoundInputs = useCallback((g: Phase10Game) => {
    const pts: Record<string, string> = {};
    const comp: Record<string, boolean> = {};
    g.players.forEach((p) => {
      pts[p.id] = '';
      comp[p.id] = false;
    });
    setRoundPoints(pts);
    setPhaseCompleted(comp);
  }, []);

  useEffect(() => {
    if (game) initRoundInputs(game);
  }, [game?.id]);

  async function submitRound() {
    if (!game) return;

    for (const player of game.players) {
      if (player.completedGame) continue;
      const val = roundPoints[player.id];
      if (val === '' || isNaN(Number(val)) || Number(val) < 0) {
        Alert.alert('Ungültige Eingabe', `Bitte gültige Punkte für ${player.name} eingeben.`);
        return;
      }
    }

    const roundScores: Phase10Round['scores'] = game.players.map((p) => ({
      playerId: p.id,
      points: p.completedGame ? 0 : Number(roundPoints[p.id]),
      completedPhase: p.completedGame ? false : phaseCompleted[p.id],
    }));

    const newRound: Phase10Round = {
      roundNumber: game.rounds.length + 1,
      scores: roundScores,
    };

    const updatedPlayers = game.players.map((p) => {
      const score = roundScores.find((s) => s.playerId === p.id)!;
      const newPoints = p.totalPoints + score.points;
      // Phase advances when player completed their phase this round
      const newPhase = score.completedPhase
        ? Math.min(p.currentPhase + 1, 11)
        : p.currentPhase;
      const completedGame = newPhase === 11;
      return {
        ...p,
        totalPoints: newPoints,
        currentPhase: completedGame ? 11 : newPhase,
        completedGame,
      };
    });

    // Check for winner(s): players who just completed phase 10
    const finishers = updatedPlayers.filter((p) => p.completedGame);
    let winnerId: string | null = null;
    let finished = game.finished;

    if (finishers.length > 0) {
      finished = true;
      // Tiebreak: fewest total points among finishers
      const winner = finishers.reduce((best, cur) =>
        cur.totalPoints < best.totalPoints ? cur : best
      );
      winnerId = winner.id;
    }

    const updatedGame: Phase10Game = {
      ...game,
      players: updatedPlayers,
      rounds: [...game.rounds, newRound],
      finished,
      winnerId,
    };

    await savePhase10Game(updatedGame);
    setGame(updatedGame);
    initRoundInputs(updatedGame);

    if (finished && winnerId) {
      const winner = updatedPlayers.find((p) => p.id === winnerId);
      Alert.alert(
        '🏆 Spiel beendet!',
        `${winner?.name} hat gewonnen mit ${winner?.totalPoints} Punkten!`,
        [{ text: 'OK' }]
      );
    }
  }

  if (!game) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Laden…</Text>
      </View>
    );
  }

  const currentRound = game.rounds.length + 1;
  const activePlayers = game.players.filter((p) => !p.completedGame);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scoreboard */}
      <Text style={styles.sectionTitle}>Punktestand – Runde {currentRound}</Text>
      <View style={styles.scoreboard}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.scoreCell, styles.nameCell, styles.headerText]}>Spieler</Text>
          <Text style={[styles.scoreCell, styles.headerText]}>Phase</Text>
          <Text style={[styles.scoreCell, styles.headerText]}>Punkte</Text>
        </View>
        {[...game.players]
          .sort((a, b) => {
            if (b.currentPhase !== a.currentPhase) return b.currentPhase - a.currentPhase;
            return a.totalPoints - b.totalPoints;
          })
          .map((player) => (
            <View
              key={player.id}
              style={[
                styles.scoreRow,
                player.completedGame && styles.scoreRowWinner,
              ]}
            >
              <Text style={[styles.scoreCell, styles.nameCell, styles.nameText]}>
                {player.completedGame ? '🏆 ' : ''}{player.name}
              </Text>
              <Text style={[styles.scoreCell, styles.phaseText]}>
                {player.completedGame ? '✓' : player.currentPhase}
              </Text>
              <Text style={[styles.scoreCell, styles.pointsText]}>
                {player.totalPoints}
              </Text>
            </View>
          ))}
      </View>

      {/* Phase reference */}
      <TouchableOpacity style={styles.phaseRef}>
        <Text style={styles.sectionTitle}>Phasen-Übersicht</Text>
        {Object.entries(PHASE_NAMES).map(([num, desc]) => (
          <Text key={num} style={styles.phaseItem}>
            <Text style={styles.phaseNum}>{num}. </Text>
            {desc.split('–')[1]?.trim()}
          </Text>
        ))}
      </TouchableOpacity>

      {/* Round input */}
      {!game.finished && (
        <>
          <Text style={styles.sectionTitle}>Runde {currentRound} eingeben</Text>
          {activePlayers.map((player) => (
            <View key={player.id} style={styles.playerInput}>
              <View style={styles.playerInputHeader}>
                <Text style={styles.playerInputName}>{player.name}</Text>
                <Text style={styles.playerPhaseLabel}>
                  {PHASE_NAMES[player.currentPhase]}
                </Text>
              </View>

              <View style={styles.inputRow}>
                <View style={styles.pointsInputWrapper}>
                  <Text style={styles.inputLabel}>Punkte (Handkarten)</Text>
                  <TextInput
                    style={styles.input}
                    value={roundPoints[player.id]}
                    onChangeText={(v) =>
                      setRoundPoints((prev) => ({ ...prev, [player.id]: v }))
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <View style={styles.switchWrapper}>
                  <Text style={styles.inputLabel}>Phase geschafft?</Text>
                  <Switch
                    value={phaseCompleted[player.id]}
                    onValueChange={(v) =>
                      setPhaseCompleted((prev) => ({ ...prev, [player.id]: v }))
                    }
                    trackColor={{ false: colors.border, true: colors.success }}
                    thumbColor={phaseCompleted[player.id] ? colors.accentGreen : colors.textMuted}
                  />
                </View>
              </View>
            </View>
          ))}

          <Button
            label="Runde abschließen"
            onPress={submitRound}
            style={styles.submitBtn}
          />
        </>
      )}

      {game.finished && (
        <View style={styles.finishedBanner}>
          <Text style={styles.finishedText}>🏆 Spiel beendet!</Text>
          <Button
            label="Neues Spiel"
            onPress={() => navigation.replace('Phase10Setup')}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </View>
      )}

      {/* Round history */}
      {game.rounds.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
            Rundenhistorie
          </Text>
          {[...game.rounds].reverse().map((round) => (
            <View key={round.roundNumber} style={styles.historyRound}>
              <Text style={styles.historyRoundTitle}>Runde {round.roundNumber}</Text>
              {round.scores.map((score) => {
                const player = game.players.find((p) => p.id === score.playerId);
                return (
                  <Text key={score.playerId} style={styles.historyScore}>
                    {player?.name}: {score.points} Pkt.
                    {score.completedPhase ? ' ✓ Phase abgeschlossen' : ''}
                  </Text>
                );
              })}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textMuted },

  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  // Scoreboard
  scoreboard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  scoreHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreRowWinner: {
    backgroundColor: '#0a2a1a',
  },
  scoreCell: {
    flex: 1,
    textAlign: 'center',
    color: colors.text,
    fontSize: fontSize.sm,
  },
  nameCell: { flex: 2, textAlign: 'left' },
  headerText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.xs, textTransform: 'uppercase' },
  nameText: { color: colors.text, fontWeight: '600' },
  phaseText: { color: colors.accentYellow, fontWeight: '700' },
  pointsText: { color: colors.accent, fontWeight: '700' },

  // Phase reference
  phaseRef: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phaseItem: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    paddingVertical: 2,
  },
  phaseNum: {
    color: colors.accentYellow,
    fontWeight: '700',
  },

  // Round input
  playerInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerInputHeader: { marginBottom: spacing.sm },
  playerInputName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  playerPhaseLabel: {
    color: colors.accentYellow,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  pointsInputWrapper: { flex: 1 },
  switchWrapper: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
  },
  submitBtn: { marginTop: spacing.md },

  // Finished
  finishedBanner: {
    backgroundColor: '#0a2a1a',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success,
    marginTop: spacing.md,
  },
  finishedText: {
    color: colors.success,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },

  // History
  historyRound: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  historyRoundTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  historyScore: {
    color: colors.text,
    fontSize: fontSize.sm,
    paddingVertical: 1,
  },
});
