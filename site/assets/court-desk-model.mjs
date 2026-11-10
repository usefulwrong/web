import { courtFile, waitingFiles, initialCourtState } from './court-file-model.mjs';

export const bridgeLayers = [
  { kind: 'royal', office: 'The royal council', reference: '17 / D', title: 'Concerning the East Bridge', body: courtFile.warrant, signature: 'Your faithful steward', note: 'Prepared for the royal seal' },
  { kind: 'council', office: 'The steward / coordinating agent', reference: '17 / C', title: 'One decision for the Crown', body: [courtFile.steward.result], signature: 'The steward', note: 'Given: the works summary and the market arrangements.', instruction: courtFile.steward.task },
  { kind: 'works', office: 'The clerk / summarising agent', reference: '17 / B', title: 'A local technical matter', body: [courtFile.clerk.result], signature: 'The clerk of works', note: 'Given: Inspection 17/A.', instruction: courtFile.clerk.task },
  { kind: 'inspection', office: 'Bridge inspection / field record', reference: '17 / A', title: 'Primary support: fracture', body: courtFile.inspection.text, signature: 'District inspector', note: 'No subsequent inspection or repair is recorded.' },
];

// Each envelope has an actual recommendation and a source the reader can inspect.
const evidence = [
  ['The western ferry operator is ready to take over the crossing.', 'The vessel certificate covers summer flow. The present river level is outside the conditions named in it.'],
  ['Concentrating the night watch at the market will improve coverage where crowds are expected.', 'The eastern houses will have no patrol. The revised roster includes no replacement for their fire watch.'],
  ['The winter reserve can cover the current grain shortage.', 'The inventory combines food grain and seed grain. The proposed release does not distinguish between them.'],
  ['The mill charter is ready for renewal on its existing terms.', 'The inspection is signed. The drive guards, emergency stop and access route were checked; no exception is outstanding.'],
  ['The northern road is ready to receive the diverted market carts.', 'The latest road note predates the landslip. No examination of the retaining wall is attached.'],
  ['The proposed guarantee will secure the merchants’ winter deliveries.', 'The guarantee contains an uncapped obligation if the supplier defaults. The summary records only the delivery benefit.'],
  ['The revised floodgate schedule will maintain a steady water supply.', 'The schedule uses ordinary flow conditions. The flood watch has not cleared the current upstream readings.'],
  ['Combining inspection rounds will remove duplicate work.', 'Both teams were reading the same contractor’s summary. Their independent site visits are what the new plan removes.'],
  ['The bridge keeper’s duties have been absorbed by the new arrangements.', 'The keeper is the only person assigned to check the support after heavy rain. That duty has no new owner.'],
  ['Moving the infirmary convoy to the East Bridge will shorten the journey.', 'The route depends on Warrant 17/D. No separate assessment of the bridge was supplied to the convoy planner.'],
  ['The common pasture lease has been agreed with the affected households.', 'The recorded consents match the proposed boundary. The winter access path remains outside the leased area.'],
  ['A shorter retention period will reduce the archive backlog.', 'The proposed deletion includes the underlying inspection records. Only the council summaries would remain.'],
  ['The foundry delivery is ready for acceptance and payment.', 'The delivered pieces match the order. Sample checks and weights are recorded, with no unresolved exception.'],
  ['Closing the old market entrance will simplify crowd management.', 'The old entrance is also the secondary exit. The crowd plan does not show another route in its place.'],
  ['The southern toll transfer is ready to be entered in the register.', 'The transfer includes emergency passage charges. That exception was omitted from the short commercial note.'],
  ['The new messenger route will reduce unnecessary travel.', 'It removes the night stop at the flood watch. The watch’s warning now waits for the following morning’s courier.'],
  ['The quarry extension will provide the stone requested by the works office.', 'The extension reaches the retaining slope above occupied houses. The attached assessment covers the old boundary.'],
  ['The repair bond can be released now that the contractor has submitted its completion note.', 'The completion note records work done. The independent acceptance inspection is still marked as outstanding.'],
  ['The combined fire roster maintains the required number of people on duty.', 'The total is correct. On the new roster every trained pump operator is assigned to the same watch.'],
  ['The reserve ferry crew can be retired after the bridge reopens.', 'The contingency plan names this crew if the bridge closes. No alternative crew is assigned.'],
  ['The aqueduct maintenance note is ready for the council’s acceptance.', 'The repair was inspected and the isolation valves tested. The signed return-to-service record is attached.'],
  ['The new granary access list reflects the current office assignments.', 'The change gives the same office permission both to release stock and to certify the release record.'],
  ['Renewing the road exemption preserves the existing emergency access.', 'The map and the written exception agree. The gatekeeper has acknowledged the emergency passage instructions.'],
  ['The steward can dispose of routine petitions and bring forward only matters requiring the Crown.', 'The steward will decide what counts as routine. No separate reviewer is assigned to inspect the petitions withheld from the king.'],
];

export const pendingCases = waitingFiles.map(([title, office], index) => ({
  id: `waiting-${index}`, title, office, reference: `Q / ${index + 1}`,
  recommendation: evidence[index][0], source: evidence[index][1],
}));

export function decidePending(decisions, index, verdict) {
  if (!Number.isInteger(index) || index < 0 || index >= pendingCases.length) return decisions;
  if (!['approved', 'withheld'].includes(verdict) || Object.hasOwn(decisions, index)) return decisions;
  return { ...decisions, [index]: verdict };
}

export function pendingCount(decisions) {
  return pendingCases.length - Object.keys(decisions).filter(key => Number.isInteger(Number(key)) && Object.hasOwn(pendingCases, key) && ['approved', 'withheld'].includes(decisions[key])).length;
}

export function readCourtSession(value) {
  const result = { version: 1, state: initialCourtState(), decisions: {}, crowded: false };
  if (!value || value.version !== 1) return result;
  const saved = value.state || {};
  result.state.reviewed = saved.reviewed === true;
  result.state.discovered = saved.discovered === true;
  result.state.decision = ['approved', 'withheld'].includes(saved.decision) ? saved.decision : null;
  result.state.delegated = result.state.discovered && saved.delegated === true;
  result.crowded = result.state.discovered && (value.crowded === true || result.state.delegated);
  if (result.crowded && value.decisions && typeof value.decisions === 'object') {
    for (const [key, verdict] of Object.entries(value.decisions)) {
      if (String(Number(key)) === key) result.decisions = decidePending(result.decisions, Number(key), verdict);
    }
  }
  return result;
}
