import { BrowserRouter } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom'
import { ToastProvider } from './context/toast_context';
import Auth_Page from './pages/auth_page';
import Dashboard from './pages/dashboard';
import { Protected_Route } from './components/protected_route';
import DashboardLayout from './components/layout';
import Revenue from './pages/revenue';
import Expenditure from './pages/expenditure';
import Reports from './pages/reports';
import ClearanceReport from './pages/clearance_report';
import InviteCodesPage from './pages/admin/invite_codes';
import AuditTrail from './pages/admin/audit_trail';
import Settings from './pages/settings';
import ResetPassword from './pages/reset_password';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Auth_Page/>}/>
          <Route path='/auth' element={<Auth_Page/>}/>
          <Route path='/reset-password' element={<ResetPassword/>}/>

          <Route element={<Protected_Route/>}>
            <Route element={<DashboardLayout />}>
              <Route path="/Dashboard" element={<Dashboard />} />
              <Route path="/Settings" element={<Settings />} />
            </Route>
          </Route>
          
          <Route element={<Protected_Route allowedRoles={['admin', 'treasurer', 'sk_chairman', 'sk_member']}/>}>
            <Route element={<DashboardLayout />}>
              <Route path="/Revenue" element={<Revenue />} />
              <Route path="/Expenditure" element={<Expenditure />} />
            </Route>
          </Route>

          <Route element={<Protected_Route allowedRoles={['treasurer', 'admin']}/>}>
            <Route element={<DashboardLayout />}>
              <Route path="/Reports" element={<Reports />} />
            </Route>
          </Route>

          <Route element={<Protected_Route allowedRoles={['staff', 'admin']}/>}>
            <Route element={<DashboardLayout />}>
              <Route path="/ClearanceReport" element={<ClearanceReport />} />
            </Route>
          </Route>

          <Route element={<Protected_Route allowedRoles={["admin"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/invite-codes" element={<InviteCodesPage />} />
              <Route path="/admin/audit-trail" element={<AuditTrail />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;