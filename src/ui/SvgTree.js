//@flow
import React, { Component } from "react";
import icons from "../icons";

export default class SvgTree extends Component {
  props: {
    transform: *,
    object: *,
  };
  render() {
    const { transform, object } = this.props;
    const [x, y] = transform.transformPoint(object.position);
    const r = transform.transformRadius(200);
    return (
      <image
        href={icons["deciduous-tree"]}
        x={x - r/2}
        y={y - r}
        width={r}
        height={r}
      />
    );
  }
}
