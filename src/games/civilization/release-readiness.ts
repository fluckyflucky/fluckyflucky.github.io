// Remove an entry only with rule implementation, source fixtures and reviewed evidence.
// Research data coverage is deliberately separate from gameplay fidelity.
export const releaseBlockers = [
  'Government data covers 13 layouts, but governor/legacy/influence effects and most policy cards are incomplete',
  'Only 3 civilizations; leader traits, unique units/buildings/improvements are incomplete',
  'Most canonical units, buildings, wonders and resources are not constructible',
  'Great People roster, Great Work slots/theming and cultural modifiers are incomplete',
  'Pantheons, beliefs, apostles, theological combat and religion founding rules are incomplete',
  'City-state types, quests, suzerainty and unique bonuses are incomplete',
  'Corps/armies, support stacking, promotion trees, air/naval combat and strategic upkeep are incomplete',
  'Layered terrain generation, river edges, natural wonders and district placement are incomplete',
  'Loyalty, governors, ages, espionage, alliances and diplomacy transactions are missing',
  'World Congress, diplomatic victory, power, climate and disasters are missing',
  'Future-era randomization, repeatable research and several research effects are missing',
  'Some Civilopedia descriptions use older rules; expansion-specific modifiers need game-data verification',
] as const;
