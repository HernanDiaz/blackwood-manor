export const VISUAL_SET = 'blackwood-pilot-v1';
const paths = {
  'person:arthur': '/assets/blackwood-pilot-v1/arthur.webp',
  'room:study': '/assets/blackwood-pilot-v1/study.webp',
  'clue:cup': '/assets/blackwood-pilot-v1/cup.webp',
  'person:elena': '/assets/blackwood-complete-v1/person-elena.webp',
  'person:victor': '/assets/blackwood-complete-v1/person-victor.webp',
  'person:clara': '/assets/blackwood-complete-v1/person-clara.webp',
  'person:julian': '/assets/blackwood-complete-v1/person-julian.webp',
  'room:library': '/assets/blackwood-complete-v1/room-library.webp',
  'room:dining': '/assets/blackwood-complete-v1/room-dining.webp',
  'room:kitchen': '/assets/blackwood-complete-v1/room-kitchen.webp',
  'room:greenhouse': '/assets/blackwood-complete-v1/room-greenhouse.webp',
  'room:hall': '/assets/blackwood-complete-v1/room-hall.webp',
  'clue:body': '/assets/blackwood-complete-v1/clue-body.webp',
  'clue:will': '/assets/blackwood-complete-v1/clue-will.webp',
  'clue:appointment': '/assets/blackwood-complete-v1/clue-appointment.webp',
  'clue:fraud': '/assets/blackwood-complete-v1/clue-fraud.webp',
  'clue:botany': '/assets/blackwood-complete-v1/clue-botany.webp',
  'clue:letter': '/assets/blackwood-complete-v1/clue-letter.webp',
  'clue:glasses': '/assets/blackwood-complete-v1/clue-glasses.webp',
  'clue:photo': '/assets/blackwood-complete-v1/clue-photo.webp',
  'clue:argument': '/assets/blackwood-complete-v1/clue-argument.webp',
  'clue:tray': '/assets/blackwood-complete-v1/clue-tray.webp',
  'clue:vial': '/assets/blackwood-complete-v1/clue-vial.webp',
  'clue:receipt': '/assets/blackwood-complete-v1/clue-receipt.webp',
  'clue:plant': '/assets/blackwood-complete-v1/clue-plant.webp',
  'clue:glove': '/assets/blackwood-complete-v1/clue-glove.webp',
  'clue:mud': '/assets/blackwood-complete-v1/clue-mud.webp',
  'clue:clock': '/assets/blackwood-complete-v1/clue-clock.webp',
  'clue:visitor': '/assets/blackwood-complete-v1/clue-visitor.webp',
};
export function visualFor(state, kind, id) {
  if (state.visualSet !== VISUAL_SET) return null;
  if (kind === 'clue' && !state.found.includes(id)) return null;
  return paths[kind + ':' + id] || null;
}
