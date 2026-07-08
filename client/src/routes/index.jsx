import { Navigate } from "react-router-dom"
import { ROLES } from "@/constants/roles"
import { ROUTES } from "@/constants/routes"
import AuthLayout from "@/layouts/AuthLayout"
import DashboardLayout from "@/layouts/DashboardLayout"
import ProtectedRoute from "@/routes/ProtectedRoute"
import PublicRoute from "@/routes/PublicRoute"
import RoleRoute from "@/routes/RoleRoute"
import LoginPage from "@/pages/auth/LoginPage"
import TwoFactorPage from "@/pages/auth/TwoFactorPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"
import ProfilePage from "@/pages/auth/ProfilePage"
import SecurityPage from "@/pages/auth/SecurityPage"
import SessionsPage from "@/pages/auth/SessionsPage"
import NotificationsPage from "@/pages/shared/NotificationsPage"
import NotFoundPage from "@/pages/shared/NotFoundPage"
import UnauthorizedPage from "@/pages/shared/UnauthorizedPage"
import { adminRoutes } from "@/routes/roleRoutes/admin.routes"
import { receptionistRoutes } from "@/routes/roleRoutes/receptionist.routes"
import { doctorRoutes } from "@/routes/roleRoutes/doctor.routes"
import { nurseRoutes } from "@/routes/roleRoutes/nurse.routes"
import { pharmacistRoutes } from "@/routes/roleRoutes/pharmacist.routes"
import { labTechnicianRoutes } from "@/routes/roleRoutes/labTechnician.routes"
import { patientRoutes } from "@/routes/roleRoutes/patient.routes"
function wrapRoleRoutes(routeConfig) {
  return {
    element: <RoleRoute roles={routeConfig.meta.roles} />,
    children: [
      {
        element: <DashboardLayout />,
        children: routeConfig.children
      }
    ]
  }
}
export const routes = [
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.LOGIN, element: <LoginPage /> },
          { path: ROUTES.TWO_FACTOR, element: <TwoFactorPage /> },
          { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
          { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> }
        ]
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.PROFILE, element: <ProfilePage /> },
          { path: ROUTES.SECURITY, element: <SecurityPage /> },
          { path: ROUTES.SESSIONS, element: <SessionsPage /> },
          { path: ROUTES.NOTIFICATIONS, element: <NotificationsPage /> },
          { path: ROUTES.UNAUTHORIZED, element: <UnauthorizedPage /> }
        ]
      },
      { path: adminRoutes.path, ...wrapRoleRoutes(adminRoutes) },
      { path: receptionistRoutes.path, ...wrapRoleRoutes(receptionistRoutes) },
      { path: doctorRoutes.path, ...wrapRoleRoutes(doctorRoutes) },
      { path: nurseRoutes.path, ...wrapRoleRoutes(nurseRoutes) },
      { path: pharmacistRoutes.path, ...wrapRoleRoutes(pharmacistRoutes) },
      { path: labTechnicianRoutes.path, ...wrapRoleRoutes(labTechnicianRoutes) },
      { path: patientRoutes.path, ...wrapRoleRoutes(patientRoutes) }
    ]
  },
  { path: "/", element: <Navigate to={ROUTES.LOGIN} replace /> },
  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> }
]
export const ROLE_ROUTE_MAP = {
  [ROLES.ADMIN]: adminRoutes.path,
  [ROLES.RECEPTIONIST]: receptionistRoutes.path,
  [ROLES.DOCTOR]: doctorRoutes.path,
  [ROLES.NURSE]: nurseRoutes.path,
  [ROLES.PHARMACIST]: pharmacistRoutes.path,
  [ROLES.LAB_TECHNICIAN]: labTechnicianRoutes.path,
  [ROLES.PATIENT]: patientRoutes.path
}
