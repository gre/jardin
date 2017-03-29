//@flow
import React, { Component } from "react";
import get from "lodash/get";
import moment from "moment";
import icons from "../icons";
import JobsInfo from "./JobsInfo";
import SpeciesDetail from "./SpeciesDetail";

const CALS = [
  "seedling_indoors",
  "seedling_outdoors_or_planting",
  "harvest"
];

const CAL_FOR_ACTION = {
  indoors: "seedling_indoors",
  outdoors: "seedling_outdoors_or_planting",
  replant: "seedling_outdoors_or_planting",
  harvest: "harvest",
};

function getActionJobs (species, targetMonth, seedlingPath) {
  const jobs = {
    indoors: !species.family.seedlings_non_replantable && !seedlingPath,
    outdoors: !species.tuber,
    replant: seedlingPath || species.tuber,
    harvest: false, // TODO
  };
  const all = [];
  species.family.calendars.forEach(calendar => {
    CALS.forEach(cal => {
      const months = calendar[cal+"_months"];
      const i = months.indexOf(targetMonth);
      if (i !== -1) {
        Object.keys(CAL_FOR_ACTION).forEach(action => {
          if (CAL_FOR_ACTION[action]===cal && jobs[action]) {
            all.push({
              action,
              calendarName: calendar.name,
              months,
            });
          }
        });
      }
    });
  });
  return all;
}

function findSeedlingPathBySectionTest (seedlings, predicate) {
  let path = null;
  Object.keys(seedlings).find(k => {
    const seedling = seedlings[k];
    return seedling.sections.find((section, i) => {
      if (section && predicate(section)) {
        path = [ "seedlings", k, "sections", i ];
        return true;
      }
      return false;
    });
  });
  return path;
}

export default class SpeciesList extends Component {
  props: {
    data: *,
    month: number,
    moon: *,
  };
  render() {
    const {data, month, moon} = this.props;
    return <div>{
      Object.keys(data.species)
      .map(id => {
        const species = data.species[id];
        const seed = data.seeds[id];
        const seedlingPath = findSeedlingPathBySectionTest(
          data.seedlings,
          section => section.species.id === species.id
        );
        const jobs = !seed ? [] : getActionJobs(
          species,
          month + 1,
          seedlingPath
        );
        return { species, jobs, seedlingPath };
      })
      .sort((a, b) => {
        const aHaveJobs = a.jobs.length > 0;
        const bHaveJobs = b.jobs.length > 0;
        if (aHaveJobs !== bHaveJobs) {
          return Number(bHaveJobs) - Number(aHaveJobs);
        }
        const aHaveSeedling = !!a.seedlingPath;
        const bHaveSeedling = !!b.seedlingPath;
        if (aHaveSeedling !== bHaveSeedling) {
          return Number(bHaveSeedling) - Number(aHaveSeedling);
        }
        return a.species.id > b.species.id ? 1 : -1;
      })
      .map(({ species, jobs, seedlingPath }) => {
        const seedling = seedlingPath && get(data, seedlingPath.slice(0, 2));
        const seedlingSection = seedlingPath && get(data, seedlingPath);
        return <SpeciesDetail
            key={species.id}
            species={species}
            data={data}
            month={month}>
        { seedling || jobs.length
          ? <div style={{ fontSize: "14px", paddingLeft: 10, margin: 10, borderLeft: "2px solid #0F0" }}>
            {seedling && seedlingSection
              ?
              <div>
                semé dans
                <img
                  alt=""
                  src={icons.sprout}
                  style={{ height: 18, verticalAlign: -4 }}
                />
                <span style={{ color: "#0c0"}}>
                  {seedling.name}
                </span>
                { seedlingSection.seedlingDate
                  ? " " + moment(seedlingSection.seedlingDate).fromNow()
                  : null }
              </div>
              : null }
            { jobs.length
              ?
              <div>
                <JobsInfo
                  month={month+1}
                  jobs={jobs}
                  data={data}
                  moon={moon}
                />
              </div>
              : null }
          </div> : null }
        </SpeciesDetail>;
      })
    }</div>;
  }
}
