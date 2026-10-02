import { BrowserRouter } from 'react-router-dom';
import { Route, Routes } from 'react-router-dom'
import Auth_Page from './pages/auth_page';
import Dashboard from './pages/dashboard';
import { Protected_Route } from './components/protected_route';
import DashboardLayout from './components/layout';
import Revenue from './pages/revenue';
import Expenditure from './pages/expenditure';
import InviteCodesPage from './pages/admin/invite_codes';
import PendingUsersPage from './pages/admin/pending_users';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Auth_Page/>}/>
        <Route path='/auth' element={<Auth_Page/>}/>

        {/* Everyone except staff */}
        <Route element={<Protected_Route />}>
          <Route element={<DashboardLayout />}>
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/Revenue" element={<Revenue />} />
            <Route path="/Expenditure" element={<Expenditure />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<Protected_Route allowedRoles={["admin"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin/invite-codes"  element={<InviteCodesPage />} />
            <Route path="/admin/pending-users" element={<PendingUsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;