import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
// import { stopReportingRuntimeErrors } from 'react-error-overlay';
import reportWebVitals from './reportWebVitals';

// if (process.env.NODE_ENV === 'development') {
//   stopReportingRuntimeErrors(); // Disables error overlays in development mode
// }
ReactDOM.render(

    <App />,
  
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
