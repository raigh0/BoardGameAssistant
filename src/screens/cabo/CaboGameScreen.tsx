import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  RootStackParamList,
  CaboGame,
  CaboRound,
} from '../../types';
import { loadCaboGames, saveCaboGame } from '../../storage/gameStorage';
import Button from '../../components/Button';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CaboGame'>;
  route: RouteProp<RootStackParamList, 'CaboGame'>;
};

const GAME_OVER_THRESHOLD = 100;

export default function CaboGameScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<CaboGame | null>(null);

  // Round input state
  const [handValues, setHandValues] = useState<Record<string, string>>({});
  const [caboCallerId, setCaboCallerId] = useState<string | null>(null);

  useEffect(() => {
    loadCaboGames().then((games) => {
      const found = games.find((g) => g.id === gameId);
      if (found) setGame(found);
    });
  }, [gameId]);

  const initInputs = useCallback((g: CaboGame) => {
    const vals: Record<string, string> = {};
    g.players.forEach((p) => { vals[p.id] = ''; });
    setHandValues(vals);
    setCaboCallerId(null);
  }, []);

  useEffect(() => {
    if (game) initInputs(game);
  }, [game?.id]);

  if (!game) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Laden…</Text>
      </View>
    );
  }

  const activePlayers = game.players.filter((p) => !p.eliminated);
  const currentRound = game.rounds.length + 1;

  async function submitRound() {
    if (!game) return;

    for (const p of activePlayers) {
      const v = handValues[p.id];
      if (v === '' || isNaN(Number(v)) || Number(v) < 0) {
        Alert.alert('Ungültige Eingabe', `Bitte Handwert für ${p.name} eingeben.`);
        return;
      }
    }

    // Find minimum hand value among active players
    const minValue = Math.min(...activePlayers.map((p) => Number(handValues[p.id])));

    const scores: CaboRound['scores'] = activePlayers.map((p) => {
      const handValue = Number(handValues[p.id]);
      let finalPoints = handValue;
      let hasCaboBonus = false;
      let hasCaboPenalty = false;

      if (p.id === caboCallerId) {
        if (handValue === minValue) {
          finalPoints = Math.max(0, handValue - 5);
          hasCaboBonus = true;
        } else {
          finalPoints = handValue + 10;
          hasCaboPenalty = true;
        }
      }

      return { playerId: p.id, handValue, finalPoints, hasCaboBonus, hasCaboPenalty };
    });

    // Add also scores of 0 for eliminated players to keep history consistent
    const allScores = game.players.map((p) => {
      if (p.eliminated) {
        return { playerId: p.id, handValue: 0, finalPoints: 0, hasCaboBonus: false, hasCaboPenalty: false };
      }
      return scores.find((s) => s.playerId === p.id)!;
    });

    const newRound: CaboRound = {
      roundNumber: currentRound,
      caboCallerId,
      scores: allScores,
    };

    const updatedPlayers = game.players.map((p) => {
      if (p.eliminated) return p;
      const score = allScores.find((s) => s.playerId === p.id)!;
      const newTotal = p.totalPoints + score.finalPoints;
      return {
        ...p,
        totalPoints: newTotal,
        eliminated: newTotal >= GAME_OVER_THRESHOLD,
      };
    });

    // Game ends when only 1 active player remains OR all players reach 100+
    const remaining = updatedPlayers.filter((p) => !p.eliminated);
    const finished = remaining.length <= 1;
    let winnerId: string | null = null;

    if (finished) {
      if (remaining.length === 1) {
        winnerId = remaining[0].id;
      } else {
        // All eliminated in same round – lowest total wins
        const winner = [...updatedPlayers].sort((a, b) => a.totalPoints - b.totalPoints)[0];
        winnerId = winner.id;
      }
    }

    const updatedGame: CaboGame = {
      ...game,
      players: updatedPlayers,
      rounds: [...game.rounds, newRound],
      finished,
      winnerId,
    };

    await saveCaboGame(updatedGame);
    setGame(updatedGame);
    initInputs(updatedGame);

    if (finished && winnerId) {
      const winner = updatedPlayers.find((p) => p.id === winnerId);
      Alert.alert(
        '🏆 Spiel beendet!',
        `${winner?.name} gewinnt mit ${winner?.totalPoints} Punkten!`,
        [{ text: 'OK' }]
      );
    } else {
      // Notify about newly eliminated players
      const eliminated = updatedPlayers.filter(
        (p) => p.eliminated && !game.players.find((op) => op.id === p.id)?.eliminated
      );
      if (eliminated.length > 0) {
        Alert.alert(
          'Ausgeschieden',
          eliminated.map((p) => `${p.name} hat ≥100 Punkte erreicht.`).join('\n')
        );
      }
    }
  }

  const sortedPlayers = [...game.players].sort((a, b) => a.totalPoints - b.totalPoints);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Scoreboard */}
      <Text style={styles.sectionTitle}>Punktestand – Runde {currentRound}</Text>
      <View style={styles.scoreboard}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Spieler</Text>
          <Text style={[styles.cell, styles.headerText]}>Punkte</Text>
          <Text style={[styles.cell, styles.headerText]}>Status</Text>
        </View>
        {sortedPlayers.map((p, i) => (
          <View
            key={p.id}
            style={[styles.scoreRow, p.eliminated && styles.eliminatedRow]}
          >
            <Text style={[styles.cell, styles.nameCell, p.eliminated ? styles.eliminatedText : styles.nameText]}>
              {i === 0 && !p.eliminated ? '🏆 ' : ''}{p.name}
            </Text>
            <Text style={[styles.cell, p.eliminated ? styles.eliminatedText : styles.pointsText]}>
              {p.totalPoints}
            </Text>
            <Text style={[styles.cell, styles.statusText]}>
              {p.eliminated ? '❌' : p.totalPoints >= 75 ? '⚠️' : '✓'}
            </Text>
          </View>
        ))}
      </View>

      {/* Progress bar per player */}
      {activePlayers.map((p) => {
        const pct = Math.min(p.totalPoints / GAME_OVER_THRESHOLD, 1);
        const barColor = pct > 0.75 ? colors.danger : pct > 0.5 ? colors.warning : colors.success;
        return (
          <View key={p.id} style={styles.progressBar}>
            <Text style={styles.progressLabel}>
              {p.name} – {p.totalPoints}/{GAME_OVER_THRESHOLD}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct * 100}%` as any, backgroundColor: barColor }]} />
            </View>
          </View>
        );
      })}

      {/* Round input */}
      {!game.finished && (
        <>
          <Text style={styles.sectionTitle}>Runde {currentRound} – Handwerte eingeben</Text>

          {/* Cabo caller selection */}
          <Text style={styles.subLabel}>Wer hat "Cabo" gerufen?</Text>
          <View style={styles.caboRow}>
            {activePlayers.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.caboBtn,
                  caboCallerId === p.id && styles.caboBtnActive,
                ]}
                onPress={() =>
                  setCaboCallerId(caboCallerId === p.id ? null : p.id)
                }
              >
                <Text
                  style={[
                    styles.caboBtnText,
                    caboCallerId === p.id && styles.caboBtnTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {!caboCallerId && (
            <Text style={styles.warningText}>⚠️ Cabo-Rufer auswählen</Text>
          )}

          {/* Hand values */}
          {activePlayers.map((p) => (
            <View key={p.id} style={styles.inputRow}>
              <View style={styles.inputMeta}>
                <Text style={styles.inputName}>{p.name}</Text>
                {p.id === caboCallerId && (
                  <Text style={styles.caboTag}>hat Cabo gerufen</Text>
                )}
              </View>
              <TextInput
                style={styles.input}
                value={handValues[p.id]}
                onChangeText={(v) =>
                  setHandValues((prev) => ({ ...prev, [p.id]: v }))
                }
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          ))}

          {/* Live preview */}
          {activePlayers.every((p) => handValues[p.id] !== '') && caboCallerId && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Vorschau dieser Runde</Text>
              {(() => {
                const minVal = Math.min(...activePlayers.map((p) => Number(handValues[p.id])));
                return activePlayers.map((p) => {
                  const hand = Number(handValues[p.id]);
                  let pts = hand;
                  let note = '';
                  if (p.id === caboCallerId) {
                    if (hand === minVal) { pts = Math.max(0, hand - 5); note = ' (Cabo ✓ −5)'; }
                    else { pts = hand + 10; note = ' (Cabo ✗ +10)'; }
                  }
                  return (
                    <Text key={p.id} style={styles.previewRow}>
                      {p.name}: {hand} → <Text style={{ color: colors.accentGreen }}>+{pts}</Text>
                      <Text style={{ color: colors.textMuted }}>{note}</Text>
                    </Text>
                  );
                });
              })()}
            </View>
          )}

          <Button
            label="Runde abschließen"
            onPress={submitRound}
            disabled={!caboCallerId}
            style={styles.submitBtn}
          />
        </>
      )}

      {game.finished && (
        <View style={styles.finishedBanner}>
          <Text style={styles.finishedText}>🏆 Spiel beendet!</Text>
          <Button
            label="Neues Spiel"
            onPress={() => navigation.replace('CaboSetup')}
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
          {[...game.rounds].reverse().map((round) => {
            const caller = game.players.find((p) => p.id === round.caboCallerId);
            return (
              <View key={round.roundNumber} style={styles.historyRound}>
                <Text style={styles.historyTitle}>
                  Runde {round.roundNumber}
                  {caller ? ` – Cabo: ${caller.name}` : ''}
                </Text>
                {round.scores.map((s) => {
                  const player = game.players.find((p) => p.id === s.playerId);
                  return (
                    <Text key={s.playerId} style={styles.historyRow}>
                      {player?.name}: {s.handValue} → +{s.finalPoints}
                      {s.hasCaboBonus ? ' ✓' : s.hasCaboPenalty ? ' ✗' : ''}
                    </Text>
                  );
                })}
              </View>
            );
          })}
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
  subLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },

  scoreboard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
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
  eliminatedRow: { opacity: 0.4 },
  cell: { flex: 1, textAlign: 'center', color: colors.text, fontSize: fontSize.sm },
  nameCell: { flex: 2, textAlign: 'left' },
  headerText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.xs, textTransform: 'uppercase' },
  nameText: { color: colors.text, fontWeight: '600' },
  eliminatedText: { color: colors.textMuted },
  pointsText: { color: colors.accentGreen, fontWeight: '700' },
  statusText: { textAlign: 'center' },

  progressBar: { marginBottom: spacing.xs },
  progressLabel: { color: colors.textMuted, fontSize: fontSize.xs, marginBottom: 3 },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },

  caboRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  caboBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caboBtnActive: {
    backgroundColor: colors.accentGreen,
    borderColor: colors.accentGreen,
  },
  caboBtnText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.sm },
  caboBtnTextActive: { color: colors.textDark },

  warningText: { color: colors.warning, fontSize: fontSize.xs, marginBottom: spacing.sm },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  inputMeta: { flex: 1 },
  inputName: { color: colors.text, fontWeight: '600', fontSize: fontSize.md },
  caboTag: {
    color: colors.accentGreen,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    width: 60,
  },
  submitBtn: { marginTop: spacing.md },

  preview: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  previewRow: {
    color: colors.text,
    fontSize: fontSize.sm,
    paddingVertical: 2,
  },

  finishedBanner: {
    backgroundColor: '#0a2a1a',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentGreen,
    marginTop: spacing.md,
  },
  finishedText: {
    color: colors.accentGreen,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },

  historyRound: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  historyTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  historyRow: {
    color: colors.text,
    fontSize: fontSize.sm,
    paddingVertical: 1,
  },
});
