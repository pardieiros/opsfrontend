import { fetchWithAuth } from "./serviceapi/api";

// Override global fetch so all fetch calls use our OAuth wrapper
// @ts-ignore: assign auth wrapper to global fetch
globalThis.fetch = fetchWithAuth as unknown as typeof window.fetch;
import './pdfjsConfig';
import { Routes, Route } from "react-router-dom";
import { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Aprovedmaquete from './pages/Maquetes/Aprovedmaquete';
import Cliches from "./pages/Flexografia/Cliches";
import ClichesRecebidos from "./pages/Flexografia/ClichesRecebidos";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import Criar from "./pages/OPs/Criar";
import Consultar from "./pages/OPs/Consultar";
import Gerir from "./pages/OPs/Gerir";
import Seribase from "./pages/Serigrafia/Seribase";
import Enviados from "./pages/Serigrafia/Enviados";
import Maquetes from "./pages/Maquetes/Maquetes";
import TamanhosCriar from "./pages/Tamanhos/Criar";
import TamanhosConsultar from "./pages/Tamanhos/Consultar";
import TamanhosEditar from "./pages/Tamanhos/Editar";
import Project3d from "./pages/Project3d/Project3d";
import GestaoImpressao from "./pages/Impressao/Gestao";
import AppLayout from "./layout/AppLayout";
import Prepfich from "./pages/Digital/Prepfich";
import Home from "./pages/Dashboard/Home";
import OffSet from "./pages/OffSet/Pedchap";
import Pedchap from "./pages/OffSet/Pedchap";
import Email from "./pages/Emails/email";
import Produtos from "./pages/Produtos/Gerir";
import ClientsList from "./pages/Clients/ClientsList";
import ClientDetail from "./pages/Clients/ClientDetail";
import ClientEdit from "./pages/Clients/ClientEdit";
import ClientNew from "./pages/Clients/ClientNew";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import { ServiceWorkerUpdate } from "./components/common/ServiceWorkerUpdate";


function PrivateRoute({ children }: { children: JSX.Element }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken) {
      if (refreshToken) {
        fetch("https://plastic.floow.pt/api/token/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh: refreshToken }),
        })
          .then(res => {
            if (!res.ok) throw new Error("Não foi possível renovar token");
            return res.json();
          })
          .then(data => {
            localStorage.setItem("accessToken", data.access);
            setLoading(false);
          })
          .catch(() => {
            localStorage.removeItem("refreshToken");
            navigate("/signin");
          });
      } else {
        navigate("/signin");
      }
    } else {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) return null;
  return children;
}


export default function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const rt = localStorage.getItem("refreshToken");
    if (rt) {
      fetch("https://plastic.floow.pt/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: rt }),
      })
        .then(res => {
          if (!res.ok) throw new Error("Refresh failed");
          return res.json();
        })
        .then(data => {
          localStorage.setItem("accessToken", data.access);
          // After refreshing token, navigate back to current path or home
          navigate(window.location.pathname || "/", { replace: true });
        })
        .catch(() => {
          localStorage.removeItem("refreshToken");
        });
    }
  }, [navigate]);
  const workName = "Nome do Trabalho";  // TODO: substituir pelo valor real
  const dynamicLink = "https://example.com";  // TODO: substituir pelo link gerado

  return (
    <>
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index path="/" element={<Home />} />

          {/* Others Page */}
          <Route path="/profile" element={<UserProfiles />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/blank" element={<Blank />} />

          {/* Forms */}
          <Route path="/form-elements" element={<FormElements />} />

          {/* Tables */}
          <Route path="/basic-tables" element={<BasicTables />} />
          
          {/* OPs Pages */}
          <Route path="/ops/criar" element={<Criar />} />
          <Route path="/ops/consultar" element={<Consultar />} />
          <Route path="/ops/gerir" element={<Gerir />} />
          <Route path="/maquetes" element={<Maquetes />} />
          <Route path="/serigrafia" element={<Seribase />} />
          <Route path="/serigrafia/enviadas" element={<Enviados />} />
          <Route path="/flexografia/cliches" element={<Cliches />} />
          <Route path="/flexografia/cliches-enviados" element={<ClichesRecebidos />} />
          <Route path="/produtos" element={<Produtos />} />
          {/* Digital Pages */}
          <Route path="/digital/preparacao-ficheiros" element={<Prepfich />} />

          {/* Tamanhos Pages */}
          <Route path="/tamanhos/criar" element={<TamanhosCriar />} />
          <Route path="/tamanhos/consultar" element={<TamanhosConsultar />} />
          <Route path="/tamanhos/editar/:id" element={<TamanhosEditar />} />
          <Route path="/project3d" element={<Project3d />} />

          {/* Impressão Pages */}
          <Route path="/impressao/gestao" element={<GestaoImpressao />} />

          {/* Ui Elements */}
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/badge" element={<Badges />} />
          <Route path="/buttons" element={<Buttons />} />
          <Route path="/images" element={<Images />} />
          <Route path="/videos" element={<Videos />} />

          {/* Charts */}
          <Route path="/line-chart" element={<LineChart />} />
          <Route path="/bar-chart" element={<BarChart />} />

          {/* Offset Pages */}
          <Route path="/off-set" element={<OffSet />} />
          <Route path="/off-set/pedidos-chapas" element={<Pedchap />} />
          <Route
            path="/emails"
            element={<Email workName={workName} dynamicLink={dynamicLink} />}
          />

          {/* Clientes Pages */}
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/new" element={<ClientNew />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<ClientEdit />} />

          {/* Notifications Page */}
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        {/* Public approval page */}
        <Route path="/maquetes/:id/approve" element={<Aprovedmaquete />} />

        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Fallback Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Service Worker Update Notification */}
      <ServiceWorkerUpdate />
    </>
  );
}
