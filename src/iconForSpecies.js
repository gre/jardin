//@flow
import icons from "./icons";

export const iconByVegType = {
  leaf: "generic-leaf",
  fruit: "generic-fruit",
  flower: "generic-flower",
  root: "generic-root",
};

export default (species: *) =>
  icons[species.icon || species.family.icon || iconByVegType[species.family.types[0]]];
