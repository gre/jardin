import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import moment from "moment";
import "moment/locale/fr";
import "./index.css";

moment.locale("fr");

if (process.env.NODE_ENV==="development") {
  const Perf = require("react-addons-perf");
  window.Perf = Perf;
}

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);
