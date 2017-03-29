//@flow
import React, { Component } from "react";
import SvgShape from "./SvgShape";
import SvgTree from "./SvgTree";

const objectTypeComponents = {
  tree: SvgTree,
};

const objectTypeColors = {
  "garden-hut": "#932",
  "house": "#333",
  "hedge": "#061",
  "water-tank": "#29f",
};

export default class SvgMapObject extends Component {
  render() {
    const { object, ...rest } = this.props;
    const ObjectTypeComponent = objectTypeComponents[object.type];
    return (
      ObjectTypeComponent
      ? <ObjectTypeComponent {...this.props} />
      : <SvgShape
        {...rest}
        object={object}
        fill={objectTypeColors[object.type]}
      />
    );
  }
}
