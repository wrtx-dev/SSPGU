import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ReadGlobalConfig } from "../../wailsjs/go/main/App";

export interface globalConfig {
    clearDataOnUartOpen: boolean,
    debugAutoScroll: boolean,
    debugShowTimestamp: boolean,
    debugShowInOutTag: boolean,
    autoHideSerialSettingOnTermMode: boolean,
    language: string
}

interface globalConfigState {
    config: globalConfig
}

const savedConfig: globalConfig = {
    clearDataOnUartOpen: false,
    debugAutoScroll: true,
    debugShowTimestamp: false,
    debugShowInOutTag: false,
    autoHideSerialSettingOnTermMode: true,
    language: "zh"
}

// const initialState: globalConfigState = {
//     config: savedConfig
// }

const getGlobalConfigInitalState = () => {
    let gs: globalConfigState = {
        config: {
            ...savedConfig,
        }
    }
    return gs;
}

const globalConfigSlice = createSlice({
    name: "globalConfig",
    initialState: getGlobalConfigInitalState(),
    reducers: {
        setGlobalConfig(state, action: PayloadAction<globalConfig>) {
            state.config = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(loadConfig.fulfilled, (state, action) => {
            state.config = action.payload
        })
    }
})

export const { setGlobalConfig } = globalConfigSlice.actions;
export default globalConfigSlice.reducer


export const loadConfig = createAsyncThunk('loadconfig', async (conf: globalConfig) => {
    try {
        let configStr = await ReadGlobalConfig();
        if (configStr !== "") {
            const config = JSON.parse(configStr) as globalConfig;
            conf = {
                ...config
            }
        }
    } catch (e) {
        console.log("load saved config error:", e);
    }
    return conf
})