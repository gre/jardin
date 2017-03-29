//@flow
import React, { Component } from "react";
import Seedling from "./Seedling";

const groupByReducer = (groupFn) => (acc, el) => {
  const group = groupFn(el);
  return {
    ...acc,
    [group]: (acc[group] || []).concat([ el ]),
  };
};

import "./Seedlings.css";

export default class Seedlings extends Component {
  props: {
    seedlings: *,
  };
  render () {
    const { seedlings } = this.props;
    const seedlingGroups =
      Object.keys(seedlings)
      .map(key => ({
        key,
        value: seedlings[key],
      }))
      .reduce(groupByReducer(el => el.value.group), {});
    return (
      <div className="seedlings">
        <div className="seedling-group">
        {[ // FIXME tmp stuff.. move to a table thing..
          "bac",
          "starter",
          "bigbox",
          "eggbox",
          "pots",
          "grid"
        ].map(group => (seedlingGroups[group]||[]).map(({ key, value }) =>
          <Seedling key={key} seedling={value} />
        ))}
        </div>
      </div>
    );
  }
}
