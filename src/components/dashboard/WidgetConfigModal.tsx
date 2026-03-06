import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/modal';

interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
}

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (widgets: WidgetConfig[]) => void;
  currentWidgets: WidgetConfig[];
}

const WidgetConfigModal: React.FC<WidgetConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentWidgets
}) => {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(currentWidgets);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setWidgets(currentWidgets);
  }, [currentWidgets]);

  const handleToggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    ));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newWidgets = [...widgets];
    const draggedWidget = newWidgets[draggedIndex];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(dropIndex, 0, draggedWidget);

    // Atualizar a ordem
    newWidgets.forEach((widget, index) => {
      widget.order = index + 1;
    });

    setWidgets(newWidgets);
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onSave(widgets);
    onClose();
  };

  const handleReset = () => {
    setWidgets(currentWidgets);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl p-6 lg:p-8"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Configurar Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Escolha e organize os widgets que aparecem no seu dashboard
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Debug: {widgets.length} widgets carregados
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
          <div className="space-y-4 pr-2">
            {widgets.map((widget, index) => (
              <div
                key={widget.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`p-4 border rounded-lg cursor-move transition-all ${
                  draggedIndex === index
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {widget.order}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">
                        {widget.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {widget.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={widget.enabled}
                        onChange={() => handleToggleWidget(widget.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicador de total */}
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 mt-4">
              Total: {widgets.length} widgets disponíveis
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Restaurar Padrão
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('dashboard-widget-config');
                window.location.reload();
              }}
              className="px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 dark:bg-gray-800 dark:text-red-300 dark:border-red-600 dark:hover:bg-red-900/20"
            >
              Limpar Cache
            </button>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Guardar Configuração
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WidgetConfigModal; 