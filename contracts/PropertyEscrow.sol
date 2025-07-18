    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.19;

    import "./PropertyToken.sol";

   contract PropertyEscrow {
    address public buyer;
    address public buyerSolicitor;
    address public seller;
    uint256 public price;
    uint256 public tokenId;
    PropertyToken public propertyToken;

    enum State { AWAITING_PAYMENT, AWAITING_VERIFICATION, COMPLETE, REFUNDED }
    State public state;

    // Events
    event Deposited(address indexed from, uint256 amount);
    event Completed(address indexed buyer, address indexed seller, uint256 tokenId);
    event Refunded(address indexed to, uint256 amount);

    constructor(
        address _buyer,
        address _buyerSolicitor,
        address _seller,
        uint256 _price,
        address _propertyToken,
        uint256 _tokenId
    ) {
        buyer = _buyer;
        buyerSolicitor = _buyerSolicitor;
        seller = _seller;
        price = _price;
        propertyToken = PropertyToken(_propertyToken);
        tokenId = _tokenId;
        state = State.AWAITING_PAYMENT;
    }

    modifier onlyBuyerSolicitor() {
        require(msg.sender == buyerSolicitor, "Only buyer's solicitor allowed");
        _;
    }

    function deposit() external payable onlyBuyerSolicitor {
        require(state == State.AWAITING_PAYMENT, "Not awaiting payment");
        require(msg.value == price, "Incorrect payment amount");

        state = State.AWAITING_VERIFICATION;
        emit Deposited(msg.sender, msg.value);
    }

    event FundsTransferred(address indexed to, uint amount);


    function verifyAndComplete() external onlyBuyerSolicitor {
        require(state == State.AWAITING_VERIFICATION, "Not in verification phase");

    // ✅ NFT is owned by seller solicitor, not seller
    address currentOwner = propertyToken.ownerOf(tokenId);
    require(currentOwner != address(0), "Invalid NFT owner");

    // ✅ Transfer NFT from whoever currently owns it to the buyer
    propertyToken.transferFrom(currentOwner, buyer, tokenId);

    // ✅ ETH still goes to seller (not solicitor)
    payable(seller).transfer(price);
     emit FundsTransferred(seller, price);


    state = State.COMPLETE;
    emit Completed(buyer, seller, tokenId);
    }

    function refundBuyer() external onlyBuyerSolicitor {
        require(state == State.AWAITING_VERIFICATION, "Refund not allowed");

        // Refund ETH back to buyer
        payable(buyer).transfer(address(this).balance);
        state = State.REFUNDED;

        emit Refunded(buyer, price);
    }

    function getState() external view returns (State) {
        return state;
    }
}
