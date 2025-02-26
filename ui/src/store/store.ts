import { configureStore } from "@reduxjs/toolkit";
import tabSlice from "./tabSelector";
import serialSlice from "./serialStatus";
import globalConfigSlice from "./globalConfig"
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"


export const store = configureStore({
    reducer: {
        tabname: tabSlice,
        serial: serialSlice,
        globalConfig: globalConfigSlice,
    }
});

export type RootState = ReturnType<typeof store.getState>
export const useStoreDispatch = () => useDispatch<typeof store.dispatch>()
export const useStoreSelector: TypedUseSelectorHook<RootState> = useSelector