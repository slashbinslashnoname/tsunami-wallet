export const formatAddress = (address: string) => {
  if (address.length > 16) {
    return `${address.slice(0, 12)}...${address.slice(-12)}`;
  }
  return address;
};