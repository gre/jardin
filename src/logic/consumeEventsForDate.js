import invariant from "invariant";
import events from "../../data/events.json";
import families from "../../data/families.json";

const initialState = {
  photos: [],
  waterTanks: {},
  families,
  plots: {},
  species: {},
  seeds: {},
  seedlings: {},
  garden: {},
  compost: { level: 0 },
  lastEvent: null,
};

function reducer (state, event) {
  console.log(event);
  invariant(event.date, "event %s have a date", event);
  if (state.lastEvent) {
    invariant(new Date(state.lastEvent.date)<=new Date(event.date), "event %s is before previous event %s", event, state.lastEvent);
  }
  state = { ...state, lastEvent: event };
  switch (event.op) {
  case "photo": {
    state.photos = [ ...state.photos, event ];
    break;
  }
  case "water-tank-status": {
    state.waterTanks = { ...state.waterTanks };
    state.waterTanks[event.id] = event.value;
    break;
  }
  case "add-species": {
    invariant(!(event.species in state.species), "species %s does not exist yet in state.species", event.species);
    state.species = {...state.species};
    state.species[event.species] = {
      ...event,
    };
    break;
  }
  case "add-seeds": {
    invariant(event.species in state.species, "species %s exists in state.species", event.species);
    state.seeds = {...state.seeds};
    state.seeds[event.species] = {
      ...event,
    };
    break;
  }
  case "add-plot": {
    state.plots = {
      ...state.plots,
      [event.id]: event,
    };
    break;
  };
  case "plant-in-plot": {

    break;
  }
  case "compost-status": {
    state.compost = {...state.compost};
    state.compost.level = event.level;
    break;
  }
  case "add-seedling": {
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
    delete section.op;
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
    delete section.op;
    delete section.id;
    delete section.section;
    break;
  }
  case "etalage-compost": {
    break;
  }
  case "binage": {
    break;
  }
  default:
    invariant(false, "unsupported event %s", event.op);
  }
  return state;
}

export default (date) =>
  [...events]
  .filter(e => new Date(e.date) <= date)
  .reduce(reducer, initialState);
