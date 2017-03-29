//@flow
import React, { Component } from "react";
import uniq from "lodash/uniq";
import flatMap from "lodash/flatMap";
import iconForSpecies from "../iconForSpecies";
import Months from "./Months";
import {ACTION_COLORS} from "./JobsInfo";

import "./SpeciesDetail.css";
export default class SpeciesDetail extends Component {
  props: {
    data: *,
    species: *,
    month: number,
    children?: *,
  }
  render() {
    const {
      data,
      species,
      children,
      month,
    } = this.props;
    const {
      id,
      generic,
      name,
      desc,
      year,
      family,
      latin,
      bio,
      brand,
      country,
    } = species;
    const {
      germination_days,
      harvest_days,
      spacing_cm,
      calendars,
      likes,
      hates,
    } = family;

    const speciesForFamilyId = id =>
      Object.keys(data.species)
      .map(specId => data.species[specId])
      .filter(spec => spec.family.id === id);

    const renderAssociations = (ids, prefix, className) => {
      const species = uniq(flatMap(ids, speciesForFamilyId));
      if (species.length === 0) return null;
      return <p className={["associations", className].join(" ")}>
        <strong>{prefix}{" "}</strong>
        {species.map(seed => (seed.generic||"")+" "+(seed.name||"")).join(", ")}
      </p>
    };

    return <details className="species-detail">
      <summary title={id}>
        <img
          alt={family.id}
          src={iconForSpecies(species)}
          style={{ verticalAlign: "-4px", height: 24, marginRight: 4, }}
        />
        <strong>{generic}</strong>&nbsp;
        <span>{name}</span>&nbsp;
        { year ? <em>({year})&nbsp;</em> : null }
        {
          bio
          ? <span title={brand+", "+(country||"France")} style={{ color: "#0d0", fontWeight: "bold", fontSize: "0.8em" }}>BIO</span>
          : <em style={{ fontSize: "0.6em", color: "#930" }}>({brand||"?"}, {country||"France"})</em>}
        <em style={{ marginLeft: 10, fontSize: "0.6em" }}>{latin}</em>
        {children}
      </summary>
      <p style={{ opacity: 0.8, fontSize: "0.8em" }}>
        germination: {germination_days}j,
        récolte: {harvest_days}j,
        dist.graines: {spacing_cm}cm
      </p>
      {calendars.map((calendar, i) => <div key={i}>
        <p><strong>{calendar.name}</strong></p>
        <Months
          color={ACTION_COLORS.indoors}
          month={month}
          months={calendar.seedling_indoors_months||[]}>
          <span className="label">Semer au chaud</span>
        </Months>
        <Months
          color={ACTION_COLORS.outdoors}
          month={month}
          months={calendar.seedling_outdoors_or_planting_months||[]}>
          <span className="label">Semer dehors / Replanter</span>
        </Months>
        <Months
          color={ACTION_COLORS.harvest}
          month={month}
          months={calendar.harvest_months||[]}>
          <span className="label">Récolter</span>
        </Months>
      </div>)}
      <blockquote>{desc}</blockquote>
      {renderAssociations(likes, "✔︎ Adore: ", "likes")}
      {renderAssociations(hates, "❌ Déteste: ", "hates")}
    </details>;
  }
}
