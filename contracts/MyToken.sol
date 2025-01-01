// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; // Import ERC20

contract MyToken is ERC20, ERC20Permit, ERC20Votes {
    constructor() 
        ERC20("MyGovernanceToken", "MGT") 
        ERC20Permit("MyGovernanceToken")
    {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Początkowa podaż 1,000,000 tokenów
    }

    // Nadpisujemy funkcje wymagane ze względu na wielokrotne dziedziczenie
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes) // Nadpisanie z ERC20 i ERC20Votes
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes) // Nadpisanie z ERC20 i ERC20Votes
    {
        super._burn(account, amount);
    }
}

