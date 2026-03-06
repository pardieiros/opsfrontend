import React, { useState, useEffect } from "react";
import { fetchCliches } from "../../../serviceapi/api";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../table";

interface ModalClichesProps {
  onClose: () => void;
  onSelect: (cliche: any) => void; // TODO: refine type
}

export default function ModalCliches({ onClose, onSelect }: ModalClichesProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{ results: any[]; next: string | null; previous: string | null }>({
    results: [],
    next: null,
    previous: null,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const payload = await fetchCliches(page, 10, search);
        const results = Array.isArray(payload) ? payload : payload.results;
        const next = Array.isArray(payload) ? null : payload.next;
        const previous = Array.isArray(payload) ? null : payload.previous;
        setData({ results, next, previous });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page, search]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Selecionar Clichê</h2>
          <button className="text-2xl leading-none px-2" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="w-full">
            {/* Top search + pagination */}
            <div className="flex items-center justify-between p-4">
              <input
                type="text"
                placeholder="Pesquisar por nome do trabalho..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded px-3 py-1"
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1 || loading}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span>{page}</span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.next || loading}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <p className="py-4 text-center">Carregando...</p>
            ) : (
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Nome do Trabalho
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Tipo
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Tamanho
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Número
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {data.results
                    .filter((c) =>
                      c.nome_trabalho?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((c) => (
                      <TableRow key={c.id} className="hover:bg-gray-50">
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(c);
                              onClose();
                            }}
                            className="w-full text-left"
                          >
                            {c.nome_trabalho}
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(c);
                              onClose();
                            }}
                            className="w-full text-left"
                          >
                            {c.tipo_cliche}
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(c);
                              onClose();
                            }}
                            className="w-full text-left"
                          >
                            {c.tamanho}
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                          <button
                            type="button"
                            onClick={() => {
                              onSelect(c);
                              onClose();
                            }}
                            className="w-full text-left"
                          >
                            {c.numero_cliche}
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Bottom pagination */}
          <div className="flex items-center justify-end p-4 space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span>{page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.next || loading}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}