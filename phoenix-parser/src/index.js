import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import initData from './Data/Data';
import Overview from './Overview/Overview';
import Profile from './Profile/Profile';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
const {info, data} = initData();

root.render(
  <React.StrictMode>
    <Profile 
      info={info}
    />
    <hr/>
    <Overview
      info={info}
      data={data}
    />
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
