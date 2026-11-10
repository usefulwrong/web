// Fictional evidence and permissions. No model calls or external actions run here.
export const courtFile = {
  instruction: 'Have the East Bridge open for the morning market. Arrange the work, deal with the necessary checks, and bring me one decision to sign. Escalate anything that genuinely needs my attention.',
  warrant: [
    'Your Majesty,',
    'Preparations for the opening of the East Bridge are complete. The relevant offices have been informed and the arrangements are in order.',
    'Opening at first light will restore the crossing in time for the market. We respectfully request your assent.',
  ],
  steward: {
    role: 'Coordinating agent',
    authority: 'Assign subordinate agents, select their documents, combine their findings and prepare orders for the royal seal.',
    task: 'Return one actionable recommendation. Keep technical matters with the office responsible for them.',
    inputs: ['works-summary', 'market-arrangements'],
    result: 'The crossing is ready for the announced opening. The works office is handling the remaining technical matter. The market arrangements are complete.',
  },
  clerk: {
    role: 'Summarising agent',
    task: 'Prepare a short note for the council. Separate matters needing a royal decision from matters assigned to a technical office.',
    inputs: ['inspection'],
    result: 'A local technical matter has been referred to the works office. Opening can proceed once the usual clearances are in place.',
  },
  examiner: {
    role: 'Reviewing agent',
    task: 'Independently review the reopening recommendation. Flag contradictions in the supplied material.',
    inputs: ['works-summary', 'market-arrangements'],
    result: 'No contradiction found in the supplied documents. The technical matter has an assigned owner. The proposed opening is consistent with the market arrangements.',
  },
  marketArrangements: {
    id: 'Market 7/B',
    text: 'The ceremony has been arranged. Notices for the market carts are prepared. The gatekeeper and ferry master are waiting for the royal order. This note records logistics; it contains no assessment of the bridge structure.',
  },
  inspection: {
    id: 'Inspection 17/A',
    text: [
      'A fracture has been observed in a primary support of the East Bridge.',
      'Capacity under ordinary traffic has not been established. Structural failure cannot be excluded.',
      'Keep the bridge closed until an independent assessment is complete.',
    ],
  },
  dispatches: [
    'Gatekeeper: admit ordinary traffic at first light.',
    'Ferry master: stand down the temporary crossing service.',
    'Herald: direct the market carts to the East Bridge.',
  ],
};

// These are documents in the fictional scene, not live work or visitor statistics.
// The desk model adds a recommendation and an underlying record to each catalogue entry.
export const waitingFiles = [
  ['Approve the western ferry contract', 'River office'],
  ['Reassign the eastern night watch', 'Marshal'],
  ['Release the winter grain reserve', 'Granary'],
  ['Renew the mill operating charter', 'Works office'],
  ['Clear the northern road for carts', 'Road office'],
  ['Approve the treasury guarantee', 'Treasurer'],
  ['Change the floodgate standing order', 'River office'],
  ['Merge the village inspection rounds', 'Works office'],
  ['Dismiss the redundant bridge keeper', 'Steward'],
  ['Move the infirmary supply convoy', 'Quartermaster'],
  ['Lease the common pasture', 'Land office'],
  ['Reduce the archive retention period', 'Royal archive'],
  ['Accept the foundry delivery', 'Quartermaster'],
  ['Close the old market entrance', 'Gatekeeper'],
  ['Transfer the southern toll rights', 'Treasurer'],
  ['Alter the emergency messenger route', 'Herald'],
  ['Confirm the quarry extension', 'Works office'],
  ['Release the repair bond', 'Treasurer'],
  ['Combine the fire watch rosters', 'Marshal'],
  ['Retire the reserve ferry crew', 'River office'],
  ['Approve the aqueduct maintenance note', 'Works office'],
  ['Change the granary access list', 'Granary'],
  ['Renew the eastern road exemption', 'Road office'],
  ['Send the remaining petitions to the steward', 'Council'],
];

export function initialCourtState() {
  return { reviewed: false, discovered: false, decision: null, delegated: false };
}

export function courtTransition(state, action) {
  switch (action) {
    case 'review': return { ...state, reviewed: true };
    case 'inspect': return { ...state, discovered: true };
    case 'approve': return state.decision ? state : { ...state, decision: 'approved' };
    case 'withhold': return state.decision ? state : { ...state, decision: 'withheld' };
    case 'delegate': return state.discovered ? { ...state, delegated: true } : state;
    case 'reset': return initialCourtState();
    default: return state;
  }
}
