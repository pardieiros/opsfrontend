import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
// @ts-ignore: no declaration file for module '../../serviceapi/api'
import { getClients } from "../../serviceapi/api";

export interface Client {
  id: number;
  nome2: string;      // abreviatura (número de contribuinte)
  name: string;       // nome principal
  phone: string;      // telefone
}

interface ClientsTableProps {
  onSelect?: (client: Client) => void;
}
export default function ClientsTable({ onSelect }: ClientsTableProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de pesquisa
  const [searchTerm, setSearchTerm] = useState<string>("");
  // Paginação
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  useEffect(() => {
    async function loadClients() {
      try {
        const accessToken = localStorage.getItem("accessToken") || "";
        const data: Client[] = await getClients(accessToken);
        setClients(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  // Filtra clientes pelo termo de pesquisa
  const term = searchTerm.toLowerCase();
  const filteredClients = clients.filter(client => {
    const nome2Field = client.nome2?.toLowerCase() ?? "";
    const name = client.name?.toLowerCase() ?? "";
    const phone = client.phone?.toLowerCase() ?? "";
    return (
      nome2Field.includes(term) ||
      name.includes(term) ||
      phone.includes(term)
    );
  });
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="p-4">Carregando clientes…</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        {/* Barra de pesquisa e paginação */}
        <div className="flex items-center justify-between p-4">
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-3 py-1"
          />
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
        <Table>
          {/* Cabeçalho */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Abreviatura
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Nome
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Telefone
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Corpo */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {paginatedClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => onSelect?.(client)}
                    className="w-full text-left"
                  >
                    {client.nome2}
                  </button>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => onSelect?.(client)}
                    className="w-full text-left"
                  >
                    {client.name}
                  </button>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <button
                    type="button"
                    onClick={() => onSelect?.(client)}
                    className="w-full text-left"
                  >
                    {client.phone}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end p-4 space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}