import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { colors, spacing, radius, fontSize } from '../../components/theme';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const GAMES = [
  {
    key: 'phase10' as const,
    title: 'Phase 10',
    emoji: '🃏',
    description: 'Schließe alle 10 Phasen ab!\nVerfolge Phasen & Punkte.',
    color: '#e94560',
    setupRoute: 'Phase10Setup' as const,
  },
  {
    key: 'wizard' as const,
    title: 'Wizard',
    emoji: '🧙',
    description: 'Sage deine Stiche an!\nPunkte für korrekte Vorhersagen.',
    color: '#a855f7',
    setupRoute: 'WizardSetup' as const,
  },
  {
    key: 'cabo' as const,
    title: 'Cabo',
    emoji: '🎴',
    description: 'Niedrigste Punktzahl gewinnt!\nRuf "Cabo" zum richtigen Moment.',
    color: '#4ecca3',
    setupRoute: 'CaboSetup' as const,
  },
];

export default function HomeScreen({ navigation }: Props) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.subtitle}>Wähle dein Spiel</Text>

      {GAMES.map((game) => (
        <TouchableOpacity
          key={game.key}
          style={[styles.card, { borderColor: game.color }]}
          onPress={() => navigation.navigate(game.setupRoute)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.emoji}>{game.emoji}</Text>
            <Text style={[styles.gameTitle, { color: game.color }]}>
              {game.title}
            </Text>
          </View>
          <Text style={styles.gameDesc}>{game.description}</Text>
          <View style={[styles.playBtn, { backgroundColor: game.color }]}>
            <Text style={styles.playBtnText}>Spiel starten →</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.rulesSection}>
        <Text style={styles.rulesTitle}>Kurzregeln</Text>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleGame}>🃏 Phase 10</Text>
          <Text style={styles.ruleText}>
            Jeder Spieler muss 10 Phasen in fester Reihenfolge abschließen.
            Wer seine Phase in einer Runde ablegt, rückt vor – unabhängig
            von den Punkten. Restkarten zählen als Minuspunkte. Ziel: erster
            Spieler, der Phase 10 abschließt (bei Gleichstand: wenigste Punkte).
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleGame}>🧙 Wizard</Text>
          <Text style={styles.ruleText}>
            In Runde n bekommt jeder n Karten. Jeder sagt an, wie viele Stiche
            er macht. Richtig gesagt: 20 + (10 × Stiche) Punkte. Falsch gesagt:
            −10 × |Differenz| Punkte. Gespielt wird über alle Runden (60 Karten
            ÷ Spieleranzahl).
          </Text>
        </View>

        <View style={styles.ruleCard}>
          <Text style={styles.ruleGame}>🎴 Cabo</Text>
          <Text style={styles.ruleText}>
            Jeder Spieler hat 4 verdeckte Karten (Wert 0–13). Ziel: niedrigste
            Gesamtpunktzahl. Wer "Cabo" ruft, beendet die Runde. Hat der
            Rufer die niedrigste Summe, erhält er −5 Bonus. Hat er nicht
            die niedrigste, erhält er +10 als Strafe. Spiel endet wenn ein
            Spieler ≥100 Punkte hat.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 32,
  },
  gameTitle: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
  },
  gameDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  playBtn: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  playBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  rulesSection: {
    marginTop: spacing.xl,
  },
  rulesTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  ruleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleGame: {
    color: colors.text,
    fontWeight: '700',
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  ruleText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
});
