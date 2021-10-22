import Eth from "@ledgerhq/hw-app-eth";
import eip55 from "eip55";

const resolver = async (
  transport,
  { path, verify, askChainCode }
) => {
  const eth = new Eth(transport);
  const r = await eth.getAddress(path, verify, askChainCode || false);
  const address = eip55.encode(r.address);
  return {
    path,
    address,
    publicKey: r.publicKey,
    chainCode: r.chainCode,
  };
};

export default resolver;
