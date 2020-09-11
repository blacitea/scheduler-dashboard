import React, { Component } from 'react';
import axios from 'axios';
import Loading from './Loading';
import classnames from 'classnames';
import Panel from './Panel';

import {
	getTotalInterviews,
	getLeastPopularTimeSlot,
	getMostPopularDay,
	getInterviewsPerDay,
} from 'helpers/selectors';
import { setInterview } from 'helpers/reducers';

const data = [
	{
		id: 1,
		label: 'Total Interviews',
		getValue: getTotalInterviews,
	},
	{
		id: 2,
		label: 'Least Popular Time Slot',
		getValue: getLeastPopularTimeSlot,
	},
	{
		id: 3,
		label: 'Most Popular Day',
		getValue: getMostPopularDay,
	},
	{
		id: 4,
		label: 'Interviews Per Day',
		getValue: getInterviewsPerDay,
	},
];

class Dashboard extends Component {
	// We are not doing constructor because we don't really need one
	// constructor(props) {
	// 	super(props);
	// 	this.state = {
	// 		loading: false,
	// 		focused: null,
	// 	};
	// 	this.selectPanel = this.selectPanel.bind(this);
	// }
	state = {
		loading: true,
		focused: null,
		days: [],
		appointments: {},
		interviewers: {},
	};

	// We could use arrow function to make binding not dynamic
	// selectPanel = id => {
	// 	this.setState({ focused: id });
	// };

	selectPanel(id) {
		this.setState(previousState => ({
			focused: previousState.focused ? null : id,
		}));
	}

	componentDidMount() {
		const focused = JSON.parse(localStorage.getItem('focused'));

		if (focused) {
			this.setState({ focused });
		}

		Promise.all([
			axios.get('/api/days'),
			axios.get('/api/appointments'),
			axios.get('/api/interviewers'),
		]).then(([days, appointments, interviewers]) => {
			this.setState({
				loading: false,
				days: days.data,
				appointments: appointments.data,
				interviewers: interviewers.data,
			});
		});

		this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

		this.socket.onmessage = event => {
			const data = JSON.parse(event.data);

			if (typeof data === 'object' && data.type === 'SET_INTERVIEW') {
				this.setState(previousState =>
					setInterview(previousState, data.id, data.interview)
				);
			}
		};
	}

	componentDidUpdate(previousProps, previousState) {
		if (previousState.focused !== this.state.focused) {
			localStorage.setItem('focused', JSON.stringify(this.state.focused));
		}
		console.log(this.state);
	}

	componentWillUnmount() {
		this.socket.close();
	}

	render() {
		const dashboardClasses = classnames('dashboard', {
			'dashboard--focused': this.state.focused,
		});

		if (this.state.loading) return <Loading />;

		const panels = data
			// check if panel is focused, or non focus to determine what data got render as Panel
			.filter(
				panel => this.state.focused === null || this.state.focused === panel.id
			)
			.map(panel => (
				<Panel
					key={panel.id}
					label={panel.label}
					value={panel.getValue(this.state)}
					onSelect={event => this.selectPanel(panel.id)}
				/>
			));
		return <main className={dashboardClasses}>{panels}</main>;
	}
}

export default Dashboard;
