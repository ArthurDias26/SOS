import { Navigate, Route, Routes } from 'react-router'
import Layout from './components/Layout/Layout'
import RotaProtegida from './components/RotaProtegida/RotaProtegida'
import ClienteForm from './pages/ClienteForm/ClienteForm'
import ClientesLista from './pages/ClientesLista/ClientesLista'
import Login from './pages/Login/Login'
import NaoEncontrado from './pages/NaoEncontrado/NaoEncontrado'
import OrdemDetalhe from './pages/OrdemDetalhe/OrdemDetalhe'
import OrdemNova from './pages/OrdemNova/OrdemNova'
import OrdensLista from './pages/OrdensLista/OrdensLista'
import SemPermissao from './pages/SemPermissao/SemPermissao'
import { CARGOS } from './utils/status'

/** Todas as rotas da aplicação, em um só lugar. */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Daqui para baixo, só com login */}
      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/os" replace />} />
          <Route path="os" element={<OrdensLista />} />
          <Route path="os/:id" element={<OrdemDetalhe />} />

          {/* Só Atendente */}
          <Route element={<RotaProtegida cargo={CARGOS.ATENDENTE} />}>
            <Route path="os/nova" element={<OrdemNova />} />
            <Route path="clientes" element={<ClientesLista />} />
            <Route path="clientes/novo" element={<ClienteForm />} />
            <Route path="clientes/:id/editar" element={<ClienteForm />} />
          </Route>

          <Route path="sem-permissao" element={<SemPermissao />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Route>
      </Route>
    </Routes>
  )
}
