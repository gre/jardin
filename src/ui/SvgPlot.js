//@flow
import React, { Component } from "react";
import moment from "moment";
import shapeArea from "../logic/shapeArea";
import iconForSpecies from "../iconForSpecies";
import SvgShape from "./SvgShape";

const PlotFillSizePerVegType = {
  leaf: "#060",
  fruit: "#922",
  flower: "#c90",
  root: "#532",
};

export default class SvgPlot extends Component {
  props: {
    plot: *,
    scale: number,
  };
  state = {
    detailed: false,
  };
  onMouseEnter = () => this.setState({ detailed: true });
  onMouseLeave = () => this.setState({ detailed: false });
  getScale = () => this.props.scale * this.props.plot.scale;
  transformPoint = (p: [number,number]) => {
    const scale = this.getScale();
    return [
      scale * p[0],
      scale * p[1],
    ];
  };
  transformRect = (r: [number,number,number,number]) => {
    const scale = this.getScale();
    return [
      scale * r[0],
      scale * r[1],
      scale * r[2],
      scale * r[3],
    ];
  };
  transformCircle = (c: [number,number,number]) => {
    const scale = this.getScale();
    return [
      scale * c[0],
      scale * c[1],
      scale * c[2],
    ];
  };
  render() {
    const {plot, scale} = this.props;
    const {detailed} = this.state;
    const cellSize = plot.scale * scale;
    const area = Math.round(shapeArea(plot) * plot.scale * plot.scale / 10000);
    return (
      <g onMouseEnter={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
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
              cell.seedlingDate ? "semé "+moment(cell.seedlingDate).fromNow() : null,
              cell.plantDate ? "planté "+moment(cell.plantDate).fromNow() : null,
              cell.transplantDate ? "replanté "+moment(cell.transplantDate).fromNow() : null,
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
            strokeWidth={detailed ? 1 : 0}
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

      { detailed
        ?
        <text y={-3} style={{
          color: "rgba(0,0,0,0.3)",
          fontSize: "10px",
        }}>
          {plot.id} – {area}m²
        </text>
        : null }
      </g>
    );
  }
}
