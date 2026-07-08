import { createSlice } from "@reduxjs/toolkit"
const initialState = {
  sidebarOpen: true,
  mobileSidebarOpen: false,
  theme: "light"
}
const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen
    },
    setMobileSidebarOpen: (state, action) => {
      state.mobileSidebarOpen = action.payload
    },
    setTheme: (state, action) => {
      state.theme = action.payload
    }
  }
})
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
  setTheme
} = uiSlice.actions
export default uiSlice.reducer
