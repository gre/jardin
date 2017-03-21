import React, { Component } from "react";
import raf from "raf";
import smoothstep from "smoothstep";
import uniq from "lodash/uniq";
import flatMap from "lodash/flatMap";
import get from "lodash/get";
import logo from "./logo.svg";
import "./App.css";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import mooncalc from "./logic/mooncalc";
import events from "../data/events.json";
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
const DAYS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi"
];

import icons from "./icons";
const iconTypeFallback = {
  leaf: "generic-leaf",
  fruit: "generic-fruit",
  flower: "generic-flower",
  root: "generic-root",
};
const iconForFamily = family =>
  icons[family.icon || iconTypeFallback[family.types[0]]];

const groupBy = (groupFn) => (acc, el) => {
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
    return <span title={moon.phase}>{moonPhaseAscii(moon)}</span>;
  }
}

class TimeTravelButton extends Component {
  state = {
    pressed: null,
  };
  componentDidMount () {
    let startTime = 0, lastT = 0;
    const loop = t => {
      if (!startTime) startTime = lastT = t;
      this._raf = raf(loop);
      this.update(t - lastT, t - startTime);
      lastT = t;
    };
    this._raf = raf(loop);
  }
  componentWillUnmount () {
    raf.cancel(this._raf);
  }
  onMouseDown = (e) => {
    e.preventDefault();
    this.setState({
      pressed: {
        time: Date.now(),
      },
    });
  };
  onMouseUp = () => {
    this.setState({
      pressed: null,
    });
  };
  onMouseEnter = () => {};
  onMouseLeave = () => {
    this.setState({
      pressed: null,
    });
  };
  update = (dt) => {
    const { onChange, backward, value } = this.props;
    const { pressed } = this.state;
    if (!pressed) return;
    const pressedDuration = Date.now() - pressed.time;
    const travel = Math.round(
      (backward ? -1 : 1)
      * dt
      * 10000
      * (1 + 100 * smoothstep(500, 10000, pressedDuration))
    );
    onChange(new Date(value.getTime() + travel));
  };
  render() {
    const { backward } = this.props;
    const { pressed } = this.state;
    // TODO: i want to render an animation, à la back-from-the-future
    return <button
      style={{ color: pressed ? "#E51" : "#333" }}
      onMouseDown={this.onMouseDown}
      onMouseUp={this.onMouseUp}
      onMouseEnter={this.onMouseEnter}
      onMouseLeave={this.onMouseLeave}>
      {backward ? "<=" : "=>"}
    </button>;
  }
}

class TimeTravel extends Component {
  render() {
    const {value, onChange} = this.props;
    const diff = Date.now() - value;
    const present = Math.abs(diff) < 60000;
    const future = !present && diff < 0;
    return <div className={[
      "time-travel",
      present
      ? "present"
      : future
        ? "future"
        : "past"
    ].join(" ")}>
      <TimeTravelButton backward value={value} onChange={onChange} />
      <div className="moment">
      {moment(value).calendar(null, {
        sameDay: "[Aujourd'hui à] LT",
        nextDay: "[Demain à] LT",
        nextWeek: "dddd [à] LT",
        lastDay: "[Hier à] LT",
        lastWeek: "dddd [dernier à] LT",
        sameElse : "[Le] LL [à] LT"
      })}
      </div>
      <TimeTravelButton value={value} onChange={onChange} />
    </div>;
  }
}


class Calendar extends Component {
  render() {
    /*
    const { date } = this.props;
    const firstDayOfMonth = moment(date).date(1);
    const lastDayOfMonth = moment(date).add(1, "month").date(1).subtract(1, "day");
    const weekFrom = firstDayOfMonth.week();
    const weekTo = lastDayOfMonth.week();
    console.log("days", firstDayOfMonth.toString(), lastDayOfMonth.toString());
    console.log("weeks", weekFrom, weekTo);
    console.log(moment(date).day(1).toString())
    return <div className="calendar">
      <div className="header">
        <span className="title">
          {moment(date).format("MMMM YYYY")}
        </span>
      </div>
      <div className="body">

      </div>
    </div>;
  */
   return null;
  }
}

class MoonProgression extends Component {
  render() {
    const { moon } = this.props;
    return <span>{
      moonIsAscending(moon)
      ? "Montante"
      : "Descendante"
    }</span>;
  }
}

class MoonVegType extends Component {
  render() {
    const { moon } = this.props;
    return <span>Jour {
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
        const date = `${section.seedlingDate}`;
        return <div
          key={i}
          title={name}
          className={["section", "species-"+section.species.id].join(" ")}
          style={style}>
          <div>
            <img
              src={iconForFamily(section.species.family)}
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
    const {color,months,label} = this.props;
    return <div className="months" style={{ color }}>
      <span className="body">
      {MONTHS.map((m,i) =>
        <span
          key={i}
          className={["month",(months.indexOf(i+1)===-1?"off":"on")].join(" ")}>
          {m.slice(0, 1)}
        </span>)}
      </span>
      <span className="label">{label}</span>
    </div>;
  }
}

class Plot extends Component {
  static defaultProps = {
    pixelRatio: window.devicePixelRatio || 1,
  };
  componentDidMount() {
    const {canvas} = this.refs;
    this.ctx = canvas.getContext("2d");
    this.draw();
  }
  componentDidUpdate() {
    this.draw();
  }
  draw() {
    const {plot, cellSize, pixelRatio} = this.props;
    const {ctx} = this;
    const size = cellSize * pixelRatio;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    plot.grid.map((cell, i) => {
      //ctx.globalAlpha = 0.9 + 0.1 * Math.random();
      const xi = i % plot.gridW;
      const yi = (i - xi) / plot.gridW;
      if (cell) {
        switch (cell.type) {
          case "empty":
            ctx.fillStyle = "#953";
            ctx.fillRect(xi * size, yi * size, size, size);
            break;

          case "culture":
            const family = cell.species.family;
            ctx.fillStyle = ({
              leaf: "#060",
              fruit: "#922",
              flower: "#c90",
              root: "#532",
            })[family.types[0]];
            ctx.fillRect(xi * size, yi * size, size, size);
            const maybeIcon = iconForFamily(family);
            if (maybeIcon) {
              // freaking hack.. i'll just use <svg> asap
              const img = new Image();
              img.src = maybeIcon;
              img.onload = () => ctx.drawImage(img, xi * size, yi * size, size, size);
            }
            break;

          default:
            throw new Error("unknown cell.type="+cell.type);
        }
       ctx.strokeStyle = "rgba(0,0,0,0.2)";
       ctx.strokeRect(xi*size,yi*size,size,size);
      }
      else {
        ctx.clearRect(xi * size, yi * size, size, size);
      }
    });
  }
  render() {
    const {plot, cellSize, pixelRatio} = this.props;
    const width = cellSize * plot.gridW;
    const height = cellSize * plot.gridH;
    return (
      <canvas
        ref="canvas"
        style={{ width, height }}
        width={pixelRatio * width}
        height={pixelRatio * height}
      />
    );
  }
}

class SpeciesDetail extends Component {
  render() {
    const {
      data,
      species,
      children,
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
          src={iconForFamily(family)}
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
          color="#F50"
          label="Semer au chaud"
          months={calendar.seedling_indoors_months||[]}
        />
        <Months
          color="#0C3"
          label="Semer dehors / Replanter"
          months={calendar.seedling_outdoors_or_planting_months||[]}
        />
        <Months
          color="#F09"
          label="Récolter"
          months={calendar.harvest_months||[]}
        />
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
    });
  });
  return path;
}

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
      <div key={i}>
        <span>
          {MONTHS.map((monthName, m) =>
            <span style={{
              margin: "0 0.1em",
              fontFamily: "monospace",
              fontSize: "14px",
              textDecoration: month===m+1 ? "underline" : "none",
              color:
                months.indexOf(m+1)===-1
                ? "#eee"
                : "#000"
              }}>
              {monthName.slice(0, 1)}
            </span>
          )}
          <span style={{ marginLeft: 8, fontSize: "12px" }}>
            {calendarName}
            {" à "}
            <strong style={{ textDecoration: "underline" }}>{ACTION_TEXT[action]}</strong>
            {
              actionMoonSatisfied[action](moon)
              ? "👌 la lune est d'accord"
              : ""
            }
          </span>
        </span>
      </div>
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
        return <SpeciesDetail
            key={species.id}
            species={species}
            data={data}>
          {seedling
            ?
            <div style={{ fontSize: "14px", padding: 10 }}>
              semé dans
              <img
                src={icons.sprout}
                style={{ height: 18, verticalAlign: -4 }}
              />
              <span style={{ color: "#0c0"}}>
                {seedling.name}
              </span>
              { seedling.date
                ? " " + moment(seedling.date).fromNow()
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
        </SpeciesDetail>;
      })
    }</div>;
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
      .reduce(groupBy(el => el.value.group), {});

    return (
      <div className="App">
        <div className="App-header">
          <h2><img src={icons.sprout} style={{ height: 40, verticalAlign: "middle", marginRight: 4 }} /> Le Jardin de Gaëtan</h2>
        </div>
        <TimeTravel onChange={this.onDateChange} value={date} />

        <Calendar
          date={date}
        />

        <div className="App-body">

          <div style={{ background: "#eee", padding: 10, fontSize: "1.4em" }}>
            <div style={{ fontWeight: "bold" }}>
              <MoonPhase moon={moon} />
              &nbsp;
              <MoonProgression moon={moon} />
            </div>
            {/* // currently not reliable. bug in the lib
            <div style={{ fontStyle: "italic" }}>
              <MoonVegType moon={moon} />
            </div>
            */}
          </div>

          <div className="map">
            <div className="garden">
              { data.plots.gauche
                ? <Plot plot={data.plots.gauche} cellSize={16} />
                : null }
                { data.plots.droite
                  ? <Plot plot={data.plots.droite} cellSize={16} />
                  : null }
            </div>
            <div className="veranda">
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
          </div>

          <h3>{Object.keys(data.species).length} Espèces Différentes</h3>
          <SpeciesList month={month} data={data} moon={moon} />
        </div>
      </div>
    );
  }
}

export default App;
