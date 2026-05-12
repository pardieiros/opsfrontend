import { useEffect, useState } from "react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { fetch360CalendarEvents } from "../../serviceapi/imprimir360";

export default function Imprimir360Calendario() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError("");
        const data = await fetch360CalendarEvents();
        setEvents(
          (data || []).map((event: any) => ({
            ...event,
            className:
              event.calendar === "success"
                ? "fc-event-success"
                : event.calendar === "warning"
                  ? "fc-event-warning"
                  : "fc-event-primary",
          })),
        );
      } catch (err: any) {
        setError(err.message || "Erro ao carregar o calendário.");
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  return (
    <>
      <PageMeta title="360Imprimir Calendário" description="Calendário de picagens e impressões 360Imprimir" />
      <PageBreadcrumb pageTitle="360Imprimir / Calendário" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/[0.05] dark:bg-white/[0.03]">
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Shipment / vai hoje
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            Stock / picagens
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            Impressões
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">A carregar calendário...</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            height="auto"
            events={events}
          />
        )}
      </div>
    </>
  );
}

