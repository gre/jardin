import React, { Component } from "react";
import raf from "raf";
import smoothstep from "smoothstep";
import uniq from "lodash/uniq";
import flatMap from "lodash/flatMap";
import logo from "./logo.svg";
import "./App.css";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import mooncalc from "./logic/mooncalc";
import consumeEventsForDate from "./logic/consumeEventsForDate";

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
            <strong>
              {section.species.generic}
            </strong>
          </div>
          <div>
            {section.length_cm||0}cm
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

class Compost extends Component {
  render() {
    const {level} = this.props;
    return (
      <div className="compost">
        <div
          className="compost-inner"
          style={{ height: (100 * level).toFixed(2)+"%" }}
        />
        <span className="compost-level">{(100 * level).toFixed(0)}%</span>
      </div>
    );
  }
}

class WaterTank extends Component {
  render() {
    const {waterTank} = this.props;
    return (
      <div className="waterTank">
        <div
          className="waterTank-inner"
          style={{ height: (100 * waterTank).toFixed(2)+"%" }}
        />
        <span className="waterTank-value">{(100 * waterTank).toFixed(0)}%</span>
      </div>
    );
  }
}

const MONTHS = ["J","F","M","A","M","J","J","A","S","O","N","D"];
class Months extends Component {
  render() {
    const {color,months,label} = this.props;
    return <div className="months" style={{ color }}>
      <span className="body">
      {MONTHS.map((m,i) =>
        <span
          key={i}
          className={["month",(months.indexOf(i+1)===-1?"off":"on")].join(" ")}>
          {m}
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
            ctx.fillStyle = "#060";
            ctx.fillRect(xi * size, yi * size, size, size);
            if (cell.species === "fraises_mount_everest") {
              ctx.font = "24px serif";
              ctx.textBaseline = "middle";
              ctx.textAlign = "center";
              ctx.fillText("🍓", (xi + 0.5) * size, (yi + 0.5) * size);
            }
            break;

          default:
            throw new Error("unknown cell.type="+cell.type);
        }
       ctx.strokeStyle = "#000";
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
    } = species.family;

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
        <strong>{generic}</strong>&nbsp;
        <span>{name}</span>&nbsp;
        <em>({year})</em>&nbsp;
        {
          bio
          ? <span title={brand} style={{ color: "#0d0", fontWeight: "bold", fontSize: "0.8em" }}>BIO, {country||"France"}</span>
          : <em style={{ fontSize: "0.6em", color: "#930" }}>({brand||"?"}, {country||"France"})</em>}
        <em style={{ marginLeft: 10, fontSize: "0.6em" }}>{latin}</em>
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

function findSeedlingBySectionTest (seedlings, predicate) {
  return Object.keys(seedlings).find(k => {
    const seedling = seedlings[k];
    return seedling.sections.find((section, i) => {
      if (section && predicate(section)) {
        return seedling;
      }
    });
  });
}

class SuggestSeedsUsableForMonth extends Component {
  render() {
    const {data, month} = this.props;
    const {seeds, species, seedlings} = data;
    const options = [];
    Object.keys(seeds).forEach(id => {
      const seed = seeds[id];
      const spec = species[seed.species]; // FIXME spec should already be the object of seed.species
      const family = spec.family;
      let res;
      const seedling = findSeedlingBySectionTest(
        seedlings,
        section => section.species.id === id
      );
      if (!seedling && family.calendars.some(calendar => calendar.seedling_indoors_months.indexOf(month)!==-1)) {
        res = { ...res, indoors: true };
      }
      const readyForOutdoors = family.calendars.some(calendar => calendar.seedling_outdoors_or_planting_months.indexOf(month)!==-1);
      if (readyForOutdoors && !seed.tuber) {
        res = { ...res, outdoors: true };
      }
      if ((seedling || seed.tuber) && readyForOutdoors) {
        res = { ...res, replant: true, seedling };
      }
      if (res) {
        options.push({
          ...res,
          seed,
          spec,
          family,
        });
      }
    });

    const indoors = options.filter(option => option.indoors);
    const outdoors = options.filter(option => option.outdoors);
    const replant = options.filter(option => option.replant);

    return <div>
      { indoors.length ? <h4>Semer au chaud</h4> : null }
      { indoors.map((option, i) =>
        <SpeciesDetail key={"indoors_"+i} species={option.spec} data={data} /> )}
      { outdoors.length ? <h4>Semer dehors</h4> : null }
      { outdoors.map((option, i) =>
        <SpeciesDetail key={"outdoors_"+i} species={option.spec} data={data} /> )}
      { replant.length ? <h4>Replanter</h4> : null }
      { replant.map((option, i) =>
        <SpeciesDetail key={"replant_"+i} species={option.spec} data={data} /> )}
    </div>;
  }
}

const months = [
  "",
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
    const month = 1 + date.getMonth();
    const nextMonth = (month+1) % 12;

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
          <h2>Le Jardin de Gaëtan</h2>
        </div>
        <TimeTravel onChange={this.onDateChange} value={date} />
        <div className="App-body">

          <div style={{ background: "#eee", padding: 10, fontSize: "1.4em" }}>
            <div style={{ fontWeight: "bold" }}>
              <MoonPhase moon={moon} />
              &nbsp;
              <MoonProgression moon={moon} />
            </div>
            <div style={{ fontStyle: "italic" }}>
              <MoonVegType moon={moon} />
            </div>
          </div>

          <div className="map">
            <div className="garden">
              { data.plots.gauche
                ? <Plot plot={data.plots.gauche} cellSize={14} />
                : null }
                { data.plots.droite
                  ? <Plot plot={data.plots.droite} cellSize={14} />
                  : null }
              <div className="garden-right">
                <WaterTank waterTank={data.waterTanks["tank-1"]} />
                <Compost {...data.compost} />
                <WaterTank waterTank={data.waterTanks["tank-2"]} />
              </div>
            </div>
            <div className="veranda">
              <div className="seedling-group">
              {[
                "bac",
                "starter",
                "bigbox",
                "eggbox",
                "pots"
              ].map(group => (seedlingGroups[group]||[]).map(({ key, value }) =>
                <Seedling key={key} seedling={value} />
              ))}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "left", margin: "200px 0"}}>
            <h4>Reste à faire en {months[month]}:</h4>
            <SuggestSeedsUsableForMonth month={month} data={data} />
            <h4>Reste à venir en {months[nextMonth]}:</h4>
            <SuggestSeedsUsableForMonth month={nextMonth} data={data} />
          </div>

          <h3>{Object.keys(data.species).length} Espèces Différentes</h3>
          <div>
          {Object.keys(data.species)
            .sort((a,b) => data.species[a].family.id < data.species[b].family.id ? -1 : 1)
            .map(id =>
            <SpeciesDetail
              key={id}
              species={data.species[id]}
              data={data}
            /> )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
