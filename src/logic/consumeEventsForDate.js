import invariant from "invariant";
import events from "../../data/events.json";
import families from "../../data/families.json";

const initialState = {
  photos: [],
  waterTanks: {},
  families,
  seeds: {},
  seedlings: {},
  garden: {},
  compost: { level: 0 },
  lastEvent: null,
};

function reducer (state, event) {
  invariant(event.date, "event %s have a date", event);
  if (state.lastEvent) {
    invariant(new Date(state.lastEvent.date)<=new Date(event.date), "event %s is before previous event %s", event, state.lastEvent);
  }
  state = { ...state, lastEvent: event };
  switch (event.type) {
  case "photo": {
    state.photos = [ ...state.photos, event ];
    break;
  }
  case "water-tank-status": {
    state.waterTanks = { ...state.waterTanks };
    state.waterTanks[event.item] = event.value;
    break;
  }
  case "add-seeds": {
    state.seeds = {...state.seeds};
    state.seeds[event.species] = {
      ...event,
    };
    break;
  }
  case "compost-status": {
    state.compost = {...state.compost};
    state.compost.level = event.level;
    break;
  }
  case "define-seedling": {
    state.seedlings = {...state.seedlings};
    let {sectionSplitters} = event;
    if (!sectionSplitters) sectionSplitters = [];
    state.seedlings[event.id] = {
      ...event,
      sections: [...sectionSplitters, 1].map(endPos => null),
    };
    break;
  }
  case "start-seedling": {
    state.seedlings = {...state.seedlings};
    invariant(event.box in state.seedlings, "%s is defined in seedling", event.box);
    const section = state.seedlings[event.box].sections[event.section||0] = { ...event };
    delete section.type;
    delete section.id;
    delete section.section;
    break;
  }
  case "status-germination": {
    state.seedlings = {...state.seedlings};
    let section = state.seedlings[event.box].sections[event.section||0];
    section = state.seedlings[event.box].sections[event.section||0] = {
      ...section,
      ...event,
    };
    delete section.type;
    delete section.id;
    delete section.section;
    break;
  }
  case "etalage-compost": {
    break;
  }
  default:
    invariant(false, "unsupported event %s", event.type);
  }
  return state;
}

export default (date) =>
  [...events]
  .filter(e => new Date(e.date) <= date)
  .reduce(reducer, initialState);
