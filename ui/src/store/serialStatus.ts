import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface serialState {
    isOpen: boolean
}

const initialState: serialState = {
    isOpen: false
}

const serialSlice = createSlice({
    name: "serialState",
    initialState,
    reducers: {
        setSerialOpenStatus(state, action: PayloadAction<boolean>) {
            state.isOpen = action.payload
        }
    }
})

export const { setSerialOpenStatus } = serialSlice.actions
export default serialSlice.reducer