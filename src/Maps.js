/* eslint-disable no-undef, no-unused-vars */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
// TODO: import bulma
// asyc load gmaps
// drop map pin on first input

class Maps extends Component {

  constructor(props) {
    super(props)

    this.state = {
      error: false
    }
  }

  componentDidMount() {
    // TODO: properly async load or catch and retry
    let map = new google.maps.Map(document.getElementById('map'), {
      mapTypeControl: false,
      center: {lat: 30.2672, lng: -97.743},
      zoom: 13
    });

    // new AutocompleteDirectionsHandler(map);
    this.autocompleteInput(map);
  }

  autocompleteInput(map) {
    let originInput = document.getElementById('origin-input');
    let destinationInput = document.getElementById('destination-input');

    this.map = map;
    this.originPlaceId = null;
    this.destinationPlaceId = null;
    this.directionsService = new google.maps.DirectionsService();
    this.directionsDisplay = new google.maps.DirectionsRenderer();
    this.directionsDisplay.setMap(map);

    let originAutocomplete = new google.maps.places.Autocomplete(
        originInput, {placeIdOnly: true});

    let destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput, {placeIdOnly: true});

    this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
    this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(originInput);
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(destinationInput);
  }

  setupPlaceChangedListener(autocomplete, mode) {
    let that = this;
    autocomplete.bindTo('bounds', this.map);
    autocomplete.addListener('place_changed', function() {
      let place = autocomplete.getPlace();
      if (!place.place_id) {
        window.alert("Please select an option from the dropdown list.");
        return;
      }
      if (mode === 'ORIG') {
        that.originPlaceId = place.place_id;
      } else {
        that.destinationPlaceId = place.place_id;
      }
      that.route();
    });
  };

  route() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
      return;
    }
    var that = this;

    this.directionsService.route({
      origin: {'placeId': this.originPlaceId},
      destination: {'placeId': this.destinationPlaceId},
      travelMode: 'DRIVING'
    }, function(response, status) {
      if (status === 'OK') {
        that.directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  };

  // event handler for inputs
  // handleInputChange = (e) => {
  //   console.log(e.target.value);
  // }

  render() {
    return (
      <div>
        <div className="controls">

          <input id="origin-input"
            className="controls--input input"
            data-type="ORIG"
            type="text"
            placeholder="Start location" />

          <input id="destination-input"
            className="controls--input input"
            data-type="DEST"
            type="text"
            placeholder="Destination location" />
        </div>

        <div id="map"></div>
      </div>
    );
  }
}

export default Maps;
