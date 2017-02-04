import events from "../../data/events.json";
import families from "../../data/families.json";

function sortByDate (a, b) {
  return new Date(a.date) - new Date(b.date);
}

const initialState = {
  photos: [],
  waterTanks: {},
  families,
  seeds: {},
  seedling: {},
  garden: {},
  compost: { level: 0 },
};
const initialAreas = {
  ranges: [],
  elements: [],
};

function updateArea (areas, range, areaUpdate) {
  areas = {
    ranges: [...areas.ranges],
    elements: [...areas.elements],
  };
  if (!range) range=[0,1];
  const [from,to] = range;
  if (areas.ranges.length===0) {
    areas.ranges = [1];
    areas.elements = [areaUpdate(null)];
  }
  // TODO: implement the splitting of range..
  return areas;
}

function reducer (state, event) {
  state = { ...state };
  switch (event.type) {
  case "photo":
    state.photos = [ ...state.photos, event ];
    break;
  case "water-tank-status":
    state.waterTanks = { ...state.waterTanks };
    state.waterTanks[event.item] = event.value;
    break;
  case "add-seeds":
    state.seeds = {...state.seeds};
    state.seeds[event.species] = {
      ...event,
    };
    break;
  case "compost-status":
    state.compost = {...state.compost};
    state.compost.level = event.level;
    break;
  case "start-seedling":
    state.seedling = {...state.seedling};
    const item =
      !(event.item in state.seedling)
      ? { areas: initialAreas }
      : { ...state.seedling[event.item] };
    item.areas = updateArea(item.areas, event.boxRange, (area) => {
      return area;
    });;
    state.seedling[event.item] = item;
    break;
  }
  return state;
}

export default (date) =>
  [...events]
  .filter(e => new Date(e.date) <= date)
  .sort(sortByDate)
  .reduce(reducer, initialState);
