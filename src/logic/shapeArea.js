//@flow
import areaPolygon from "area-polygon";

export default (object: *) =>
  object.circle
  ? Math.pow(object.circle[2], 2) * Math.PI
  : object.rectangle
  ? object.rectangle[2] * object.rectangle[3]
  : object.polygon
  ? areaPolygon(object.polygon)
  : 0;
