/* eslint-disable no-undef, no-unused-vars */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import googleMapsLoader from 'react-google-maps-loader'

const GOOGLE_MAPS_API_KEY = 'AIzaSyDkxXw_KQ_7aMGh-Yo601XShmTWHkpofw8'
// TODO: import bulma
// asyc load gmaps
// drop map pin on first input

class Maps extends Component {

  constructor(props) {
    super(props)

    this.state = {
      map: null
    }
  }

  componentDidMount() {
    if (this.props.googleMaps) {
      this.initMap()
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.googleMaps && this.props.googleMaps) {
      this.initMap()
    }
  }

  initMap() {
    let map = new google.maps.Map(document.getElementById('map'), {
      mapTypeControl: false,
      center: {lat: 30.2672, lng: -97.743},
      zoom: 13
    });

    // new AutocompleteDirectionsHandler(map);
    this.autocompleteInput(map);
    this.setState({map})
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
    // listen to change events
    autocomplete.addListener('place_changed', function() {
      let place = autocomplete.getPlace();
      // TODO: handle error messaging
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

  render() {
    let display = null

    if (this.props.googleMaps) {
      display = <div id="map" />
    } else {
      display = <div className="loading"><div className='spinner'></div></div>
    }

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

        {display}
      </div>
    );
  }
}

export default googleMapsLoader(Maps, {
  libraries: ['places'],
  key: GOOGLE_MAPS_API_KEY,
})
