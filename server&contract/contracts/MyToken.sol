pragma solidity^0.4.19;
pragma experimental ABIEncoderV2;

contract MyToken {

    event ImageAdded(address _address);

    mapping(address=> uint) balances;
    uint totalSupply;
    address centralBank;
    mapping(address => string) names;

    mapping(address => Image[]) images;

    Image[] addrWithFaces;

    struct Image {
        string data;
        string name;
    }

    function MyToken(uint circulatingSupply) {
        centralBank = msg.sender;
        totalSupply = circulatingSupply;
        balances[centralBank] = circulatingSupply;
    }

    function storeImage(address _address, string data, string name ) public {
        Image memory i = Image(data, name);
        bool hasImages = images[_address].length != 0;
        if (hasImages) {
            images[_address].push(i);
        }

       ImageAdded(_address);
    }

    function getImagesForAddress(address _address) public returns (Image[]){
         return images[_address];
    }

    function hasImages(address _address) public returns (bool){
         return (images[_address].length != 0);
    }

    function checkBalance(address _address) constant returns (uint) {
        return balances[_address];
    }

    function sendTokens(address to, uint amount) public {
        address sender = msg.sender;
        balances[sender] = balances[sender] - amount;
        balances[to] += amount;
    }

    modifier hasFunds(address to, uint amt) {
        if (balances[to] >= amt) {
            _;
        } else {
            throw;
        }
    }

    modifier fundsAreLoanable(uint amt) {
        if (balances[centralBank] >= amt) {
            _;
        } else {
            throw;
        }
    }

    function requestFromMint(uint amount) fundsAreLoanable(amount) public {
        balances[msg.sender] += amount;
        balances[centralBank] -= amount;
    }

    function getCentralBankBalance() constant returns (uint) {
        return balances[centralBank];
    }

}
