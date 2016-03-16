import $ from 'jquery';
import React from 'react';
import ParkingZonesStore from '../stores/ParkingZonesStore.js';

const styles = {
  toolbarBtn: {
    marginLeft: 2
  }
};

export default class ParkingLotDashboard extends React.Component {

  constructor(props) {
    super(props);
    this.state = _.extend({}, this.getStateFromStores(), {
      editingNewParkignZone: false,
      existingParkingZoneInEdition: null
    });
  }

  componentDidMount() {
    ParkingZonesStore.listen(this.onStoresChange);
    this.$getAllPopups().popup();
  }

  componentWillUnmount() {
    ParkingZonesStore.unlisten(this.onStoresChange);
  }

  componentDidUpdate() {
    this.$getAllPopups().popup('hide all');
    this.$getAllPopups().popup();
  }

  render() {
    const { zones, editingNewParkignZone } = this.state;
    return (
      <div>
        <h1 className="centered">Parking Lot Dashboard</h1>

        <div className="ui icon buttons" ref="toolbar">
          <button className="ui basic blue button"
            onClick={this.editNewParkingZone}
            data-content="New parking zone">
            <i className="add circle icon"></i>
          </button>
          <button className="ui basic yellow button"
            style={_.extend({}, styles.toolbarBtn)}
            data-content="New parking zone from csv">
            <i className="file outline icon"></i>
          </button>
        </div>

        <table className="ui celled table">
          <thead>
            <tr>
              <th>Zone ID</th>
              <th>Zone Name</th>
              <th>Availability</th>
              <th>Capacity</th>
              <th>Occupancy</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {editingNewParkignZone ?
              this.renderNewParkingZoneEditor() :
              null
            }
            {zones.map((z, i) => {
              return z.id === this.state.existingParkingZoneInEdition ?
              this.renderExistingParkingZoneEditor(z, i) :
              this.renderParkingZoneRow(z, i)
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan="2"><b>Totals</b></th>
              <th>{this.getAvailabilityTotal()}</th>
              <th>{this.getCapacityTotal()}</th>
              <th>{this.getOccupancyTotal()}</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  getStateFromStores = () => {
    const { zones } = ParkingZonesStore.getState();
    return {
      zones: zones
    };
  }

  onStoresChange = () => {
    this.setState(this.getStateFromStores());
  }

  getCapacityTotal = () => {
    const { zones } = this.state;
    return _.reduce(zones, function(result, value, key) {
      return result += value.capacity;
    }, 0);
  }

  getOccupancyTotal = () => {
    const { zones } = this.state;
    return _.reduce(zones, function(result, value, key) {
      return result += value.occupancy;
    }, 0);
  }

  getAvailabilityTotal = () => {
    const { zones } = this.state;
    return _.reduce(zones, function(result, value, key) {
      return result += (value.capacity - value.occupancy);
    }, 0);
  }

  $getAllPopups = () => {
    return $('[data-content]');
  }

  deleteParkingZone = (zoneName) => {
    $.ajax({
      method: 'DELETE',
      url: `http://localhost:8000/api/zone/${zoneName}`,
    });
  }

  renderParkingZoneRow = (zone, i) => {
    return (
      <tr key={i}>
        <td>{zone.id}</td>
        <td>{zone.name}</td>
        <td>{zone.capacity - zone.occupancy}</td>
        <td>{zone.capacity}</td>
        <td>{zone.occupancy}</td>
        <td>
          <div className="ui icon buttons">
            <button className="ui violet basic button"
              onClick={_.partial(this.editExistingParkingZone, zone.id)}
              data-content="Modify zone">
              <i className="edit icon"></i>
            </button>
            <button className="ui red basic button"
              onClick={_.partial(this.deleteParkingZone, zone.id)}
              style={_.extend({}, styles.toolbarBtn)}
              data-content="Delete parking zone">
              <i className="trash outline icon"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  editNewParkingZone = () => {
    this.setState({ editingNewParkignZone: true });
  }

  cancelNewParkingZoneEdition = () => {
    this.setState({ editingNewParkignZone: false });
  }

  renderNewParkingZoneEditor = () => {
    return (
      <tr className="ui form">
        <td>
          <input type="text" ref="newZoneId"/>
        </td>
        <td>
          <input type="text" ref="newZoneName"/>
        </td>
        <td></td>
        <td>
          <input type="number" ref="newZoneCapacity"/>
        </td>
        <td>
          <input type="number" defaultValue={0} ref="newZoneOccupancy"/>
        </td>
        <td>
          <div className="ui icon buttons">
            <button className="ui basic green button"
              onClick={this.createNewParkingZone}>
              <i className="save icon"></i>
            </button>
            <button className="ui basic orange button"
              style={_.extend({}, styles.toolbarBtn)}
              onClick={this.cancelNewParkingZoneEdition}>
              <i className="remove icon"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  createNewParkingZone = () => {
    const zoneData = {
      id: $(this.refs.newZoneId).val(),
      name: $(this.refs.newZoneName).val(),
      capacity: parseInt($(this.refs.newZoneCapacity).val(), 10),
      occupancy: parseInt($(this.refs.newZoneOccupancy).val(), 10)
    };

    $.ajax({
      method: 'POST',
      url: 'http://localhost:8000/api/zone',
      contentType: 'application/json',
      data: JSON.stringify(zoneData),
      success: (data, status, xhr) => {
        this.setState({ editingNewParkignZone: false });
      },
      error: function(xhr, status, err) {
        console.error('TODO: Inform user of mistakes');
      }
    });
  }

  editExistingParkingZone = (zoneId) => {
    console.log(zoneId);
    this.setState({ existingParkingZoneInEdition: zoneId });
  }

  cancelExistingParkingZoneEdition = () => {
    this.setState({ existingParkingZoneInEdition: null });
  }

  renderExistingParkingZoneEditor = (zone, i) => {
    return (
      <tr className="ui form" key={i}>
        <td>{zone.id}</td>
        <td>
          <input type="text" defaultValue={zone.name} ref="existingZoneName"/>
        </td>
        <td></td>
        <td>
          <input type="number" defaultValue={zone.capacity} ref="existingZoneCapacity"/>
        </td>
        <td>
          <input type="number" defaultValue={zone.occupancy} ref="existingZoneOccupancy"/>
        </td>
        <td>
          <div className="ui icon buttons">
            <button className="ui basic green button"
              onClick={_.partial(this.modifyExistingParkingZone, zone.id)}>
              <i className="save icon"></i>
            </button>
            <button className="ui basic orange button"
              style={_.extend({}, styles.toolbarBtn)}
              onClick={this.cancelExistingParkingZoneEdition}>
              <i className="remove icon"></i>
            </button>
          </div>
        </td>
      </tr>
    );
  }

  modifyExistingParkingZone = (zoneId) => {
    const zoneData = {
      name: $(this.refs.existingZoneName).val(),
      capacity: parseInt($(this.refs.existingZoneCapacity).val(), 10),
      occupancy: parseInt($(this.refs.existingZoneOccupancy).val(), 10)
    };

    $.ajax({
      method: 'PUT',
      url: `http://localhost:8000/api/zone/${zoneId}`,
      contentType: 'application/json',
      data: JSON.stringify(zoneData),
      success: (data, status, xhr) => {
        this.setState({ existingParkingZoneInEdition: null });
      },
      error: function(xhr, status, err) {
        console.error('TODO: Inform user of mistakes');
      }
    });
  }

}
