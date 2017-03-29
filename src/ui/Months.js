//@flow
import React, { Component } from "react";

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "September",
  "Octobre",
  "Novembre",
  "Décembre"
];

import "./Months.css";

export default class Months extends Component {
  render() {
    const { color, month, months, children } = this.props;
    return <div className="months">
      <span className="body" style={{ color }}>
      {MONTHS.map((m,i) =>
        <span
          key={i}
          className={[
            "month",
            (months.indexOf(i+1)===-1?"off":"on"),
            i+1===month ? "current" : ""
          ].join(" ")}>
          {m.slice(0, 1)}
        </span>)}
      </span>
      {children}
    </div>;
  }
}
