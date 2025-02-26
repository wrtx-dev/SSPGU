import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface TabState {
    tab: string
}


const initialState: TabState = {
    tab: "debug",
}

const tabSlice = createSlice({
    name: "tabname",
    initialState,
    reducers: {
        setTabs(state, action: PayloadAction<string>) {
            state.tab = action.payload
        }
    }
})

export const { setTabs } = tabSlice.actions
export default tabSlice.reducer