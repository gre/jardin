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

export default class App extends Component {
  state = {
    date: moment().endOf("day").toDate(),
  };
  onDateChange = (date: Date) => {
    this.setState({ date });
  };
  render() {
    const { date } = this.state;
    const data = consumeEventsForDate(date);
    const moon = mooncalc(date);
    const month = date.getMonth();

    return (
      <div className="App">

        <TimeTravel
          date={date}
          onChange={this.onDateChange}
        />

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

        <a
          target="_blank"
          href="https://github.com/gre/jardin"
          style={{ color: "#9C0", position: "absolute", top: 4, right: 4 }}>
          Github
        </a>

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
      </div>
    );
  }
}
