import './App.css';
import initData from './Data/Data';

import Comparisons from './Comparisons/Comparisons';
import Overview from './Overview/Overview';
import Profile from './Profile/Profile';
import Progression from './Progression/Progression';

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

const {info, data} = initData();

function App() {
  // let a = fetch("http://localhost:3001/api/data")
  // .then(response => response.json())
  // .then(data => {
  //   console.log(data);
  // });

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
      <Profile 
        info={info}
      />
      <hr/>
      <div className="container">
      <Tabs
        defaultActiveKey="overview"
        id="navtabs"
        className="mb-3"
      >
        <Tab eventKey="overview" title="Overview">
          <Overview
            info={info}
            data={data}
          />
        </Tab>
        <Tab eventKey="comparisons" title="Comparisons">
          <Comparisons
            info={info}
            data={data}
          />
        </Tab>
        <Tab eventKey="progression" title="Progression">
          <Progression
            info={info}
            data={data}
          />
        </Tab>
      </Tabs>
      </div>
      <hr/>
    </div>
  );
}

export default App;
