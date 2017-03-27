import invariant from "invariant";
import events from "../../data/events.json";
import families from "../../data/families.json";

const initialState = {
  map: null,
  mapBound: null,
  objects: [],
  plots: {},
  species: {},
  seeds: {},
  seedlings: {},
  lastEvent: null,
};


function getBoundRect (obj) {
  if (obj.polygon) {
    const minX = obj.polygon.reduce((min, pos) => Math.min(pos[0], min), 0);
    const minY = obj.polygon.reduce((min, pos) => Math.min(pos[1], min), 0);
    const maxX = obj.polygon.reduce((max, pos) => Math.max(pos[0], max), 0);
    const maxY = obj.polygon.reduce((max, pos) => Math.max(pos[1], max), 0);
    return [ minX, minY, maxX-minX, maxY-minY ];
  }
  else if (obj.rect) {
    return obj.rect;
  }
  else {
    console.error("getBound can't not handle obj", obj);
  }
}

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
      const [ from, to ] = cursor.range || [ 0, seedling.sections.length ];
      seedling.sections = seedling.sections.map((section, i) => {
        if (i < from || i >= to) return section;
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
    const [ x, y, w, h ] = cursor.rectangle || [ 0, 0, ...plot.grid ];
    plot.cells = plot.cells.map((cell, i) => {
      const xi = i % plot.grid[0];
      const yi = (i - xi) / plot.grid[0];
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
  if (state.lastEvent && event.date) {
    invariant(new Date(state.lastEvent.date)<=new Date(event.date), "event %s is before previous event %s", event, state.lastEvent);
    state = { ...state, lastEvent: event };
  }
  switch (event.op) {
  case "define-map": {
    const { op, ...map } = event;
    state = {
      ...state,
      map,
      mapBound: getBoundRect(map),
    };
    break;
  }
  case "add-object": {
    const { op, ...object } = event;
    state = { ...state, objects: state.objects.concat(object) };
    break;
  }
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
    state.plots = {
      ...state.plots,
      [event.id]: {
        ...plot,
        cells: Array(plot.grid[0] * plot.grid[1]).fill(null),
      },
    };
    break;
  }
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
    if (event.sectionSplitters) {
      seedling.sectionSplitters = event.sectionSplitters;
      seedling.sections = event.sectionMoves.map(oldIndex => seedling.sections[oldIndex]);
    }
    else {
      seedling.sections = seedling.sections.slice(0, event.count||0);
    }
    state.seedlings = {
      ...state.seedlings,
      [event.box]: seedling,
    };
    break;
  }
  case "seed": {
    invariant(state.species[event.species], "species not found '%s'", event.species);
    state = consumeSeeds(state, event);
    invariant(event.at, "seed: 'at' field is required");
    state = updateSelection(state, event.at, cell => ({
      ...cell,
      type: "culture",
      seedsCount: event.count,
      species: state.species[event.species],
      seedlingDate: event.date,
    }));
    break;
  }
  case "remove-plant": {
    invariant(event.at, "remove-plant: at is required");
    state = updateSelection(state, event.at, section => null);
    break;
  }
  case "transplant": {
    let fromSection;
    state = updateSelection(state, event.from, section => {
      fromSection = section;
      return event.destructive ? null : section;
    });
    invariant(fromSection, "from was found");
    state = updateSelection(state, event.to, () => ({
      ...fromSection,
      transplantDate: event.date,
      count: event.countPerSection || 1,
    }));
    break;
  }
  case "plant": {
    state = updateSelection(state, event.at, cell => ({
      ...cell,
      type: "culture",
      species: state.species[event.species],
      plantDate: event.date,
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
  .filter(e => !e.date || new Date(e.date) <= date)
  .reduce(reducer, initialState);
