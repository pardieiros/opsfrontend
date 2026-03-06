import React, { useState } from 'react';

const MaqueteCard = ({
  previewUrl,
  maquetaFileUrl,
  onFileSelect,
  maqueteFileName,
  onConfirm,
}) => {
  const [sacoLiso, setSacoLiso] = useState(false);
  const [colors, setColors] = useState(['']);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 mt-4">
      <span className="block font-medium mb-2">Maquete</span>
      {previewUrl && (
        <iframe
          src={previewUrl}
          title="Preview Maquete"
          className="w-full h-48 border-none mb-4"
        />
      )}
      {maquetaFileUrl ? (
        <a
          href={maquetaFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Visualizar Maquete
        </a>
      ) : (
        <>
          <p className="text-gray-500 mb-2">Ainda nenhuma maquete adicionada</p>
          <button
            type="button"
            onClick={onFileSelect}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
          >
            Carregar Maquete
          </button>
          {maqueteFileName && (
            <span className="ml-2 text-sm text-gray-600">{maqueteFileName}</span>
          )}
          {maqueteFileName && (
            <>
              <div className="flex items-center space-x-2 mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={sacoLiso}
                    onChange={e => setSacoLiso(e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="ml-2">Saco Liso</span>
                </label>
              </div>
              {colors.map((color, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder="Cor de impressão"
                  value={color}
                  onChange={e => {
                    const newColors = [...colors];
                    newColors[index] = e.target.value;
                    setColors(newColors);
                  }}
                  className="w-full border rounded p-2 mb-2"
                />
              ))}
              <button
                type="button"
                onClick={() => setColors([...colors, ''])}
                className="mb-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Adicionar cor
              </button>
              <button
                type="button"
                onClick={() => onConfirm(colors, sacoLiso)}
                disabled={!(sacoLiso || colors.some(c => c.trim() !== ''))}
                className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                Confirmar Maquete
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MaqueteCard;
//src/components/Maquete/anexarmaquete.jsx