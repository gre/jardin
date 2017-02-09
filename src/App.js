import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import moment from "moment";
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
      {(seedling.sections||[]).map((section, i) => {
        const startSplit = (seedling.sectionSplitters||[])[i - 1] || 0;
        const endSplit = (seedling.sectionSplitters||[1])[i] || 1;
        const name = `${section.species.generic||""} ${section.species.name||""}`;
        const date = `${section.seedlingDate}`;
        return <div
          key={i}
          title={name}
          className={["section", "species-"+section.species.id].join(" ")}
          style={{ left: (100 * startSplit)+"%", width: (100 * (endSplit - startSplit))+"%" }}>
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

class Timeline extends Component {
  render() {
    return <div />;
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
    const {color,months} = this.props;
    return <div className="months" style={{ color }}>
      {MONTHS.map((m,i) =>
        <span
          key={i}
          className={["month",(months.indexOf(i+1)===-1?"off":"on")].join(" ")}>
          {m}
        </span>)}
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
      const xi = i % plot.gridW;
      const yi = (i - xi) / plot.gridW;
      if (cell) {
        switch (cell.type) {
          case "empty":
            ctx.fillStyle = "#953";
            break;

          default:
            throw new Error("unknown cell.type="+cell.type);
        }
      }
      else {
        ctx.fillStyle = "#6A5";
      }
      ctx.fillRect(xi * size, yi * size, size, size);
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

class App extends Component {
  state = {
    data: consumeEventsForDate(new Date()),
    moon: mooncalc(new Date()),
  };
  render() {
    const { data, moon } = this.state;
    console.log(this.state);

    const seedlingGroups =
    Object.keys(data.seedlings)
      .map(key => ({
        key,
        group: key.slice(0, key.indexOf("-")),
        value: data.seedlings[key],
      }))
      .reduce(groupBy(el => el.group), {});

    return (
      <div className="App">
        <div className="App-header">
          <h2>Le Jardin de Gaëtan</h2>
        </div>
        <div className="App-body">
          <div>
            <Timeline />
          </div>

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
              <Plot plot={data.plots.gauche} cellSize={14} />
              <Plot plot={data.plots.droite} cellSize={14} />
              <div className="garden-right">
                <WaterTank waterTank={data.waterTanks["tank-1"]} />
                <Compost {...data.compost} />
              </div>
            </div>
            <div className="garden-front">
              <WaterTank waterTank={data.waterTanks["tank-2"]} />
            </div>
            <div className="veranda">
            {[
              "bac",
              "starter",
              "bigbox",
              "eggbox",
            ].map(group =>
              <div key={group} className="seedling-group">
                {seedlingGroups[group].map(({ key, value }) =>
                  <Seedling key={key} seedling={value} /> )}
              </div> )}
            </div>
          </div>



          <h3>Photos</h3>
          <div>
          {data.photos.map(({ photo }, i) =>
            <a
              key={i}
              href={photo}
              style={{
                display: "inline-block",
                width: 100,
                height: 80,
                backgroundImage: `url(${photo})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "contain",
                backgroundPosition: "center",
              }}
            />
          )}
          </div>
          <h3>{Object.keys(data.species).length} Graines Différentes</h3>
          <div>
          {Object.keys(data.species).map(id => {
            const {
              generic,
              name,
              desc,
              year,
              family,
              latin,
              bio,
              brand,
              country,
            } = data.species[id];
            const {
              line_distance_cm,
              seeding_depth_cm,
              spacing_cm,
              seeding_indoors_months,
              seeding_outdoors_months,
              planting_months,
              harvest_months,
            } = data.families.find(f => f.id === family) || {};
            return <div className="seed" key={id}>
              <strong>{generic}</strong>&nbsp;
              <span>{name}</span>&nbsp;
              <em>({year})</em>&nbsp;
              {
                bio
                ? <span title={brand} style={{ color: "#0d0", fontWeight: "bold", fontSize: "0.8em" }}>BIO, {country||"France"}</span>
                : <em style={{ fontSize: "0.6em", color: "#930" }}>({brand||"?"}, {country||"France"})</em>}
              <em style={{ marginLeft: 10, fontSize: "0.6em" }}>{latin}</em>
              <p style={{ opacity: 0.8, fontSize: "0.8em" }}>
                prof.graines: {seeding_depth_cm}cm,
                dist.lignes: {line_distance_cm}cm,
                dist.graines: {spacing_cm}cm
              </p>
              <Months color="#F50" months={seeding_indoors_months||[]} />
              <Months color="#09F" months={seeding_outdoors_months||[]} />
              <Months color="#0C3" months={planting_months||[]} />
              <Months color="#F09" months={harvest_months||[]} />
              <blockquote>{desc}</blockquote>
            </div>;
          })}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
