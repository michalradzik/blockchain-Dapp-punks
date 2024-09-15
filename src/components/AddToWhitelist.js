import React, { useState } from 'react';

const AddToWhitelist = ({ nftContract }) => {
  const [userAddress, setUserAddress] = useState('');

  const handleAddToWhitelist = async () => {
    try {
      const signer = nftContract.provider.getSigner();
      const tx = await nftContract.connect(signer).addToWhitelist(userAddress);
      await tx.wait();
      alert(`User ${userAddress} has been added to whitelist`);
    } catch (error) {
      console.error('Error adding user to whitelist:', error);
      alert('Error adding user to whitelist');
    }
  };

  return (
    <div>
      <h3>Add User to Whitelist</h3>
      <input
        type="text"
        placeholder="Enter user address"
        value={userAddress}
        onChange={(e) => setUserAddress(e.target.value)}
      />
      <button onClick={handleAddToWhitelist}>Add to Whitelist</button>
    </div>
  );
};

export default AddToWhitelist;
