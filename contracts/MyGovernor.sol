// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract MyGovernor is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction {
    constructor(ERC20Votes _token)
        Governor("MyGovernor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)  // 4% quorum
    {}

    function votingDelay() public pure override returns (uint256) {
        return 1; // 1 block delay
    }

    function votingPeriod() public pure override returns (uint256) {
        return 45818; // ~1 week in blocks (assuming 13s/block)
    }

    // Nadpisanie funkcji quorum
    function quorum(uint256 blockNumber) public view override(IGovernor, GovernorVotesQuorumFraction) returns (uint256) {
        return super.quorum(blockNumber);
    }

    // Nadpisanie wymagane przez Solidity ze względu na wielokrotne dziedziczenie
    function _getVotes(address account, uint256 blockNumber, bytes memory params)
        internal
        view
        override(Governor, GovernorVotes)
        returns (uint256)
    {
        return super._getVotes(account, blockNumber, params);
    }
}


