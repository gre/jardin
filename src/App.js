import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import moment from "moment";
import mooncalc from "./logic/mooncalc";
import consumeEventsForDate from "./logic/consumeEventsForDate";

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

class MoonPhase extends Component {
  render() {
    const { moon: {phase} } = this.props;
    return <span title={phase}>{phaseIcons[phase]}</span>;
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
        return <div
          className={["section", "species-"+section.species].join(" ")}
          style={{ left: (100 * startSplit)+"%", width: (100 * (endSplit - startSplit))+"%" }}
        />;
      })}
      </div>
      <div className="splitters">
      {(seedling.sectionSplitters||[]).map((split, i) =>
        <span className="splitter" style={{ left: (100 * split)+"%" }} />
        )}
      </div>
      <div className="decorator" />
    </div>;
  }
}
class SeedlingStarter extends Component {
  render() {
    const {id, seedling} = this.props;
    return <div className="seedlingStarter">
      <div className="seedlingStarter-bottom" />
    </div>;
  }
}
class BigBox extends Component {
  render() {
    const {id} = this.props;
    return <div className="bigBox">

    </div>;
  }
}

class EggBox extends Component {
  render() {
    const {id} = this.props;
    return <div className="eggBox">

    </div>;
  }
}

class Seedlings extends Component {
  render() {
    const { seedlings } = this.props;
    return <div>
      <div className="seedling-group">
        {[1,2].map(i =>
          <Seedling
            key={i}
            seedling={seedlings["starter-"+i]}
          />
        )}
      </div>
      <div className="seedling-group">
        <Seedling seedling={seedlings["bigbox-1"]} />
      </div>
      <div className="seedling-group">
        <Seedling seedling={seedlings["eggbox-1"]} />
        <Seedling seedling={seedlings["eggbox-2"]} />
      </div>
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



class App extends Component {
  state = {
    data: consumeEventsForDate(new Date()),
    moon: mooncalc(new Date()),
  };
  render() {
    const { data, moon } = this.state;
    console.log(this.state);
    return (
      <div className="App">
        <div className="App-header">
          <h2>Le Jardin de Gaëtan</h2>
        </div>
        <div className="App-body">
          <div>
            <Timeline />
          </div>
          <div>
            <MoonPhase moon={moon} />
          </div>
          <h3>Semis</h3>
          <Seedlings seedlings={data.seedlings} />
          <h3>Eau</h3>
          <div className="waterTanks">
          {Object.keys(data.waterTanks).map(id =>
            <WaterTank
              key={id}
              waterTank={data.waterTanks[id]}
            />
          )}
          </div>
          <h3>Compost</h3>
          <Compost
            {...data.compost}
          />
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
          <h3>{Object.keys(data.seeds).length} Graines</h3>
          <div>
          {Object.keys(data.seeds).map(id => {
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
            } = data.seeds[id];
            const {
              line_distance_cm,
              seeding_depth_cm,
              spacing_cm,
              seeding_indoors_months,
              seeding_outdoors_months,
              planting_months,
              harvest_months,
            } = data.families[family]||{};
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
