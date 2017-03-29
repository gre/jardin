//@flow
import React, { Component } from "react";
import moonIsAscending from "../logic/moonIsAscending";
import Months from "./Months";

const actionMoonSatisfied = {
  indoors: moon => moonIsAscending(moon),
  outdoors: moon => moonIsAscending(moon),
  replant: moon => !moonIsAscending(moon),
  harvest: moon => moon.age < 12.91963,
};

const ACTION_TEXT = {
  indoors: "Semer au chaud",
  outdoors: "Semer dehors",
  replant: "Replanter",
  harvest: "Récolter",
};

export const ACTION_COLORS = {
  indoors: "#F50",
  outdoors: "#3C0",
  replant: "#09C",
  harvest: "#F09",
};

export default class JobsInfo extends Component {
  props: {
    month: *,
    jobs: Array<*>,
    moon: *,
  }
  render() {
    const { month, jobs, moon } = this.props;
    return <div style={{ padding: 10 }}>{jobs.map(({ months, calendarName, action }, i) =>
      <Months
        key={i}
        color={ACTION_COLORS[action]}
        month={month}
        months={months}>
        <span style={{ marginLeft: 8, fontSize: "12px" }}>
          {calendarName}
          {" à "}
          <strong style={{ textDecoration: "underline" }}>{ACTION_TEXT[action]}</strong>
          <em style={{ marginLeft: 8 }}>{
            actionMoonSatisfied[action](moon)
            ? "👌 la lune est d'accord"
            : ""
          }</em>
        </span>
      </Months>
    )}</div>;
  }
}
