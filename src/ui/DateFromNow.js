//@flow
import React, {Component} from "react";
import moment from "moment";

export default class DateFromNow extends Component {
  render() {
    const {date} = this.props;
    const m = moment(date);
    return <time title={m.format("LL")} dateTime={m.format()}>
      {moment(m).fromNow()}
    </time>;
  }
}
