//@flow
import React, { Component } from "react";
import icons from "../icons";
import { iconByVegType } from "../iconForSpecies";

const typeText = {
  leaf: "Feuilles",
  root: "Racines",
  fruit: "Fruits",
  flower: "Fleurs"
};

const vegTypeForConstellation = {
  Pisces: "leaf",
  Aries: "fruit",
  Taurus: "root",
  Gemini: "flower",
  Cancer: "leaf",
  Leo: "fruit",
  Virgo: "root",
  Libra: "flower",
  Scorpio: "leaf",
  Sagittarius: "fruit",
  Capricorn: "root",
  Aquarius: "flower",
};

function moonVegType (moon) {
  return vegTypeForConstellation[moon.constellation];
}

import "./MoonVegType.css";

export default class MoonVegType extends Component {
  props: {
    moon: *,
  };
  render() {
    const { moon } = this.props;
    const type = moonVegType(moon);
    return <span className="moonVegType">
      Jour {typeText[type]}
      <img alt="" src={icons[iconByVegType[type]]} style={{ verticalAlign: "middle", marginLeft: 2, height: 10 }} />
    </span>;
  }
}
