//@flow
import React, { Component } from "react";

const phaseIcons = {
  "NEW": "🌑",
  "Waxing crescent": "🌒",
  "First quarter": "🌓",
  "Waxing gibbous": "🌔",
  "FULL": "🌕",
  "Waning gibbous": "🌖",
  "Last quarter": "🌗",
  "Waning crescent": "🌘",
};

function moonPhaseAscii (moon) {
  return phaseIcons[moon.phase];
}

export default class MoonPhase extends Component {
  props: {
    moon: *
  };
  render() {
    const { moon } = this.props;
    return <span className="moonPhase" title={moon.phase}>{moonPhaseAscii(moon)}</span>;
  }
}
