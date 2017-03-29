//@flow
import React, { Component } from "react";
import moonIsAscending from "../logic/moonIsAscending";

export default class MoonProgression extends Component {
  props: {
    moon: *,
  }
  render() {
    const { moon } = this.props;
    return <span className="moonProgression">{
      moonIsAscending(moon)
      ? "Montante"
      : "Descendante"
    }</span>;
  }
}
