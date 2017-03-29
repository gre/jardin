//@flow
import React, { Component } from "react";
import iconForSpecies from "../iconForSpecies";

import "./Seedling.css";

export default class Seedling extends Component {
  render() {
    const {seedling} = this.props;
    return <div className={["seedling", seedling.group].join(" ")}>
      <div className="body">
      {(seedling.sections||[]).filter(section => section).map((section, i) => {
        const style = {
          lineHeight: "1.2em",
          fontSize: "0.2em",
          padding: "1em 0",
        };
        if (seedling.sectionSplitters) {
          const startSplit = (seedling.sectionSplitters||[])[i - 1] || 0;
          const endSplit = (seedling.sectionSplitters||[1])[i] || 1;
          style.position = "absolute";
          style.top = "0%";
          style.height = "100%";
          style.left = (100 * startSplit)+"%";
          style.width = (100 * (endSplit - startSplit))+"%";
        }
        const name = `${section.species.generic||""} ${section.species.name||""}`;
        return <div
          key={i}
          title={name}
          className={["section", "species-"+section.species.id].join(" ")}
          style={style}>
          <div>
            <img
              alt={section.species.family.id}
              src={iconForSpecies(section.species)}
              style={{ height: 12, verticalAlign: "middle", marginRight: 4 }}
            />
            <strong>
              {section.species.generic}
            </strong>
            &nbsp;
          </div>
          <div>
            {section.species.name}
          </div>
        </div>;
      })}
      </div>
      <div className="splitters">
      {(seedling.sectionSplitters||[]).map((split, i) =>
        <span
          key={i}
          className="splitter" style={{ left: (100 * split)+"%" }}
        />
        )}
      </div>
      <div className="decorator" />
      <div className="name">{seedling.name}</div>
    </div>;
  }
}
