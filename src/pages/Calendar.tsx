import { useState, useRef, useEffect } from "react";
import { fetchOrdensProducao, fetchAllOrdensProducao, fetchOrdensProducaoForCalendar, fetchCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent, fetchWithAuth } from "../serviceapi/api";
import DetalhesOP from "../components/ui/modal/Detalhesops";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, DateSelectArg, EventClickArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import Spinner from "../components/ui/loaders/Spinner";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar?: string;
    description?: string;
    created_by_name?: string;
  };
}

const Calendar: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [detalhesOpen, setDetalhesOpen] = useState<boolean>(false);
  const [detalhesOpId, setDetalhesOpId] = useState<number | null>(null);

  const calendarsEvents = {
    Danger: "danger",
    Success: "success",
    Primary: "primary",
    Warning: "warning",
  };

  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      // Carregar eventos do calendário
      const calendarEvents = await fetchCalendarEvents();
      
      // Carregar OPs para o calendário usando endpoint otimizado
      const expired = await fetchOrdensProducaoForCalendar({ expedicao: 'expired' });
      const upcoming = await fetchOrdensProducaoForCalendar({ expedicao: 'upcoming' });
      
      // Filtrar apenas OPs que não estão finalizadas
      const expiredFiltered = expired.filter(op => op.status !== 'Finalizado');
      const upcomingFiltered = upcoming.filter(op => op.status !== 'Finalizado');
      const orders = [...expiredFiltered, ...upcomingFiltered];
      
      console.log('Calendar Debug (Optimized):', {
        totalExpired: expired.length,
        totalUpcoming: upcoming.length,
        expiredFiltered: expiredFiltered.length,
        upcomingFiltered: upcomingFiltered.length,
        totalOrders: orders.length,
        sampleOrder: orders[0]
      });
      
      // Converter eventos do calendário para formato FullCalendar
      const calendarEvts = calendarEvents.map(event => ({
        id: `event_${event.id}`,
        title: event.title,
        start: event.start_date,
        end: event.end_date,
        allDay: event.all_day,
        extendedProps: { 
          calendar: event.calendar || 'primary',
          description: event.description,
          created_by_name: event.created_by_name,
          type: 'calendar_event'
        }
      }));
      
      // Converter OPs para formato FullCalendar
      const orderEvts = orders.map(op => {
        // Processar a data de expedição corretamente
        let startDate = '';
        if (op.data_expedicao) {
          // Se a data tem formato "2025-07-15 01:00:00.000 +0100"
          if (op.data_expedicao.includes(' ')) {
            startDate = op.data_expedicao.split(' ')[0]; // Pega apenas a parte da data
          } else if (op.data_expedicao.includes('T')) {
            startDate = op.data_expedicao.split('T')[0]; // Formato ISO
          } else {
            startDate = op.data_expedicao; // Formato simples YYYY-MM-DD
          }
        }
        
        // Determinar cor baseada na data de expedição
        let calendarColor = getStatusColor(op.status);
        if (startDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset para início do dia
          const expedicaoDate = new Date(startDate);
          
          // Calcular diferença em dias
          const diffTime = expedicaoDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (expedicaoDate < today) {
            // OP atrasada (vermelho)
            calendarColor = 'danger';
          } else if (diffDays <= 7 && diffDays >= 0) {
            // OP com 1 semana ou menos de entrega (laranja)
            calendarColor = 'warning';
          } else if (expedicaoDate > today) {
            // OP futura (verde)
            calendarColor = 'success';
          }
          // Se for hoje, mantém a cor original do status
        }
        
        return {
          id: `op_${op.id}`,
          title: op.nome_trabalho || `OP ${op.id}`,
          start: startDate,
          allDay: true,
          extendedProps: { 
            calendar: calendarColor,
            type: 'op',
            op_id: op.id,
            status: op.status,
            originalDate: op.data_expedicao
          }
        };
      });
      
      console.log('Final Events:', {
        calendarEvents: calendarEvts.length,
        orderEvents: orderEvts.length,
        totalEvents: calendarEvts.length + orderEvts.length
      });
      
      setEvents([...calendarEvts, ...orderEvts]);
    } catch (err) {
      console.error('Erro ao carregar dados do calendário:', err);
      setMessage("Erro ao carregar dados do calendário");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      'Aguardando Maquete': 'warning',
      'Maquete não enviada': 'danger',
      'Maquete em aprovação': 'warning',
      'Maquete Aprovada': 'success',
      'Maquete Reprovada': 'danger',
      'Em espera para impressão': 'primary',
      'Em impressão': 'primary',
      'Impresso': 'success',
      'Finalizado': 'success',
      'Cancelado': 'danger',
    };
    return statusColors[status] || 'primary';
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const eventType = event.extendedProps.type;
    
    if (eventType === 'op') {
      // Abrir detalhes da OP
      setDetalhesOpId(event.extendedProps.op_id);
      setDetalhesOpen(true);
    } else {
      // Editar evento do calendário
      setSelectedEvent({
        id: event.id,
        title: event.title || "",
        start: event.startStr,
        end: event.endStr,
        extendedProps: event.extendedProps
      });
      setEventTitle(event.title || "");
      setEventStartDate(event.startStr);
      setEventEndDate(event.endStr || event.startStr);
      setEventLevel(event.extendedProps.calendar || "");
      setEventDescription(event.extendedProps.description || "");
      openModal();
    }
  };

  const handleAddOrUpdateEvent = async () => {
    if (!eventTitle.trim()) {
      setMessage("O título do evento é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        title: eventTitle,
        start_date: eventStartDate,
        end_date: eventEndDate,
        all_day: true,
        calendar: eventLevel.toLowerCase(),
        description: eventDescription
      };

      if (selectedEvent && selectedEvent.id && selectedEvent.id.toString().startsWith('event_')) {
        // Atualizar evento existente
        const eventId = selectedEvent.id.toString().replace('event_', '');
        await updateCalendarEvent(parseInt(eventId), eventData);
        setMessage("Evento atualizado com sucesso!");
      } else {
        // Criar novo evento
        await createCalendarEvent(eventData);
        setMessage("Evento criado com sucesso!");
      }
      
      closeModal();
      resetModalFields();
      loadCalendarData(); // Recarregar dados
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Erro ao salvar evento");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !selectedEvent.id || !selectedEvent.id.toString().startsWith('event_')) {
      return;
    }

    if (!window.confirm("Tem certeza que deseja apagar este evento?")) {
      return;
    }

    setSaving(true);
    try {
      const eventId = selectedEvent.id.toString().replace('event_', '');
      await deleteCalendarEvent(parseInt(eventId));
      setMessage("Evento apagado com sucesso!");
      closeModal();
      resetModalFields();
      loadCalendarData(); // Recarregar dados
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || "Erro ao apagar evento");
    } finally {
      setSaving(false);
    }
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setEventDescription("");
    setSelectedEvent(null);
    setMessage("");
  };

  return (
    <>
      <PageMeta
        title="Calendário - Portal do Trabalhador"
        description="Calendário com eventos e ordens de produção"
      />
      
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Calendário
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize e gerencie eventos e ordens de produção
          </p>
        </div>

        {/* Legendas */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Legenda
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Eventos</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">OPs com o prazo perto da entrega</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">OPs com 1 semana de entrega</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">OPs Atrasadas</span>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.includes('sucesso') 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-lg p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Carregando dados do calendário...
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-lg">
            <div className="custom-calendar">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                selectable={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                height="auto"
                dayMaxEvents={true}
                moreLinkClick="popover"
                locale="pt-br"
                buttonText={{
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia"
                }}
                selectMirror={true}
                weekends={true}
                firstDay={1}
                slotMinTime="08:00:00"
                slotMaxTime="18:00:00"
              />
            </div>
          </div>
        )}

        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Editar Evento" : "Criar Evento"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedEvent ? "Edite os detalhes do evento" : "Crie um novo evento no calendário"}
              </p>
            </div>
            
            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Título do Evento *
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Digite o título do evento"
                />
              </div>

              <div>
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Cor do Evento
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div className={`form-check form-check-${value} form-check-inline`}>
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${
                                  eventLevel === key ? "block" : "hidden"
                                }`}
                              ></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Data de Início *
                  </label>
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Data de Fim *
                  </label>
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pl-4 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Descrição
                </label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                  className="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  placeholder="Descrição opcional do evento"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end">
              {selectedEvent && selectedEvent.id && selectedEvent.id.toString().startsWith('event_') && (
                <button
                  onClick={handleDeleteEvent}
                  disabled={saving}
                  type="button"
                  className="flex justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20 sm:w-auto"
                >
                  {saving ? 'Apagando...' : 'Apagar'}
                </button>
              )}
              <button
                onClick={closeModal}
                type="button"
                className="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                disabled={saving}
                type="button"
                className="btn btn-success btn-update-event flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 sm:w-auto"
              >
                {saving ? 'Guardando...' : (selectedEvent ? "Atualizar" : "Criar")}
              </button>
            </div>
          </div>
        </Modal>
      </div>

      <DetalhesOP
        opId={detalhesOpId!}
        isOpen={detalhesOpen}
        onClose={() => setDetalhesOpen(false)}
      />
    </>
  );
};

const renderEventContent = (eventInfo: any) => {
  const isOp = eventInfo.event.extendedProps.type === 'op';
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time text-xs opacity-75">
        {isOp ? 'OP' : eventInfo.timeText}
      </div>
      <div className="fc-event-title text-xs font-medium">
        <span className="inline-block bg-white/90 text-gray-800 px-1 rounded text-xs">
          {eventInfo.event.title}
        </span>
      </div>
    </div>
  );
};

export default Calendar;
