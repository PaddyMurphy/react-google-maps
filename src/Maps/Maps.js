/* eslint-disable no-undef, no-unused-vars */
import React, { Component } from 'react';
import Axios from 'axios';
import googleMapsLoader from 'react-google-maps-loader';
import './Maps.css';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDkxXw_KQ_7aMGh-Yo601XShmTWHkpofw8';
const GOOGLE_MAPS_DISTANCE_API_KEY = 'AIzaSyAmj_-E1IKIh_N00XYI5Qeozzi_LBArl3o';
const DISTANCE_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
// TODO:
// import bulma
// add sass support
// drop map pin on first input (using places?)
//   currently faking it with a marker
// allow moving pins and recalc
// display distance and time in infobox

class Maps extends Component {

  constructor(props) {
    super(props);

    this.state = {
      map: null,
      routeTime: null,
      routeDistance: null
    }
  }

  componentDidMount() {
    if (this.props.googleMaps) {
      this.initMap();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.googleMaps && this.props.googleMaps) {
      this.initMap();
    }
  }

  initMap() {
    let map = new google.maps.Map(document.getElementById('map'), {
      mapTypeControl: false,
      center: {lat: 30.2672, lng: -97.743},
      zoom: 13
    });

    this.initialMarker = null;
    this.autocompleteInput(map);
    this.setState({map});
  }

  autocompleteInput(map) {
    let originInput = document.querySelector('.controls--input-origin');
    let destinationInput = document.querySelector('.controls--input-destination');

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
        window.alert('Please select an option from the dropdown list.');
        return;
      }

      if (mode === 'ORIG') {
        that.originPlaceId = place.place_id;
        // TODO: set first marker
        that.addPlaceMarker(that.originPlaceId);
      } else {
        that.removePlaceMarker();
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
      travelMode: 'DRIVING',
    }, function(response, status) {
      if (status === 'OK') {
        that.directionsDisplay.setDirections(response);
        // calculate distance and display
        that.calculateDistance(response);
      } else {
        // TODO: handle error instead of alert
        window.alert('Directions request failed due to ' + status);
      }
    });
  };

  calculateDistance(response) {
    const that = this;
    // TODO: display time & distance
    //       display alternate routes
    Axios.get(DISTANCE_API_URL, {
      params: {
        key: GOOGLE_MAPS_DISTANCE_API_KEY,
        origins: 'place_id:' + that.originPlaceId,
        destinations: 'place_id:' + that.destinationPlaceId
      }
    })
    .then(response => {
      console.log(response.data.rows[0].elements[0]);
      that.setState({
        routeTime: response.data.rows[0].elements[0].duration.text,
        routeDistance: response.data.rows[0].elements[0].distance.text
      })
    })
    .catch(error => {
      console.warn(error);
    });
  }

  removePlaceMarker() {
    // remove existing markers
    if (this.initialMarker) {
      // console.log(this.initialMarker);
      this.initialMarker.setMap(null);
    }
  }

  addPlaceMarker(placeId) {
    const that = this;
    let service = new google.maps.places.PlacesService(that.map);
    // clear existing marker
    that.removePlaceMarker();

    service.getDetails({
        placeId: placeId
    }, function (result, status) {
        that.initialMarker = new google.maps.Marker({
          map: that.map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          place: {
            placeId: placeId,
            location: result.geometry.location
          }
        });
        // TODO: set bounds based on place_id?
        //       change marker to green to match final
        console.log(result);
        // Create new bounds object
        // let bounds = new google.maps.LatLngBounds();
        // let geoCode = new google.maps.LatLng();
        // bounds.extend(geoCode);
        // //Add new bounds object to map
        // that.map.fitBounds(bounds);
    });
  }

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

          <input
            className="controls--input controls--input-origin input"
            type="text"
            placeholder="Start location" />

          <input
            className="controls--input controls--input-destination input"
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
