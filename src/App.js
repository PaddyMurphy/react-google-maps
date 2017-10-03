import React, { Component } from 'react';
import './App.css';
import Maps from './Maps';

class App extends Component {
  render() {
    return (
      <div className="app">
        <div className="app--map-container">
          <Maps />
        </div>
      </div>
    );
  }
}

export default App;
