import { BrowserRouter } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom'
import Auth_Page from './pages/auth_page';
import Dashboard from './pages/dashboard';
import { Protected_Route } from './components/protected_route';
import DashboardLayout from './components/layout';
import Revenue from './pages/revenue';
import Expenditure from './pages/expenditure';
import Reports from './pages/reports';
import InviteCodesPage from './pages/admin/invite_codes';
import ProjectsPage from './pages/admin/projects';
import ResetPassword from './pages/reset_password';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Auth_Page/>}/>
        <Route path='/auth' element={<Auth_Page/>}/>
        <Route path='/reset-password' element={<ResetPassword/>}/>

        {/* General Access for all logged-in users */}
        <Route element={<Protected_Route/>}>
          <Route element={<DashboardLayout />}>
            <Route path="/Dashboard" element={<Dashboard />} />
          </Route>
        </Route>
        
        {/* Financials: Admin, Treasurer, SK */}
        <Route element={<Protected_Route allowedRoles={['admin', 'treasurer', 'sk_chairman', 'sk_member']}/>}>
          <Route element={<DashboardLayout />}>
            <Route path="/Revenue" element={<Revenue />} />
            <Route path="/Expenditure" element={<Expenditure />} />
          </Route>
        </Route>

        {/* Reports: Staff and Treasurer */}
        <Route element={<Protected_Route allowedRoles={['staff', 'treasurer']}/>}>
          <Route element={<DashboardLayout />}>
            <Route path="/Reports" element={<Reports />} />
          </Route>
        </Route>

        {/* Treasurer: Project Approvals */}
        <Route element={<Protected_Route allowedRoles={['treasurer']}/>}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/projects" element={<ProjectsPage />} />
          </Route>
        </Route>

        {/* Admin ONLY */}
        <Route element={<Protected_Route allowedRoles={["admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/invite-codes" element={<InviteCodesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;