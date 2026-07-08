import { Provider } from "react-redux"
import { BrowserRouter } from "react-router-dom"
import { store } from "@/store"
import { AuthProvider } from "@/context/AuthProvider"
import ToastProvider from "@/components/feedback/ToastProvider"
export function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  )
}
export default AppProviders
