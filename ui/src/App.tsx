import ContentUI from "./components/windowUI"
import TitleBar from "./components/titleBar"
import { useStoreDispatch, useStoreSelector } from "./store/store"
import { loadConfig } from "./store/globalConfig";
import { useEffect } from "react";

export default function App() {
  const dispatch = useStoreDispatch();
  const config = useStoreSelector((state) => state.globalConfig.config);
  useEffect(() => {
    dispatch(loadConfig(config));
  }, [])
  return (
    <div className="flex flex-col w-screen h-screen bg-gray-100 border-t-1 shadow-sm">
      <div className="flex flex-row w-full items-center bg-transparent">
        <TitleBar />
      </div>
      <ContentUI />
    </div>
  )
}
