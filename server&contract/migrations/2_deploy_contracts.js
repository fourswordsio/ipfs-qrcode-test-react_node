var MyToken = artifacts.require("./MyToken.sol");

var myAddress = "0xc90743068c0382a500526c8f09adabd8e987e2cb";
var gas = 6000000;
module.exports = function(deployer) {
  deployer.deploy(MyToken, 10000, {
    gas: gas,
    from: myAddress
  });    
};