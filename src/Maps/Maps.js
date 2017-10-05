/* eslint-disable no-undef, no-unused-vars */
import React, { Component } from 'react';
import Axios from 'axios';
import Classnames from 'classnames';
import GoogleMapsLoader from 'react-google-maps-loader';
import './Maps.css';
import MapStyles from '../mapStyles.json';

const GOOGLE_MAPS_API_KEY = 'AIzaSyDkxXw_KQ_7aMGh-Yo601XShmTWHkpofw8';
const GOOGLE_MAPS_DISTANCE_API_KEY = 'AIzaSyAmj_-E1IKIh_N00XYI5Qeozzi_LBArl3o';
const DISTANCE_API_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
let errorTimeout;
// TODO:
// selectable alternate routes
// allow moving pins and recalc
//   update inputs with new location

class Maps extends Component {

  constructor(props) {
    super(props);

    this.state = {
      map: null,
      showDestinationInput: false,
      errorMessage: null,
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
      zoom: 13,
      styles: MapStyles
    });

    this.initialMarker = null;
    this.autocompleteInput(map);
    this.setState({map});
    this.marked = false;
  }

  autocompleteInput(map) {
    const that = this;
    let controls = document.querySelector('.controls');
    let originInput = document.querySelector('.controls--input-origin');
    let destinationInput = document.querySelector('.controls--input-destination');

    this.map = map;
    this.originPlaceId = null;
    this.destinationPlaceId = null;
    this.directionsService = new google.maps.DirectionsService();
    // update directions when dragging icon
    this.directionsDisplay = new google.maps.DirectionsRenderer({
      draggable: true,
      map: that.map
    });
    this.directionsDisplay.setMap(map);

    let originAutocomplete = new google.maps.places.Autocomplete(
        originInput, {placeIdOnly: true});

    let destinationAutocomplete = new google.maps.places.Autocomplete(
        destinationInput, {placeIdOnly: true});

    // update distance/time and inputs
    this.directionsDisplay.addListener('directions_changed', function(data) {
      if(typeof this.dragResult !== 'undefined') {
        that.updateRoute(this.dragResult);
      }
    });

    this.setupPlaceChangedListener(originAutocomplete, 'ORIG');
    this.setupPlaceChangedListener(destinationAutocomplete, 'DEST');

    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(controls);
  }

  updateRoute(dragResult) {
    // update time / distance after dragging
    // currently only on primary route
    let newResult = dragResult.routes[0].legs[0].steps[0];
    // NOTE: call route instead after setting originPlaceId & destinationPlaceId
    this.setState({
      routeTime: newResult.duration.text,
      routeDistance: newResult.distance.text
    })
  }

  setupPlaceChangedListener(autocomplete, mode) {
    let that = this;
    // update bounds
    autocomplete.bindTo('bounds', this.map);
    // listen to change events
    autocomplete.addListener('place_changed', function() {
      let place = autocomplete.getPlace();

      // handle error messaging
      if (!place.place_id) {
        // show notification message
        that.handleError('Please select an option from the dropdown list.');
        return;
      }

      if (mode === 'ORIG') {
        that.originPlaceId = {'placeId': place.place_id};
        // set first marker
        that.addPlaceMarker(place.place_id);
        // show destination input
        that.setState({showDestinationInput: true});
      } else {
        that.removePlaceMarker();
        that.destinationPlaceId = {'placeId': place.place_id};
      }

      that.route();
    });
  };

  route() {
    if (!this.originPlaceId || !this.destinationPlaceId) {
      return;
    }

    const that = this;

    this.directionsService.route({
      origin: this.originPlaceId,
      destination: this.destinationPlaceId,
      travelMode: 'DRIVING',
      provideRouteAlternatives: true,
    }, function(response, status) {
      if (status === 'OK') {
        that.displayRoutes(response);
      } else {
        // display error message
        that.handleError('Directions request failed due to ' + status);
      }
    });
  };

  displayRoutes(response) {
    // display route and alternatives
    const that = this;

    // set primary route
    that.directionsDisplay.setDirections(response);
    // calculate distance of primary route and display
    that.calculateDistance();

    // TODO: implement alternate routes on shared directionsDisplay
    //       currently unable to clear routes on change

    // skip first route and display secondary
    // for (let i = 1, len = response.routes.length; i < len; i++) {
    //   new google.maps.DirectionsRenderer({
    //       map: that.map,
    //       directions: response,
    //       draggable: true,
    //       routeIndex: i,
    //       polylineOptions: {
    //         strokeColor: '#AFAFAF',
    //         strokeWeight: 6,
    //         strokeOpacity: 0.7
    //       }
    //   });
    // }
  }

  calculateDistance() {
    const that = this;
    // calculate distance/time and setState
    Axios.get(DISTANCE_API_URL, {
      params: {
        key: GOOGLE_MAPS_DISTANCE_API_KEY,
        origins: 'place_id:' + that.originPlaceId.placeId,
        destinations: 'place_id:' + that.destinationPlaceId.placeId,
        units: 'imperial'
      }
    })
    .then(response => {
      that.setState({
        routeTime: response.data.rows[0].elements[0].duration.text,
        routeDistance: response.data.rows[0].elements[0].distance.text
      })
    })
    .catch(error => {
      console.warn(error);
    });
  }

  handleError(message) {
    const that = this;

    this.setState({errorMessage: message});

    window.clearTimeout(errorTimeout);
    // hide notification message after 2 secs
    errorTimeout = setTimeout(function() {
      that.setState({errorMessage: null})
    }, 2000)
  }

  removePlaceMarker() {
    // remove existing markers
    if (this.initialMarker) {
      this.initialMarker.setMap(null);
    }
  }

  addPlaceMarker(placeId) {
    // add marker on start location once
    if (this.marked) return;
    this.marked = true;

    const that = this;
    let service = new google.maps.places.PlacesService(that.map);
    // clear existing marker
    that.removePlaceMarker();
    // set marker based on placeId
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
    });
  }

  render() {
    let destinationClasses = Classnames (
      'input controls--input controls--input-destination', {
      'is-hidden': this.state.showDestinationInput ? false : true
      }
    )

    let infoboxClasses = Classnames (
      'control controls--infobox', {
      'is-hidden': this.state.routeTime && this.state.routeDistance ? false : true
      }
    )

    let notificationClasses = Classnames (
      'notification is-danger', {
      'is-hidden': this.state.errorMessage ? false : true
      }
    )

    let display = <div className="loading"><div className='spinner'></div></div>

    if (this.props.googleMaps) {
      display = <div id="map"></div>
    }

    return (
      <div className="map-container">
        <div className="controls">
          <input
            className="controls--input controls--input-origin input"
            type="text"
            placeholder="Start location" />

          <input
            className={destinationClasses}
            type="text"
            placeholder="Destination location" />

          <div className={infoboxClasses}>
            <div className="tags has-addons">
              <span className="tag is-dark">Time</span>
              <span className="tag is-info">{this.state.routeTime}</span>
              <span className="tag is-dark">Distance</span>
              <span className="tag is-info">{this.state.routeDistance}</span>
            </div>
          </div>
        </div>

        <div className={notificationClasses}>
          {this.state.errorMessage}
        </div>

        {display}
      </div>
    );
  }
}

export default GoogleMapsLoader(Maps, {
  libraries: ['places'],
  key: GOOGLE_MAPS_API_KEY,
})
