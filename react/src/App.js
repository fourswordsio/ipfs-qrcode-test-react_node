import React, { Component } from 'react';
import axios from 'axios';
import getWeb3 from './utils/getWeb3.js';
import { Button, Jumbotron, Form, Label, FormControl, ControlLabel , FormGroup } from 'react-bootstrap';
import './App.css';
var QRCode = require('qrcode.react');

var URLs = {
   localhost: 'http://127.0.0.1:8003/',
   tokenCount: 'http://127.0.0.1:8003/getTokens',
   newContract: 'http://127.0.0.1:8003/start',
   imgUpload: 'http://127.0.0.1:8003/imgUpload'
};

class RyanForm extends React.Component {
    
    constructor(props) {
        super(props);
        this.state = {
            url: ''
        };
    }
    
  send() {
    const method = "POST";
    const body = new FormData(this.form);
    console.log('sending info: ' + body);  
    axios.post(URLs.imgUpload, body, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((response) => {
        console.log(response.data)
        console.log(JSON.stringify(response.data))
      let formatted = 'https://ipfs.io/ipfs/' + response.data
      alert(response.data)
      this.setState({
          url: formatted
      });
    })
//    fetch(URLs.imgUpload, { method, body })
//      .then(res => res.json())
//      .then(data => alert(JSON.stringify(data, null, "\t")));
  }
  render() {
    return (
      <div>
        <h1>I'm a form.</h1>
        <form ref={el => (this.form = el)}>
          <label>file:</label>
          <input type="file" name="im-a-file" />
        </form>
        <button onClick={() => this.send()}>Send to Server</button>
<br></br>
<br></br>
<br></br>
<QRCode
  value={this.state.url}
  size={128}
  bgColor={"#ffffff"}
  fgColor={"#000000"}
  level={"L"}
/>
      </div>
    );
  }
}

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      web3: null,
      acc: ''
    };
    this.showTokenCount = this.showTokenCount.bind(this);
    this.newContract = this.newContract.bind(this);
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.
    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })
      // Get accounts.
      results.web3.eth.getAccounts((error, accounts) => {
        if (error == null) {
          this.setState ({
            acc: accounts[0],
          });
        }
      })


    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  showTokenCount() {
    //  Make Server Request
    let acc = this.state.acc
    console.log('attempting to call ' + URLs.tokenCount);
    axios.get(URLs.tokenCount, {
          params: {
              id: acc
          }
      }).then((response) => {
        var unformatted_data = response.data;
        var data = JSON.stringify(unformatted_data);
        alert(data);
      })
      .catch((error) => {
        console.log(error);

      });
  }

  showAbi() {
    axios.get(URLs.localhost).then((response) => {
        var unformatted_data = response.data;
        var data = JSON.stringify(unformatted_data);
        alert(data);
      })
      .catch((error) => {
        console.log(error);

      });
  }

  uploadHandler = () => {
      
    console.log('handling upload...')
    if (this.state.activeFile == null) {
      alert('Please Select an Image!!');
    } else {
    let af = this.state.activeFile;
    console.log('active file: ' + JSON.stringify(af))
    
    let data = new FormData();
    data.append('file', af);
    data.append('name', af.name);
    console.log('attempting to post: ' + JSON.stringify(data))
    axios.post(URLs.imgUpload, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
     }
    )
    }
  }

  addFile = (event: any): void => {
    let activeFile = event.target.files[0];
    console.log('attempting to add file: {\n' + JSON.stringify(activeFile) + '\n}')
      console.log('Added file ' + activeFile);
      this.setState ({
        activeFile: activeFile,
      });
  }

  newContract() {
      let acc = this.state.acc
    axios.get(URLs.newContract, {
          params: {
              id: acc
          }
      }).then((response) => {
        var unformatted_data = response.data;
        var data = JSON.stringify(unformatted_data);
        alert(data);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="App">
        <Button bsStyle="success" style={{margin: '50px'}} onClick={this.showTokenCount}>Get Token Count</Button>
        <Button bsStyle="success" style={{margin: '50px'}} onClick={this.showAbi}>Get ABI</Button>
        <Button bsStyle="success" style={{margin: '50px'}} onClick={this.newContract}>New Contract</Button>
        <Jumbotron><h1>Jumbo</h1></Jumbotron>


        <RyanForm />
         
      </div>
        
    );
  }
}

export default App;
