import React, { Component, PureComponent } from "react";
import areaPolygon from "area-polygon";
import uniq from "lodash/uniq";
import flatMap from "lodash/flatMap";
import get from "lodash/get";
import "./App.css";
import moment from "moment";
import debounce from "lodash/debounce";
import "moment/locale/fr";
moment.locale("fr");
import mooncalc from "./logic/mooncalc";
import consumeEventsForDate from "./logic/consumeEventsForDate";

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

const CALS = [ "seedling_indoors", "seedling_outdoors_or_planting", "harvest" ];
const CAL_FOR_ACTION = {
  indoors: "seedling_indoors",
  outdoors: "seedling_outdoors_or_planting",
  replant: "seedling_outdoors_or_planting",
  harvest: "harvest",
};
const ACTION_TEXT = {
  indoors: "Semer au chaud",
  outdoors: "Semer dehors",
  replant: "Replanter",
  harvest: "Récolter",
};
const ACTION_COLORS = {
  indoors: "#F50",
  outdoors: "#3C0",
  replant: "#09C",
  harvest: "#F09",
};

import icons from "./icons";
const iconTypeFallback = {
  leaf: "generic-leaf",
  fruit: "generic-fruit",
  flower: "generic-flower",
  root: "generic-root",
};
const iconForSpecies = species =>
  icons[species.icon || species.family.icon || iconTypeFallback[species.family.types[0]]];

const groupByReducer = (groupFn) => (acc, el) => {
  const group = groupFn(el);
  return {
    ...acc,
    [group]: (acc[group] || []).concat([ el ]),
  };
};

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

function moonIsAscending (moon) {
  const { ecliptic: { longitude } } = moon;
  return longitude < 93.44 || longitude >= 271.26;
}

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

class MoonPhase extends Component {
  render() {
    const { moon } = this.props;
    return <span className="moonPhase" title={moon.phase}>{moonPhaseAscii(moon)}</span>;
  }
}

class CalendarCursor extends PureComponent {
  static defaultProps = {
    fromYear: 2016,
    toYear: new Date().getFullYear()+2,
  };

  onScrollRef = scrollContainer => {
    this.scrollContainer = scrollContainer;
  };

  onTodayRef = todayDiv => {
    if (todayDiv) {
      this.todayDiv = todayDiv;
    }
  };

  onScroll = e => {
    const { date, onChange } = this.props;
    const { scrollContainer, todayDiv } = this;
    const containerRect = scrollContainer.getBoundingClientRect();
    const todayRect = todayDiv.getBoundingClientRect();
    const diff = containerRect.height / 2 - todayRect.top;
    const dayAdd = diff / 20;
    onChange(moment(date).add(dayAdd, "day").toDate());
  };

  debouncedSyncScroll = debounce(this.onScroll, 100);

  componentDidMount () {
    this.syncScroll();
  }
  componentDidUpdate () {
    this.debouncedSyncScroll();
  }

  syncScroll () {
    const { scrollContainer, todayDiv } = this;
    if (todayDiv) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const todayRect = todayDiv.getBoundingClientRect();
      scrollContainer.scrollTop = todayRect.top - containerRect.top - containerRect.height / 2;
    }
  }
  render() {
    const { date, fromYear, toYear } = this.props;
    const dateDay = moment(date).startOf("day");

    const style = {
      position: "fixed",
      top: 0,
      left: 0,
      height: "100%",
      width: 100,
    };
    const scrollContainerStyle = {
      overflow: "scroll",
      height: "100%",
    };

    const years = [];
    for (let y = fromYear; y < toYear; y++) {
      const months = [];
      for(let m=0; m<12; m++) {
        const days = [];
        for(
          let t = moment({ day: 1, month: m, year: y });
          t.month()===m;
          t = t.add(1, "day")
        ) {
          const today = t.isSame(dateDay);
          const style = {
            height: "20px",
            color: today ? "#000" : "#999",
            fontWeight: today ? "bold" : "normal",
          };
          days.push(
            <div key={t.format("DD")} ref={today ? this.onTodayRef : null} style={style}>
              {t.format("DD")}
            </div>
          );
        }
        months.push(
          <div key={m}>
            <strong>{moment({ day: 1, month: m, year: y }).format("MMMM YYYY")}</strong>
            {days}
          </div>
        );
      }
      years.push(
        <div key={y}>
          {months}
        </div>
      );
    }

    return <div style={style}>
      <div
        style={scrollContainerStyle}
        ref={this.onScrollRef}
        onScroll={this.onScroll}>
        {years}
      </div>
      <div style={{
        position: "absolute",
        top: "50%",
        width: "100%",
        border: "1px solid #000",
      }} />
    </div>;
  }
}

class MoonProgression extends Component {
  render() {
    const { moon } = this.props;
    return <span className="moonProgression">{
      moonIsAscending(moon)
      ? "Montante"
      : "Descendante"
    }</span>;
  }
}

class MoonVegType extends Component {
  render() {
    const { moon } = this.props;
    return <span className="moonVegType">Jour {
      ({
        leaf: "Feuilles",
        root: "Racines",
        fruit: "Fruits",
        flower: "Fleurs"
      })[moonVegType(moon)]
    }</span>;
  }
}

class Seedling extends Component {
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

class Months extends Component {
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

class SpeciesDetail extends Component {
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

    return <details className="seed">
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

const actionMoonSatisfied = {
  indoors: moon => moonIsAscending(moon),
  outdoors: moon => moonIsAscending(moon),
  replant: moon => !moonIsAscending(moon),
  harvest: moon => moon.age < 12.91963,
};

class JobsInfo extends Component {
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

class SpeciesList extends Component {
  render() {
    const {date, data, month, moon} = this.props;
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
        const aHaveJobs = a.jobs.length>0;
        const bHaveJobs = b.jobs.length>0;
        if (aHaveJobs !== bHaveJobs) {
          return bHaveJobs - aHaveJobs;
        }
        const aHaveSeedling = !!a.seedlingPath;
        const bHaveSeedling = !!b.seedlingPath;
        if (aHaveSeedling !== bHaveSeedling) {
          return bHaveSeedling - aHaveSeedling;
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
            {seedling
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
                  ? " " + moment(seedlingSection.seedlingDate).from(date)
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

class SvgShape extends Component {
  render() {
    const { object, transform, ...rest } = this.props;
    if (object.polygon) {
      const d = object.polygon.map((p, i) =>
        (i===0?"M":"L")+transform.transformPoint(p)
      ).join(" ")+" Z";
      return <path d={d} {...rest} />;
    }
    if (object.rectangle) {
      const [ x, y, width, height ] = transform.transformRect(object.rectangle);
      return <rect {...{ ...rest, x, y, width, height }} />;
    }
    if (object.circle) {
      const [ cx, cy, r ] = transform.transformCircle(object.circle);
      return <circle {...{ ...rest, cx, cy, r }} />;
    }
    console.warn("SvgShape, not drawable:", object);
    return null;
  }
}

const shapeArea = object =>
  object.circle
  ? Math.pow(object.circle[2], 2) * Math.PI
  : object.rectangle
  ? object.rectangle[2] * object.rectangle[3]
  : object.polygon
  ? areaPolygon(object.polygon)
  : 0;

const PlotFillSizePerVegType = {
  leaf: "#060",
  fruit: "#922",
  flower: "#c90",
  root: "#532",
};

class SvgPlot extends Component {
  getScale = () => this.props.scale * this.props.plot.scale;
  transformPoint = (p) => {
    const scale = this.getScale();
    return [
      scale * p[0],
      scale * p[1],
    ];
  };
  transformRect = (r) => {
    const scale = this.getScale();
    return [
      scale * r[0],
      scale * r[1],
      scale * r[2],
      scale * r[3],
    ];
  };
  transformCircle = (c) => {
    const scale = this.getScale();
    return [
      scale * c[0],
      scale * c[1],
      scale * c[2],
    ];
  };
  render() {
    const {date, plot, scale} = this.props;
    const cellSize = plot.scale * scale;
    const area = Math.round(shapeArea(plot) * plot.scale * plot.scale / 10000);
    return (
      <g>
        <SvgShape object={plot} transform={this} fill="#953" />
      {plot.cells.map((cell, i) => {
        const xi = i % plot.grid[0];
        const yi = (i - xi) / plot.grid[0];
        let fill = "none", imageSrc, title = `(${xi},${yi}) `;
        if (cell) {
          switch (cell.type) {
          case "culture": {
            const {species} = cell;
            const {family} = species;
            fill = PlotFillSizePerVegType[family.types[0]];
            const maybeIcon = iconForSpecies(species);
            imageSrc = maybeIcon;
            title += `${cell.species.generic||""} ${cell.species.name||""}`;
            const meta = [
              cell.seedlingDate ? "semé "+moment(cell.seedlingDate).from(date) : null,
              cell.plantDate ? "planté "+moment(cell.plantDate).from(date) : null,
              cell.transplantDate ? "replanté "+moment(cell.transplantDate).from(date) : null,
            ].filter(o => o);
            if (meta.length) {
              title += " (" + meta.join(", ") + ")";
            }
            break;
          }
          default:
          }
        }
        return (
        <g
          key={i}
          transform={`translate(${xi*cellSize}, ${yi*cellSize})`}>
          <title>{title}</title>
          <rect
            x={0}
            y={0}
            width={cellSize}
            height={cellSize}
            fill={fill}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={1}
          />
          { imageSrc
            ? <image
                href={imageSrc}
                x={0}
                y={0}
                width={cellSize}
                height={cellSize}
              />
            : null }
        </g>
        );
      })}

        <text style={{
          color: "rgba(0,0,0,0.3)",
          fontSize: "10px",
        }}>
          {area}m²
        </text>
      </g>
    );
  }
}

class SvgTree extends Component {
  render() {
    const { transform, object } = this.props;
    const [x, y] = transform.transformPoint(object.position);
    const r = transform.transformRadius(20);
    return <circle cx={x} cy={y} r={r} fill="#030" />;
  }
}

const terrainTypeColors = {
  grass: "#6A5",
  stone: "#ccc",
  concrete: "#aaa",
};
const objectTypeColors = {
  "garden-hut": "#932",
  "house": "#333",
  "hedge": "#061",
  "water-tank": "#29f",
};

class SvgGenericObject extends Component {
  render() {
    const { object, ...rest } = this.props;
    return <SvgShape {...rest} object={object} fill={objectTypeColors[object.type]} />;
  }
}

const objectTypeComponents = {
  tree: SvgTree,
};

class Map extends Component {
  static defaultProps = {
    scale: 1,
    padding: 4,
  };
  transformPoint = (p) => {
    const { scale, data: { mapBound } } = this.props;
    return [
      scale * (p[0] - mapBound[0]),
      scale * (p[1] - mapBound[1]),
    ];
  };
  transformRect = (r) => {
    const { scale, data: { mapBound } } = this.props;
    return [
      scale * (r[0] - mapBound[0]),
      scale * (r[1] - mapBound[1]),
      scale * r[2],
      scale * r[3],
    ];
  };
  transformCircle = (c) => {
    const { scale, data: { mapBound } } = this.props;
    return [
      scale * (c[0] - mapBound[0]),
      scale * (c[1] - mapBound[1]),
      scale * c[2],
    ];
  };
  transformRadius = (r) => {
    const { scale } = this.props;
    return scale * r;
  };
  render() {
    const {data, scale, padding} = this.props;
    const { map, mapBound } = data;
    const [width, height] = this.transformPoint([
      mapBound[0] + mapBound[2],
      mapBound[1] + mapBound[3]
    ]);
    return <div className="map">
      <svg width={width+2*padding} height={height+2*padding}>
        <g transform={`translate(${padding},${padding})`}>
          <g>
            {map.terrains.map((terrain, i) =>
              <SvgShape
                key={i}
                object={terrain}
                transform={this}
                fill={terrainTypeColors[terrain.type]}
              />
            )}
          </g>
          <SvgShape
            object={map}
            transform={this}
            strokeWidth={1}
            stroke="black"
            fill="none"
          />
          <g>
            {data.objects.map((object, i) => {
              const ObjectTypeComponent = objectTypeComponents[object.type] || SvgGenericObject;
              return <g key={object.id}>
                <title>{object.title||object.id}</title>
                <ObjectTypeComponent
                  object={object}
                  transform={this}
                />
              </g>;
            })}
          </g>
          <g>
            {Object.keys(data.plots).map(plotkey => {
              const plot = data.plots[plotkey];
              return (
                <g key={plotkey} transform={`translate(${this.transformPoint(plot.position)})`}>
                  <SvgPlot
                    scale={scale}
                    plot={plot}
                    data={data}
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>;
  }
}

class App extends Component {
  state = {
    date: new Date(),
  };
  onDateChange = date => {
    this.setState({ date });
  };
  render() {
    const { date } = this.state;
    const data = consumeEventsForDate(date);
    const moon = mooncalc(date);
    const month = date.getMonth();

    const seedlingGroups =
    Object.keys(data.seedlings)
      .map(key => ({
        key,
        value: data.seedlings[key],
      }))
      .reduce(groupByReducer(el => el.value.group), {});

    return (
      <div className="App">

        <CalendarCursor
          date={date}
          onChange={this.onDateChange}
        />

        <div className="App-header">
          <h2><img alt="" src={icons.sprout} style={{ height: 40, verticalAlign: "middle", marginRight: 4 }} /> Le Jardin de Gaëtan</h2>
          <a target="_blank" href="https://github.com/gre/jardin" style={{ position: "absolute", top: 4, right: 4 }}>
            Github
          </a>
        </div>

        <div className="App-body">

          <div className="moonContainer">
            <div className="moon">
              <MoonPhase moon={moon} />
              &nbsp;
              <MoonProgression moon={moon} />
              &nbsp;
              <MoonVegType moon={moon} />
            </div>
          </div>

          <div className="seedlings">
            <div className="seedling-group">
            {[
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

          <Map
            date={date}
            data={data}
            scale={0.5}
          />

          <SpeciesList month={month} data={data} moon={moon} date={date} />
        </div>
      </div>
    );
  }
}

export default App;
