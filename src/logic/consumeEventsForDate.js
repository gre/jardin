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
  case "add-species": {
    invariant(!(event.id in state.species), "species %s does not exist yet in state.species", event.id);
    state.species = {...state.species};
    const { op, ...species } = event;
    state.species[event.id] = species;
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
    const { op, ...plot } = event;
    const gridW = plot.dims.reduce((max, d) => Math.max(max, d[1]), 0);
    state.plots = {
      ...state.plots,
      [event.id]: {
        ...plot,
        gridW,
        gridH: plot.dims.length,
        grid: plot.dims.reduce((arr, dim) => {
          return arr.concat(
            Array(gridW).fill(null).map((_, i) => {
              if (i < dim[0] || i >= dim[1]) {
                return null;
              }
              return {
                type: "empty",
              };
            }),
          );
        }, []),
      },
    };
    break;
  };
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
  case "seed": {
    if (event.box) {
      state.seedlings = {...state.seedlings};
      invariant(event.box in state.seedlings, "%s is defined in seedling", event.box);
      const { count: seedsCount, species, date: seedlingDate } = event;
      state.seedlings[event.box].sections[event.section||0] = {
        length_cm: 0,
        seedsCount,
        species: state.species[species],
        seedlingDate,
      };
    }
    break;
  }
  case "plant": {
    console.log(event)
    break;
  }
  case "status-water-tank": {
    state.waterTanks = { ...state.waterTanks };
    state.waterTanks[event.id] = event.value;
    break;
  }
  case "status-compost": {
    state.compost = {...state.compost};
    state.compost.level = event.level;
    break;
  }
  case "status-germination": {
    state.seedlings = {...state.seedlings};
    const box = state.seedlings[event.box];
    const sectionIndex = event.section || 0;
    const {
      length_cm,
    } = event;
    box.sections[sectionIndex] = {
      ...box.sections[sectionIndex],
      length_cm,
    };
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
