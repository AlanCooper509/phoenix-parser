import React, {useState, useEffect} from 'react';
import axios from 'axios';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import './App.css';

import Comparisons from './Comparisons/Comparisons';
import Overview from './Overview/Overview';
import Profile from './Profile/Profile';
import Progression from './Progression/Progression';

function App() {
  const [info, setInfo] = useState({player: "Loading...", number: "Loading...", title: "Loading...", last_updated: "Loading..."});
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/user/TUSA/7085');
        const responseData = response.data;

        // Update state or perform actions with the data
        setInfo(responseData["info"]);
        setData(responseData["scores"]);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // let b = fetch("http://localhost:3001/api/post", {
  //     method: "POST",
  //     headers: {
  //         "Content-type": "application/json"
  //     },
  //     body: JSON.stringify({"key1": 123, "key2": "abcdefg"})
  // }).then(response => response.json())
  // .then(data => {
  //     console.log(data)
  // });

  return (
    <div className="App">
      <Profile info={info}/>
      <hr/>
      <div className="container">
      <Tabs
        defaultActiveKey="overview"
        id="navtabs"
        className="mb-3"
      >
        <Tab eventKey="overview" title="Overview">
          <Overview info={info} data={data}/>
        </Tab>
        <Tab eventKey="comparisons" title="Comparisons">
          <Comparisons info={info} data={data}/>
        </Tab>
        <Tab eventKey="progression" title="Progression">
          <Progression info={info} data={data}/>
        </Tab>
      </Tabs>
      </div>
      <hr/>
    </div>
  );
}

export default App;
