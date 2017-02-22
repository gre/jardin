import invariant from "invariant";
import events from "../../data/events.json";
import families from "../../data/families.json";

const initialState = {
  waterTanks: {},
  plots: {},
  species: {},
  seeds: {},
  seedlings: {},
  garden: {},
  compost: { level: 0 },
  lastEvent: null,
};

function consumeSeeds (state, event) {
  state = {...state};
  if (event.count) {
    state.seeds = {...state.seeds};
    const seed = state.seeds[event.species];
    if (seed.count) {
      const count = seed.count - event.count;
      if (count > 0) {
        state.seeds[event.species] = {
          ...seed,
          count,
        };
      }
      else {
        delete state.seeds[event.species];
      }
    }
  }
  return state;
}

function updateSelection (state, cursor, update) {
  state = {...state};
  if ("box" in cursor) {
    invariant(cursor.box in state.seedlings, "seedling '%s' is defined in seedlings", cursor.box);
    const seedling = { ...state.seedlings[cursor.box] };
    if ("section" in cursor) {
      invariant(cursor.section in seedling.sections, "section '%s' is defined in seedling.sections", cursor.section);
      seedling.sections = [...seedling.sections];
      seedling.sections[cursor.section] = update(seedling.sections[cursor.section]);
    }
    else {
      const [ from, length ] = cursor.range || [ 0, seedling.sections.length ];
      seedling.sections = seedling.sections.map((section, i) => {
        if (i < from || i >= length) return section;
        return update(section);
      });
    }
    state.seedlings = {
      ...state.seedlings,
      [cursor.box]: seedling,
    };
  }
  else if ("plot" in cursor) {
    invariant(cursor.plot in state.plots, "seedling '%s' is defined in plots", cursor.plot);
    const plot = { ...state.plots[cursor.plot] };
    const [ x, y, w, h ] = cursor.area || [ 0, 0, plot.gridW, Math.ceil(plot.grid.length/plot.gridW) ];
    plot.grid = plot.grid.map((cell, i) => {
      const xi = i % plot.gridW;
      const yi = (i - xi) / plot.gridW;
      if (xi < x || xi >= x + w) return cell;
      if (yi < y || yi >= y + h) return cell;
      return update(cell);
    });
    state.plots = {
      ...state.plots,
      [cursor.plot]: plot,
    };
  }
  return state;
}

function reducer (state, event) {
  //console.log(event);
  invariant(event.date, "event %s have a date", event);
  if (state.lastEvent) {
    invariant(new Date(state.lastEvent.date)<=new Date(event.date), "event %s is before previous event %s", event, state.lastEvent);
  }
  state = { ...state, lastEvent: event };
  switch (event.op) {
  case "add-species": {
    invariant(!(event.id in state.species), "species %s does not exist yet in state.species", event.id);
    const family = families.find(f => f.id === event.family);
    invariant(family, "species '%s': valid family field defined in families is required. Got '%s'", event.id, event.family);
    const { op, ...species } = event;
    state.species = {
      ...state.species,
      [event.id]: {
        ...species,
        family,
      },
    };
    break;
  }
  case "add-seeds": {
    invariant(event.species in state.species, "species %s exists in state.species", event.species);
    state.seeds[event.species] = event;
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
        grid: plot.dims.reduce((arr, dim) => arr.concat(
          Array(gridW).fill(null).map((_, i) => {
            if (i < dim[0] || i >= dim[1]) {
              return null;
            }
            return {
              type: "empty",
            };
          }),
        ), []),
      },
    };
    break;
  };
  case "add-seedling": {
    state.seedlings = {
      ...state.seedlings,
      [event.id]: {
        ...event,
        sections: Array(
          event.sectionSplitters
          ? event.sectionSplitters.length + 1
          : event.count || 1
        ).fill(null),
      }
    };
    break;
  }
  case "remove-seedling": {
    state.seedlings = { ...state.seedlings };
    delete state.seedlings[event.id];
    break;
  }
  case "seedling-resize": {
    invariant(event.box in state.seedlings, "seedling-resize: seedling '%s' should exist", event.box);
    state = {...state};
    const seedling = { ...state.seedlings[event.box] };
    seedling.sectionSplitters = event.sectionSplitters;
    seedling.sections = event.sectionMoves.map(oldIndex => seedling.sections[oldIndex]);
    state.seedlings = {
      ...state.seedlings,
      [event.box]: seedling,
    };
    break;
  }
  case "seed": {
    state = consumeSeeds(state, event);
    invariant(event.at, "seed: 'at' field is required");
    state = updateSelection(state, event.at, () => ({
      length_cm: 0,
      seedsCount: event.count,
      species: state.species[event.species],
      seedlingDate: event.date,
    }));
    break;
  }
  case "transplant": {
    // FIXME currently, transplant is not a partial op, do for the whole section
    let fromSection;
    state = updateSelection(state, event.from, section => {
      fromSection = section;
      return event.destructive ? null : section;
    });
    invariant(fromSection, "from was found");
    state = updateSelection(state, event.to, () => ({
      ...fromSection,
      transpantDate: event.date,
      count: event.countPerSection || 1,
    }));
    break;
  }
  case "plant": {
    state = consumeSeeds(state, event);
    state = updateSelection(state, event.at, cell => ({
      ...cell,
      type: "culture",
      species: event.species,
    }));
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
    state = updateSelection(state, event.at, section => ({
      ...section,
      length_cm: event.length_cm,
    }));
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
