// Little gestures. `pose`/`expression` drive both avatars; `particles` picks
// the floating effect. Event names match the realtime contract.
export const INTERACTIONS = [
  { id: 'hug', label: 'Hug', emoji: '🤗', verb: 'hugged you', pose: 'hug', partnerPose: 'hug', expression: 'love', particles: 'hearts', together: true },
  { id: 'kiss', label: 'Kiss', emoji: '😘', verb: 'sent you a kiss', pose: 'kiss', partnerPose: 'idle', expression: 'kiss', partnerExpression: 'love', particles: 'kiss' },
  { id: 'wave', label: 'Wave', emoji: '👋', verb: 'waved at you', pose: 'wave', partnerPose: 'idle', expression: 'happy' },
  { id: 'love', label: 'Send love', emoji: '❤️', verb: 'sent you love', pose: 'heart', partnerPose: 'idle', expression: 'happy', partnerExpression: 'love', particles: 'stream' },
  { id: 'highfive', label: 'High five', emoji: '🙌', verb: 'high-fived you', pose: 'highfive', partnerPose: 'highfive', expression: 'happy', partnerExpression: 'happy', particles: 'sparkle', together: true },
  { id: 'pat', label: 'Head pat', emoji: '🫳', verb: 'patted your head', pose: 'pat', partnerPose: 'idle', expression: 'happy', partnerExpression: 'happy', particles: 'sparkle', together: true },
];
export const INTERACTIONS_BY_ID = Object.fromEntries(INTERACTIONS.map((i) => [i.id, i]));
