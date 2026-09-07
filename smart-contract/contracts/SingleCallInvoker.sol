// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SingleCallInvoker {
    function execute(address target, bytes calldata data) external payable returns (bytes memory) {
        (bool success, bytes memory returnData) = target.call{value: msg.value}(data);
        require(success, "call failed");
        return returnData;
    }
}
