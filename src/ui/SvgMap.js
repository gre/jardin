//@flow
import React, { Component } from "react";
import {
  Link
} from "react-router-dom";
import SvgShape from "./SvgShape";
import SvgPlot from "./SvgPlot";
import SvgMapObject from "./SvgMapObject";

const terrainTypeColors = {
  grass: "#6A5",
  stone: "#ccc",
  concrete: "#aaa",
};

export default class SvgMap extends Component {
  props: {
    data: *,
    scale: number,
    padding: [number, number, number, number],
  };
  static defaultProps = {
    scale: 0.5,
    padding: [ 80, 40, 40, 40 ],
  };
  transformPoint = (p: [number,number]) => {
    const { scale, data: { mapBound } } = this.props;
    return [
      scale * (p[0] - mapBound[0]),
      scale * (p[1] - mapBound[1]),
    ];
  };
  transformRect = (r: [number,number,number,number]) => {
    const { scale, data: { mapBound } } = this.props;
    return [
      scale * (r[0] - mapBound[0]),
      scale * (r[1] - mapBound[1]),
      scale * r[2],
      scale * r[3],
    ];
  };
  transformCircle = (c: [number,number,number]) => {
    const { scale, data: { mapBound } } = this.props;
    return [
      scale * (c[0] - mapBound[0]),
      scale * (c[1] - mapBound[1]),
      scale * c[2],
    ];
  };
  transformRadius = (r: number) => {
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
    return <div className="svg-map">
      <svg width={width+padding[1]+padding[3]} height={height+padding[0]+padding[2]}>
        <g transform={`translate(${padding[3]},${padding[0]})`}>
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
              let el =
                <g key={object.id}>
                  <title>{object.title||object.id}</title>
                  <SvgMapObject
                    object={object}
                    transform={this}
                  />
                </g>;

              if (object.link) {
                el = <Link key={object.id} to={object.link}>
                  {el}
                </Link>;
              }

              return el;
            })}
          </g>
          <g>
            {Object.keys(data.plots).map(plotkey => {
              const plot = data.plots[plotkey];
              return (
                <g key={plotkey} transform={`translate(${this.transformPoint(plot.position).join(",")})`}>
                  <SvgPlot
                    scale={scale}
                    plot={plot}
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
