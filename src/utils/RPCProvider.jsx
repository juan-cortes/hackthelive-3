import React, { useState, useEffect } from "react";
import { RPC } from "@mixer/postmessage-rpc";

export const RPCContext = React.createContext({});

const RPCProvider = ({ children }) => {
  const [requestAccount, setRequestAccounts] = useState({});
  const [transactionData, setTransactionData] = useState({});

  useEffect(() => {
    if (!window.opener) return null;

    const rpc = new RPC({
      target: window.opener,
      service: "ledger-widget",
    });

    // expose methods to the consumer
    rpc.expose("requestAccount",
        () => new Promise((resolve, reject) =>  setRequestAccounts({ resolve, reject }))
    );

    rpc.expose("signTransaction", (transaction, derivationPath) => {
      setTransactionData({transaction, derivationPath});
    });

    console.log('rpc ready before');
    rpc.call("ready").then(() => console.log("ready call"));
    console.log('rpc ready after');
  }, []);

  return (
    <RPCContext.Provider value={{requestAccount, transactionData}}>{children}</RPCContext.Provider>
  );
};

export default RPCProvider;
