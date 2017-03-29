//@flow
import React, { Component } from "react";
import moment from "moment";
import { Redirect, Switch, Route, NavLink } from "react-router-dom";
import mooncalc from "./logic/mooncalc";
import consumeEventsForDate from "./logic/consumeEventsForDate";
import icons from "./icons";
import MoonPhase from "./ui/MoonPhase";
import MoonProgression from "./ui/MoonProgression";
import MoonVegType from "./ui/MoonVegType";
import Seedlings from "./ui/Seedlings";
import SpeciesList from "./ui/SpeciesList";
import SvgMap from "./ui/SvgMap";
import TimeTravel from "./ui/TimeTravel";

import "./App.css";

const isSmallWidth = () => window.innerWidth < 540;

export default class App extends Component {
  state = {
    date: moment().endOf("day").toDate(),
    smallWidth: isSmallWidth(),
  };
  componentDidMount () {
    window.addEventListener("resize", this.onWindowResize, false);
  }
  componentWillUnmount () {
    window.removeEventListener("resize", this.onWindowResize);
  }

  onWindowResize = () => {
    const smallWidth = isSmallWidth();
    if (smallWidth !== this.state.smallWidth) {
      this.setState({ smallWidth });
    }
  }

  onDateChange = (date: Date) => {
    this.setState({ date });
  };
  render() {
    const { date, smallWidth } = this.state;
    const data = consumeEventsForDate(date);
    const moon = mooncalc(date);
    const month = date.getMonth();

    return (
      <div className={"App "+(smallWidth ? "small" : "")}>

        <div className="App-header">
          <div className="App-moon">
            <MoonPhase moon={moon} />
            &nbsp;
            <MoonProgression moon={moon} />
            &nbsp;
            <MoonVegType moon={moon} />
          </div>
          <nav>
            <NavLink to="/map">
              <img alt="map" src={icons["field"]} height={40} />
            </NavLink>
            <NavLink to="/species">
              <img alt="species" src={icons["paper-bag-with-seeds"]} height={40} />
            </NavLink>
            <NavLink to="/seedlings">
              <img alt="seedlings" src={icons["sprout"]} height={40} />
            </NavLink>
          </nav>
        </div>

        <TimeTravel
          date={date}
          onChange={this.onDateChange}
          horizontal={false /*smallWidth FIXME unstable*/}
        />

        <div className="App-body">

          <Switch>
            <Redirect exact from="/" to="/map" />
            <Route
              path="/map"
              render={() =>
                <SvgMap
                  date={date}
                  data={data}
                />}
            />
            <Route
              path="/species"
              render={() =>
                <SpeciesList
                  month={month}
                  data={data}
                  moon={moon}
                />}
            />
            <Route
              path="/seedlings"
              render={() =>
              <Seedlings
                seedlings={data.seedlings}
              />}
            />
            <Route
              render={() =>
                <div style={{ padding: 100, fontSize: "32px" }}>Not Found</div>
              }
            />
          </Switch>

        </div>

        <footer>
          <a target="_blank" href="https://github.com/gre/jardin">
            Github
          </a>
        </footer>
      </div>
    );
  }
}
