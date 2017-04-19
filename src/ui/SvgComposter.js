//@flow
import React, { Component } from "react";
import icons from "../icons";

export default class SvgComposter extends Component {
  props: {
    transform: *,
    object: *,
  };
  render() {
    const { transform, object } = this.props;
    const [x, y, w, h] = transform.transformRect(object.rectangle);
    return (
      <image
        href={icons["compost-heap"]}
        x={x}
        y={y}
        width={w}
        height={h}
      />
    );
  }
}
