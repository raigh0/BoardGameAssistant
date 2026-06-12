import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import {
  RootStackParamList,
  WizardGame,
  WizardRound,
  WizardRoundBid,
} from '../../types';
import { loadWizardGames, saveWizardGame } from '../../storage/gameStorage';
import Button from '../../components/Button';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WizardGame'>;
  route: RouteProp<RootStackParamList, 'WizardGame'>;
};

// Punkte-Berechnung laut Wizard-Regeln
function calcPoints(bid: number, taken: number): number {
  if (bid === taken) return 20 + bid * 10;
  return -10 * Math.abs(bid - taken);
}

type Phase = 'bidding' | 'tricks';

export default function WizardGameScreen({ route, navigation }: Props) {
  const { gameId } = route.params;
  const [game, setGame] = useState<WizardGame | null>(null);
  const [phase, setPhase] = useState<Phase>('bidding');

  // bids[playerId] = angesagte Stiche
  const [bids, setBids] = useState<Record<string, string>>({});
  // tricks[playerId] = tatsächliche Stiche
  const [tricks, setTricks] = useState<Record<string, string>>({});

  useEffect(() => {
    loadWizardGames().then((games) => {
      const found = games.find((g) => g.id === gameId);
      if (found) setGame(found);
    });
  }, [gameId]);

  const initInputs = useCallback((g: WizardGame) => {
    const b: Record<string, string> = {};
    const t: Record<string, string> = {};
    g.players.forEach((p) => { b[p.id] = ''; t[p.id] = ''; });
    setBids(b);
    setTricks(t);
    setPhase('bidding');
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

  const currentRound = game.rounds.length + 1;
  const cardCount = currentRound; // In Runde n bekommt jeder n Karten

  function confirmBids() {
    for (const p of game!.players) {
      const v = bids[p.id];
      if (v === '' || isNaN(Number(v)) || Number(v) < 0 || Number(v) > cardCount) {
        Alert.alert(
          'Ungültige Ansage',
          `${p.name}: Ansage muss zwischen 0 und ${cardCount} liegen.`
        );
        return;
      }
    }
    setPhase('tricks');
  }

  async function submitRound() {
    if (!game) return;

    for (const p of game.players) {
      const v = tricks[p.id];
      if (v === '' || isNaN(Number(v)) || Number(v) < 0 || Number(v) > cardCount) {
        Alert.alert(
          'Ungültige Eingabe',
          `${p.name}: Stiche müssen zwischen 0 und ${cardCount} liegen.`
        );
        return;
      }
    }

    // Validate total tricks taken cannot exceed cardCount
    const totalTricks = game.players.reduce((s, p) => s + Number(tricks[p.id]), 0);
    // Note: total tricks CAN exceed/undercount in Wizard due to Wizards/Jesters,
    // so we don't hard-enforce this but warn
    if (totalTricks > cardCount) {
      Alert.alert(
        'Hinweis',
        `Die Summe der gemachten Stiche (${totalTricks}) ist größer als die Kartenzahl (${cardCount}). Bitte prüfen.`
      );
    }

    const roundBids: WizardRoundBid[] = game.players.map((p) => ({
      playerId: p.id,
      bid: Number(bids[p.id]),
      tricksTaken: Number(tricks[p.id]),
    }));

    const newRound: WizardRound = {
      roundNumber: currentRound,
      cardCount,
      bids: roundBids,
      finished: true,
    };

    const updatedPlayers = game.players.map((p) => {
      const bid = roundBids.find((b) => b.playerId === p.id)!;
      return {
        ...p,
        totalPoints: p.totalPoints + calcPoints(bid.bid, bid.tricksTaken!),
      };
    });

    const finished = currentRound === game.totalRounds;

    const updatedGame: WizardGame = {
      ...game,
      players: updatedPlayers,
      rounds: [...game.rounds, newRound],
      finished,
    };

    await saveWizardGame(updatedGame);
    setGame(updatedGame);
    initInputs(updatedGame);

    if (finished) {
      const winner = [...updatedPlayers].sort((a, b) => b.totalPoints - a.totalPoints)[0];
      Alert.alert(
        '🏆 Spiel beendet!',
        `${winner.name} gewinnt mit ${winner.totalPoints} Punkten!`,
        [{ text: 'OK' }]
      );
    }
  }

  const sortedPlayers = [...(game?.players ?? [])].sort(
    (a, b) => b.totalPoints - a.totalPoints
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Progress */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Runde {Math.min(currentRound, game.totalRounds)} / {game.totalRounds}
        </Text>
        <Text style={styles.progressText}>
          {cardCount} Karte{cardCount !== 1 ? 'n' : ''} je Spieler
        </Text>
      </View>

      {/* Scoreboard */}
      <Text style={styles.sectionTitle}>Punktestand</Text>
      <View style={styles.scoreboard}>
        <View style={styles.scoreHeader}>
          <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Spieler</Text>
          <Text style={[styles.cell, styles.headerText]}>Punkte</Text>
        </View>
        {sortedPlayers.map((p, i) => (
          <View key={p.id} style={styles.scoreRow}>
            <Text style={[styles.cell, styles.nameCell, styles.nameText]}>
              {i === 0 ? '👑 ' : ''}{p.name}
            </Text>
            <Text style={[styles.cell, styles.pointsText]}>{p.totalPoints}</Text>
          </View>
        ))}
      </View>

      {/* Round input */}
      {!game.finished && (
        <>
          {phase === 'bidding' ? (
            <>
              <Text style={styles.sectionTitle}>
                Runde {currentRound} – Stiche ansagen
              </Text>
              <Text style={styles.hint}>
                Jeder Spieler sagt an, wie viele Stiche er macht (0–{cardCount}).
              </Text>
              {game.players.map((p) => (
                <View key={p.id} style={styles.inputRow}>
                  <Text style={styles.inputName}>{p.name}</Text>
                  <TextInput
                    style={styles.input}
                    value={bids[p.id]}
                    onChangeText={(v) => setBids((prev) => ({ ...prev, [p.id]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
              <Button label="Ansagen bestätigen →" onPress={confirmBids} style={styles.btn} />
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Runde {currentRound} – Tatsächliche Stiche eintragen
              </Text>
              {game.players.map((p) => (
                <View key={p.id} style={styles.inputRow}>
                  <View style={styles.inputMeta}>
                    <Text style={styles.inputName}>{p.name}</Text>
                    <Text style={styles.bidLabel}>
                      angesagt: {bids[p.id] || '–'}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={tricks[p.id]}
                    onChangeText={(v) => setTricks((prev) => ({ ...prev, [p.id]: v }))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}

              {/* Live preview */}
              {game.players.every((p) => tricks[p.id] !== '') && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>Vorschau Rundenpunkte</Text>
                  {game.players.map((p) => {
                    const b = Number(bids[p.id]);
                    const t = Number(tricks[p.id]);
                    const pts = !isNaN(b) && !isNaN(t) ? calcPoints(b, t) : null;
                    return (
                      <Text key={p.id} style={styles.previewRow}>
                        {p.name}:{' '}
                        <Text style={{ color: pts !== null && pts >= 0 ? colors.success : colors.danger }}>
                          {pts !== null ? (pts >= 0 ? '+' : '') + pts : '–'}
                        </Text>
                      </Text>
                    );
                  })}
                </View>
              )}

              <View style={styles.btnRow}>
                <Button
                  label="← Zurück"
                  onPress={() => setPhase('bidding')}
                  variant="ghost"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Runde abschließen"
                  onPress={submitRound}
                  style={{ flex: 2 }}
                />
              </View>
            </>
          )}
        </>
      )}

      {game.finished && (
        <View style={styles.finishedBanner}>
          <Text style={styles.finishedText}>🏆 Spiel beendet!</Text>
          <Button
            label="Neues Spiel"
            onPress={() => navigation.replace('WizardSetup')}
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
              <Text style={styles.historyTitle}>
                Runde {round.roundNumber} ({round.cardCount} Karten)
              </Text>
              {round.bids.map((bid) => {
                const player = game.players.find((p) => p.id === bid.playerId);
                const pts = bid.tricksTaken !== null
                  ? calcPoints(bid.bid, bid.tricksTaken)
                  : null;
                return (
                  <Text key={bid.playerId} style={styles.historyRow}>
                    {player?.name}: {bid.bid} angesagt / {bid.tricksTaken ?? '?'} gemacht →{' '}
                    <Text style={{ color: pts !== null && pts >= 0 ? colors.success : colors.danger }}>
                      {pts !== null ? (pts >= 0 ? '+' : '') + pts : '–'}
                    </Text>
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

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  progressText: {
    color: colors.accentPurple,
    fontWeight: '700',
    fontSize: fontSize.sm,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },

  scoreboard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
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
  cell: { flex: 1, textAlign: 'center', color: colors.text, fontSize: fontSize.sm },
  nameCell: { flex: 2, textAlign: 'left' },
  headerText: { color: colors.textMuted, fontWeight: '600', fontSize: fontSize.xs, textTransform: 'uppercase' },
  nameText: { color: colors.text, fontWeight: '600' },
  pointsText: { color: colors.accentPurple, fontWeight: '700' },

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
  inputName: {
    color: colors.text,
    fontWeight: '600',
    fontSize: fontSize.md,
    flex: 1,
  },
  bidLabel: {
    color: colors.textMuted,
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
  btn: { marginTop: spacing.md },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },

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
    backgroundColor: '#1a0a2a',
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentPurple,
    marginTop: spacing.md,
  },
  finishedText: {
    color: colors.accentPurple,
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
