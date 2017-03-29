//@flow
import React, { PureComponent } from "react";
import moment from "moment";

const DAY_HEIGHT = 40;

import "./TimeTravel.css";

export default class TimeTravel extends PureComponent {
  props: {
    fromYear: number;
    toYear: number,
    onChange: (d: Date) => void,
    date: Date,
  };
  static defaultProps = {
    fromYear: 2016,
    toYear: new Date().getFullYear()+2,
  };

  scrollContainer: ?HTMLDivElement;
  todayDiv: ?HTMLDivElement;

  onScrollRef = (scrollContainer: HTMLDivElement) => {
    this.scrollContainer = scrollContainer;
  };

  onTodayRef = (todayDiv: HTMLDivElement) => {
    if (todayDiv) {
      this.todayDiv = todayDiv;
    }
  };

  scrollOn = (element: Element) => {
    const { scrollContainer } = this;
    if (!scrollContainer) return;
    const viewport = scrollContainer.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    scrollContainer.scrollTop +=
      rect.top -
      viewport.top -
      (viewport.height - DAY_HEIGHT) / 2;
  };

  onDayClick = (e: Event) => {
    // $FlowFixMe
    this.scrollOn(e.target);
  };

  jumpToday = () => {
    this.props.onChange(
      moment().endOf("day").toDate()
    );
  };

  lastUserInteraction = 0;

  onScroll = (e: Event) => {
    this.lastUserInteraction = Date.now();
    const { date, onChange } = this.props;
    const { scrollContainer, todayDiv } = this;
    if (!scrollContainer || !todayDiv) return;
    const containerRect = scrollContainer.getBoundingClientRect();
    const todayRect = todayDiv.getBoundingClientRect();
    const diff = (containerRect.height - DAY_HEIGHT) / 2 - todayRect.top;
    const dayAdd = diff / DAY_HEIGHT;
    const newDay = moment(date).add(dayAdd, "day").endOf("day");
    if (newDay.isSame(moment(date).endOf("day"))) return;
    onChange(newDay.toDate());
  };

  componentDidMount () {
    const { todayDiv } = this;
    if (todayDiv) this.scrollOn(todayDiv);
  }

  componentDidUpdate () {
    if (Date.now() - this.lastUserInteraction > 500) {
      const { todayDiv } = this;
      if (todayDiv) this.scrollOn(todayDiv);
    }
  }

  render() {
    const { date, fromYear, toYear } = this.props;
    const dateDay = moment(date).startOf("day");
    const today = moment().startOf("day");

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
          const isDate = t.isSame(dateDay);
          const isToday = t.isSame(today);
          const day = t.format("DD");
          days.push(
            <div
              key={day}
              className={[
                "day",
                isToday ? "today" : "",
                isDate ? "selected" : "",
              ].join(" ")}
              ref={isDate ? this.onTodayRef : null}
              onClick={this.onDayClick}>
              {day}
            </div>
          );
        }
        months.push(
          <div className="month" key={m}>
            <div className="month-header">
              {moment({ day: 1, month: m, year: y }).format("MMMM YYYY")}
            </div>
            {days}
          </div>
        );
      }
      years.push(
        <div className="year" key={y}>
          {months}
        </div>
      );
    }

    const diffDays = dateDay.diff(today, "days");

    return <div className="time-travel">
      <header>
        <div className="day">{dateDay.format("DD")}</div>
        <div className="month">{dateDay.format("MMMM")}</div>
        <div className="year">{dateDay.format("YYYY")}</div>
      </header>
      <div className="container" ref={this.onScrollRef} onScroll={this.onScroll}>
        {years}
      </div>
      <div className="cursor" />
      <footer className={diffDays===0?"today":diffDays>0?"future":"past"} onClick={this.jumpToday}>
        { diffDays===0
          ? "today"
          : `${diffDays>0?"+":"-"} ${Math.abs(diffDays)}d` }
      </footer>
    </div>;
  }
}
