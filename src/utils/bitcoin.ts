export const formatAddress = (address: string) => {
  if (address.length > 16) {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  }
  return address;
};