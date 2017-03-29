//@flow
import React, { Component } from "react";

export default class SvgShape extends Component {
  render() {
    const { object, transform, ...rest } = this.props;
    if (object.polygon) {
      const d = object.polygon.map((p, i) =>
        (i===0?"M":"L")+transform.transformPoint(p)
      ).join(" ")+" Z";
      return <path d={d} {...rest} />;
    }
    if (object.rectangle) {
      const [ x, y, width, height ] = transform.transformRect(object.rectangle);
      return <rect {...{ ...rest, x, y, width, height }} />;
    }
    if (object.circle) {
      const [ cx, cy, r ] = transform.transformCircle(object.circle);
      return <circle {...{ ...rest, cx, cy, r }} />;
    }
    console.warn("SvgShape, not drawable:", object);
    return null;
  }
}
