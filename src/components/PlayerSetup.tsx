import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { colors, spacing, radius, fontSize } from './theme';
import { Player } from '../types';

interface Props {
  players: Player[];
  onChange: (players: Player[]) => void;
  minPlayers?: number;
  maxPlayers?: number;
}

export default function PlayerSetup({
  players,
  onChange,
  minPlayers = 2,
  maxPlayers = 6,
}: Props) {
  const [name, setName] = useState('');

  function addPlayer() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newPlayer: Player = { id: Date.now().toString(), name: trimmed };
    onChange([...players, newPlayer]);
    setName('');
  }

  function removePlayer(id: string) {
    onChange(players.filter((p) => p.id !== id));
  }

  return (
    <View>
      <Text style={styles.label}>
        Spieler ({players.length}/{maxPlayers})
      </Text>
      <FlatList
        data={players}
        keyExtractor={(p) => p.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => (
          <View style={styles.playerRow}>
            <Text style={styles.playerIndex}>{index + 1}.</Text>
            <Text style={styles.playerName}>{item.name}</Text>
            <TouchableOpacity onPress={() => removePlayer(item.id)}>
              <Text style={styles.remove}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Noch keine Spieler hinzugefügt</Text>
        }
      />
      {players.length < maxPlayers && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name eingeben…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={addPlayer}
          />
          <TouchableOpacity
            style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
            onPress={addPlayer}
            disabled={!name.trim()}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
      {players.length < minPlayers && (
        <Text style={styles.hint}>
          Mindestens {minPlayers} Spieler benötigt
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  playerIndex: {
    color: colors.textMuted,
    width: 24,
    fontSize: fontSize.sm,
  },
  playerName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
  },
  remove: {
    color: colors.danger,
    fontSize: fontSize.lg,
    paddingHorizontal: spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    color: colors.text,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  hint: {
    color: colors.warning,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});
