var express = require('express')
var Web3 = require('web3');
var solc = require('solc');
var fs = require('fs');
var http = require('http');
var bigInt = require("big-integer");
var ipfsAPI = require('ipfs-api');
var fs = require('fs');
var nodepgp = require('node-pgp');
var cmd = require('node-cmd');
var openpgp = require('openpgp');
var qs = require('querystring');
var util = require('util');
var multiparty = require('multiparty');
const fileUpload = require('express-fileupload');

var app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));

var ipfs = ipfsAPI();

// File Crap

code = fs.readFileSync('contracts/MyToken.sol').toString()

compiledCode = solc.compile(code)

let compiledContract = compiledCode.contracts[':MyToken'];

if (compiledContract == null) {
    console.log('We do not have a compiled contract!')
} else {
    console.log('We have a compiled contract!')
}

myTokenAbi = JSON.parse(compiledContract.interface)
//MyToken = web3.eth.contract(myTokenAbi)
MyToken = new web3.eth.Contract(myTokenAbi)
byteCode = compiledCode.contracts[':MyToken'].bytecode
let contractInstance = "";



 app.get('/qrcode', function (req, res) {
         cmd.get(
        'gpg --decrypt authorization.txt.gpg > provider.txt',
        function(err, data, stderr){
            console.log('File has been encrypted');
            code = fs.readFileSync('provider.txt').toString()
            res.send(code);
         }
         );
  })

 app.get('/readdocs', function (req, res) {
         cmd.get(
        'ipfs get QmSP8LtdoWzcZv9vo2Ee6RDxeXFSNpenVDWVd1MhQAopGW',
        function(err, data, stderr){
            console.log('File downloaded');


               cmd.get(
                'gpg --decrypt docs.txt.gpg > docs.txt',
                function(err, data, stderr){
                    console.log('File has been decrypted');
                    code = fs.readFileSync('docs.txt').toString()
                    res.send(code);
         }); });
  })

 app.get('/unencrypt', function (req, res) {
         cmd.get(
        'gpg --decrypt encryptedfile.txt.gpg > authorization.txt',
        function(err, data, stderr){
            console.log('File has been encrypted');
            code = fs.readFileSync('authorization.txt').toString()
            res.send(code);
         }
         );
  })

 app.get('/', function (req, res) {
         res.send(myTokenAbi);
	})

 app.get('/uploadDocument/:useraddress/:host', function(req, res){

    const files = [{
        path: './tmp/' + 'authentication.txt.gpg'
    }]

    ipfs.files.add(files, function(err, hash) {

      if (err) throw err; // If connection is closed
        console.log(hash[0].hash);

        contractInstance.uploadDocument(hash[0].hash, req.params.useraddress, {from: req.params.host, gas:3000000});

        res.send(hash[0].hash);
    });


    web3.eth.sendTransaction({from: web3.eth.accounts[0], to: req.params.host, value: req.params.amount, gas:210000}, function(error,result){
         if(error) {
          console.log(error);
         } else {
          console.log("Provider paid");
         }
    })


 })

 app.get('/downloadDocument/:hash', function(req, res){


     var wstream = fs.createWriteStream('encryptedfile.txt.gpg'); // Write Stream

     const validCID = "QmUEDpDzdxYeyNFHE7avqDHUKYiby7sCbrmA2QRV6eTe6a";

     const stream = ipfs.files.getReadableStream(validCID)

    stream.on('data', (file) => {

      if(file.type !== 'dir') {
        file.content.on('data', (data) => {
         wstream.write(data);
         console.log(data);
         //data.pipe(wstream)
        })
        file.content.resume()
      }
    })


})

 app.get('/request-funds/:amt/:fromId', function (req, res) {
       let amt = req.params.amount;
       let fromId = req.params.fromId;
       contractInstance.requestFromMint(amt, {from: fromId, gas:3000000});
       res.send('Approved');
  })

 app.get('/getTokens', function (req, res) {
     console.log('Retreiving Token Balance (CustomToken)...');
     console.log(util.inspect(contractInstance));
     console.log('Contract Address: ' + contractInstance.options.address);
       let id = req.query.id;
        contractInstance.methods.checkBalance(id).call({from: id}, function(error, result){
    if (error != null) { res.send("DID NOT WORK!"); } else {
                res.send(result);
            }
    });

 })

 app.get('/TransferFunds/:amount/:id/:host', function(req,res,next) { // Are we missing a parameter??
     web3.eth.sendTransaction(web3.toWei(req.params.amount,'ether'), {from: req.params.id, to: req.params.host});
 })

 app.get('/start', function (req, res, next) {
     console.log('Creating new contract...');
    let _address = req.query.id;
     MyToken.options.data = byteCode;
     console.log('Requesting address: ' + _address);
MyToken.deploy({
    arguments: [1000]
})
.send({
    from: _address,
    gas: 1500000,
    gasPrice: '20000000000'
})
.then(function(newContractInstance){
    res.send('Contract Added');
    console.log('testing out some new shit so here is newContract: ' + newContractInstance);
    console.log(util.inspect(contractInstance));
    if (newContractInstance != null ) {
        console.log('created contract at address: ' + newContractInstance.options.address);
    } else {
        console.log('there was an error!');
    }
    contractInstance = newContractInstance;
   // contractInstance = MyToken.at(_address);


}).catch(function(err) {
    if (err == null){ console.log('abahfh');} else {
        console.log(JSON.stringify(err))
    }
    console.log('..well..shit.. no contract being created for you, comrade')
    console.log(err);
    res.send(err)
});

    
})


 app.post('/imgUpload', function(req, res) {
     var myFiles = [];
  //   var myHashes = [];
     var count = 0
    console.log('attempting upload...');
        // parse a file upload
    var form = new multiparty.Form();
 
     // Parts are emitted when parsing the form
    form.on('part', function(part) {
      // You *must* act on the part by reading it
      // NOTE: if you want to ignore it, just call "part.resume()"
        console.log('part!');
      if (!part.filename) {
        // filename is not defined when this is a field and not a file
        console.log('got field named ' + part.name);
        // ignore field's content
        part.resume();
      }

      if (part.filename) {
        // filename is defined when this is a file
        count++;
        console.log('got file named ' + part.name);
        console.log('with... ' + part.value + ' on it');
        myFiles.push(part);
        ipfs.files.add(part, function(err, hash) {
            if (err == null) {
                console.log('pushing hash: ' + JSON.stringify(hash[0].hash))
                let ipfs_hash = hash[0].hash;
                res.send(ipfs_hash);
            } else {
                console.log('IPFS Error!\n'+ err);
            }
            // ignore file's content here
        part.resume();
          });
      }

      part.on('error', function(err) {
        // decide what to do
      });
    });
     // Close emitted after form parsed
    form.on('close', function() {
      console.log('Upload completed!');
     // res.setHeader('text/plain');
    //  res.end('Received ' + count + ' files');
  //      console.log('sending back myHashes... it\'s valus is: ' + myHashes);
    //   res.send(myHashes);
    });
     
    form.parse(req);

 });

   app.get('/uploadDocument/:useraddress', function(req, res){

       let userAddress = req.params.useraddress;
       let privKey = req.query.privateKey;
       let pubKey = userAddress;
       let treatment = req.query.treatment; //treatment they recieved
       let timestamp = req.query.timestamp; //treatment they recieved
       let json_obj = [{
         userAddress: userAddress,
          treatment: treatment,
          timestamp: timestamp
       }
       ];

       let json_str = JSON.stringify(json_obj);

//    const files = [
//  {
//    path: './tmp/' + 'authentication.txt.gpg'
//  }]

    var authFile = "authDocument.txt";

 //   fs.writeFile(files.path)
    fs.writeFile(authFile, json_str, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});

ipfs.files.add(files, function(err, hash) {

    let ipfsHash = hash[0].hash;
  if (err) throw err; // If connection is closed
    console.log(ipfsHash);

    var options, encrypted;
    var privKeyObj = openpgp.key.readArmored(privkey).keys[0];
    //await privKeyObj.decrypt(passphrase);

    options = {
        data: ipfsHash,                             // input as String (or Uint8Array)
        publicKeys: openpgp.key.readArmored(pubkey).keys,  // for encryption
        privateKeys: [privKeyObj]                          // for signing (optional)
    };

    openpgp.encrypt(options).then(function(ciphertext) {
        encrypted = ciphertext.data; // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
        console.log('hash has been encrypted: ' + encrypted);
         contractInstance.uploadDocument(encrypted, req.params.useraddress, {from: req.params.host, gas:3000000});
    });

    res.send(ipfsHash);
});


    web3.eth.sendTransaction({from: web3.eth.accounts[0], to: req.params.host, value: req.params.amount, gas:210000}, function(error,result){
         if(error)
         {
          console.log(error);
         }
         else
         {
          console.log("Provider paid");
         }
      })


   })

    app.get('/downloadDocument/:hash', function(req, res){

        // Decrypt

        let address = req.query.userAddress;
        let privKey = req.query.privKey;
        var privKeyObj = openpgp.key.readArmored(privkey).keys[0];
        contractInstance.methods.downloadDocument(address).call({from: address}, function(error, result){
    if (error != null) { res.send("DID NOT WORK!"); } else {
                let encrypted_hash = result;


                options = {
                    message: openpgp.message.readArmored(encrypted_hash),     // parse armored message
                    publicKeys: openpgp.key.readArmored(userAddress).keys,    // for verification (optional)
                    privateKeys: [privKeyObj]                            // for decryption
                };

                openpgp.decrypt(options).then(function(ipfsHash) {
                    return ipfsHash.data; // 'Hello, World!'
                });


                var wstream = fs.createWriteStream('encryptedfile.txt.gpg');

                //const validCID = "QmUEDpDzdxYeyNFHE7avqDHUKYiby7sCbrmA2QRV6eTe6a"; <---- REPLACED WITH HASHED

                const stream = ipfs.files.getReadableStream(hashed)

                stream.on('data', (file) => {

                  if(file.type !== 'dir') {
                    file.content.on('data', (data) => {
                     wstream.write(data);
                     console.log(data);
                     //data.pipe(wstream)
                    })
                    file.content.resume()
                  }
                })
            }
    });



})




app.listen(8003, function () {
  console.log('Cuzzo\'s app running on port 8003!')
})
