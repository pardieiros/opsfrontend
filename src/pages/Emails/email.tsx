import React, { useState, useEffect } from "react";
import { getEmailLayouts, createEmailLayout, updateEmailLayout } from "../../serviceapi/api";

interface EmailProps {
  workName: string;
  dynamicLink: string;
}

const languages = [
  { code: "pt", label: "  Português", flag: "🇵🇹" },
  { code: "es", label: "  Español",   flag: "🇪🇸" },
  { code: "en", label: "  English",    flag: "🇬🇧" },
  { code: "fr", label: "  Français",   flag: "🇫🇷" },
];

const subjectTemplates: Record<string, string> = {
  fr: "Approbation de la Maquette – {work_name}",
  en: "Approval of the Mockup – {work_name}",
  pt: "Aprovação da Maquete – {work_name}",
  es: "Aprobación de la Maqueta – {work_name}",
};

const bodyTemplates: Record<string, string> = {
  fr:
    "Bonjour,\n\nVeuillez approuver la maquette du travail '{work_name}' en cliquant sur le lien ci-dessous :\n{link}\n\nCe lien expire dans 7 jours.\n\nMerci !",
  en:
    "Hello,\n\nPlease approve the mockup for work '{work_name}' by clicking the link below:\n{link}\n\nThis link expires in 7 days.\n\nThank you!",
  pt:
    "Olá,\n\nPor favor, aprove a maquete do trabalho '{work_name}' clicando no link abaixo:\n{link}\n\nEste link expira em 7 dias.\n\nObrigado!",
  es:
    "Hola,\n\nPor favor, apruebe la maqueta do trabajo '{work_name}' haciendo clic en el siguiente enlace:\n{link}\n\nEste enlace expira en 7 días.\n\n¡Gracias!",
};

const clicheSubjectTemplates: Record<string, string> = {
  fr: "Demande de Cliché – {work_name}",
  en: "Cliché Request – {work_name}",
  pt: "Pedido de Clichê – {work_name}",
  es: "Solicitud de Cliché – {work_name}",
};

const clicheBodyTemplates: Record<string, string> = {
  fr:
    "Bonjour,\n\nNous vous envoyons le fichier de cliché pour le travail '{work_name}'.\n\nVeuillez traiter cette demande dans les plus brefs délais.\n\nMerci !",
  en:
    "Hello,\n\nWe are sending you the cliché file for work '{work_name}'.\n\nPlease process this request as soon as possible.\n\nThank you!",
  pt:
    "Olá,\n\nEnviamos o ficheiro de clichê para o trabalho '{work_name}'.\n\nPor favor, processe este pedido o mais rapidamente possível.\n\nObrigado!",
  es:
    "Hola,\n\nLe enviamos el archivo de cliché para el trabajo '{work_name}'.\n\nPor favor, procese esta solicitud lo antes posible.\n\n¡Gracias!",
};

const serigrafiaSubjectTemplates: Record<string, string> = {
  fr: "Envoi d'Art pour Sérigraphie – {work_name}",
  en: "Art Submission for Screen Printing – {work_name}",
  pt: "Envio de Arte para Serigrafia – {work_name}",
  es: "Envío de Arte para Serigrafía – {work_name}",
};

const serigrafiaBodyTemplates: Record<string, string> = {
  fr:
    "Bonjour,\n\nNous vous envoyons le fichier d'art pour sérigraphie du travail '{work_name}'.\n\nVeuillez traiter cette demande dans les plus brefs délais.\n\nMerci !",
  en:
    "Hello,\n\nWe are sending you the art file for screen printing work '{work_name}'.\n\nPlease process this request as soon as possible.\n\nThank you!",
  pt:
    "Olá,\n\nEnviamos o ficheiro de arte para serigrafia do trabalho '{work_name}'.\n\nPor favor, processe este pedido o mais rapidamente possível.\n\nObrigado!",
  es:
    "Hola,\n\nLe enviamos el archivo de arte para serigrafía del trabajo '{work_name}'.\n\nPor favor, procese esta solicitud lo antes posible.\n\n¡Gracias!",
};

const Email: React.FC<EmailProps> = ({ workName, dynamicLink }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [expandedCliche, setExpandedCliche] = useState<Record<string, boolean>>({});
  const [expandedSerigrafia, setExpandedSerigrafia] = useState<Record<string, boolean>>({});
  const [subjects, setSubjects] = useState<Record<string, string>>(
    languages.reduce(
      (acc, { code }) => ({ ...acc, [code]: subjectTemplates[code] }),
      {} as Record<string, string>
    )
  );
  const [bodies, setBodies] = useState<Record<string, string>>(
    languages.reduce(
      (acc, { code }) => ({ ...acc, [code]: bodyTemplates[code] }),
      {} as Record<string, string>
    )
  );
  const [clicheSubjects, setClicheSubjects] = useState<Record<string, string>>(
    languages.reduce(
      (acc, { code }) => ({ ...acc, [code]: clicheSubjectTemplates[code] }),
      {} as Record<string, string>
    )
  );
  const [clicheBodies, setClicheBodies] = useState<Record<string, string>>(
    languages.reduce(
      (acc, { code }) => ({ ...acc, [code]: clicheBodyTemplates[code] }),
      {} as Record<string, string>
    )
  );
  const [serigrafiaSubjects, setSerigrafiaSubjects] = useState<Record<string, string>>(
    languages.reduce(
      (acc, { code }) => ({ ...acc, [code]: serigrafiaSubjectTemplates[code] }),
      {} as Record<string, string>
    )
  );
  const [serigrafiaBodies, setSerigrafiaBodies] = useState<Record<string, string>>(
    languages.reduce(
      (acc, { code }) => ({ ...acc, [code]: serigrafiaBodyTemplates[code] }),
      {} as Record<string, string>
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [layoutIds, setLayoutIds] = useState<Record<string, number | null>>(
    languages.reduce((acc, { code }) => ({ ...acc, [code]: null }), {} as Record<string, number | null>)
  );
  const [clicheLayoutIds, setClicheLayoutIds] = useState<Record<string, number | null>>(
    languages.reduce((acc, { code }) => ({ ...acc, [code]: null }), {} as Record<string, number | null>)
  );
  const [serigrafiaLayoutIds, setSerigrafiaLayoutIds] = useState<Record<string, number | null>>(
    languages.reduce((acc, { code }) => ({ ...acc, [code]: null }), {} as Record<string, number | null>)
  );

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || "";
    getEmailLayouts(token)
      .then((data) => {
        const ids: Record<string, number | null> = {};
        const clicheIds: Record<string, number | null> = {};
        const serigrafiaIds: Record<string, number | null> = {};
        const newSubjects = { ...subjects };
        const newBodies = { ...bodies };
        const newClicheSubjects = { ...clicheSubjects };
        const newClicheBodies = { ...clicheBodies };
        const newSerigrafiaSubjects = { ...serigrafiaSubjects };
        const newSerigrafiaBodies = { ...serigrafiaBodies };
        data.forEach((layout) => {
          if (layout.tipo === "aprova_maquete") {
            ids[layout.lingua] = layout.id;
            if (newSubjects[layout.lingua] !== undefined) {
              newSubjects[layout.lingua] = layout.assunto;
              newBodies[layout.lingua] = layout.corpo;
            }
          } else if (layout.tipo === "pedido_cliche" && layout.lingua === "pt") {
            clicheIds[layout.lingua] = layout.id;
            if (newClicheSubjects[layout.lingua] !== undefined) {
              newClicheSubjects[layout.lingua] = layout.assunto;
              newClicheBodies[layout.lingua] = layout.corpo;
            }
          } else if (layout.tipo === "envio_arte_serigrafia" && layout.lingua === "pt") {
            serigrafiaIds[layout.lingua] = layout.id;
            if (newSerigrafiaSubjects[layout.lingua] !== undefined) {
              newSerigrafiaSubjects[layout.lingua] = layout.assunto;
              newSerigrafiaBodies[layout.lingua] = layout.corpo;
            }
          }
        });
        setSubjects(newSubjects);
        setBodies(newBodies);
        setClicheSubjects(newClicheSubjects);
        setClicheBodies(newClicheBodies);
        setSerigrafiaSubjects(newSerigrafiaSubjects);
        setSerigrafiaBodies(newSerigrafiaBodies);
        setLayoutIds(ids);
        setClicheLayoutIds(clicheIds);
        setSerigrafiaLayoutIds(serigrafiaIds);
      })
      .catch((e) => setError("Erro ao carregar layouts: " + e.message));
  }, []);

  const handleToggle = (code: string) =>
    setExpanded((prev) => ({ ...prev, [code]: !prev[code] }));

  const handleToggleCliche = (code: string) =>
    setExpandedCliche((prev) => ({ ...prev, [code]: !prev[code] }));

  const handleToggleSerigrafia = (code: string) =>
    setExpandedSerigrafia((prev) => ({ ...prev, [code]: !prev[code] }));

  const handleSubjectChange = (code: string, value: string) => {
    // só atualiza se o placeholder continuar presente
    if (value.includes("{work_name}")) {
      setSubjects((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleBodyChange = (code: string, value: string) => {
    // só atualiza se ambos os placeholders estiverem presentes
    if (value.includes("{work_name}") && value.includes("{link}")) {
      setBodies((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleClicheSubjectChange = (code: string, value: string) => {
    // só atualiza se o placeholder continuar presente
    if (value.includes("{work_name}")) {
      setClicheSubjects((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleClicheBodyChange = (code: string, value: string) => {
    // só atualiza se o placeholder continuar presente
    if (value.includes("{work_name}")) {
      setClicheBodies((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleSerigrafiaSubjectChange = (code: string, value: string) => {
    // só atualiza se o placeholder continuar presente
    if (value.includes("{work_name}")) {
      setSerigrafiaSubjects((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleSerigrafiaBodyChange = (code: string, value: string) => {
    // só atualiza se o placeholder continuar presente
    if (value.includes("{work_name}")) {
      setSerigrafiaBodies((prev) => ({ ...prev, [code]: value }));
    }
  };

  const handleSaveMaquete = async () => {
    for (const { code, label } of languages) {
      if (!subjects[code].includes("{work_name}") || !bodies[code].includes("{link}")) {
        setError(`A mensagem de aprovação em ${label} precisa conter {work_name} e {link}.`);
        return;
      }
    }
    const token = localStorage.getItem("accessToken") || "";
    try {
      for (const { code } of languages) {
        const payload = {
          tipo: "aprova_maquete",
          lingua: code,
          assunto: subjects[code],
          corpo: bodies[code],
        };
        if (layoutIds[code]) {
          await updateEmailLayout(layoutIds[code]!, payload, token);
        } else {
          const created = await createEmailLayout(payload, token);
          layoutIds[code] = created.id;
        }
      }
      setLayoutIds({ ...layoutIds });
      setError(null);
      alert("Layouts de aprovação de maquete guardados com sucesso!");
    } catch (e) {
      setError("Erro ao guardar layouts de aprovação: " + (e as Error).message);
    }
  };

  const handleSaveCliche = async () => {
    const ptLanguage = languages.find(lang => lang.code === 'pt');
    if (ptLanguage && !clicheSubjects[ptLanguage.code].includes("{work_name}")) {
      setError(`A mensagem de clichê precisa conter {work_name}.`);
      return;
    }
    const token = localStorage.getItem("accessToken") || "";
    try {
      if (ptLanguage) {
        const payload = {
          tipo: "pedido_cliche",
          lingua: ptLanguage.code,
          assunto: clicheSubjects[ptLanguage.code],
          corpo: clicheBodies[ptLanguage.code],
        };
        if (clicheLayoutIds[ptLanguage.code]) {
          await updateEmailLayout(clicheLayoutIds[ptLanguage.code]!, payload, token);
        } else {
          const created = await createEmailLayout(payload, token);
          clicheLayoutIds[ptLanguage.code] = created.id;
        }
      }
      setClicheLayoutIds({ ...clicheLayoutIds });
      setError(null);
      alert("Layout de pedido de clichê guardado com sucesso!");
    } catch (e) {
      setError("Erro ao guardar layout de clichê: " + (e as Error).message);
    }
  };

  const handleSaveSerigrafia = async () => {
    const ptLanguage = languages.find(lang => lang.code === 'pt');
    if (ptLanguage && !serigrafiaSubjects[ptLanguage.code].includes("{work_name}")) {
      setError(`A mensagem de serigrafia precisa conter {work_name}.`);
      return;
    }
    const token = localStorage.getItem("accessToken") || "";
    try {
      if (ptLanguage) {
        const payload = {
          tipo: "envio_arte_serigrafia",
          lingua: ptLanguage.code,
          assunto: serigrafiaSubjects[ptLanguage.code],
          corpo: serigrafiaBodies[ptLanguage.code],
        };
        if (serigrafiaLayoutIds[ptLanguage.code]) {
          await updateEmailLayout(serigrafiaLayoutIds[ptLanguage.code]!, payload, token);
        } else {
          const created = await createEmailLayout(payload, token);
          serigrafiaLayoutIds[ptLanguage.code] = created.id;
        }
      }
      setSerigrafiaLayoutIds({ ...serigrafiaLayoutIds });
      setError(null);
      alert("Layout de envio de arte para serigrafia guardado com sucesso!");
    } catch (e) {
      setError("Erro ao guardar layout de serigrafia: " + (e as Error).message);
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded">
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-4">Emails</h1>
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-medium">Aprovação de Maquetes</h2>
          </div>
          <div className="p-4">
            {languages.map(({ code, label, flag }) => (
              <div key={code} className="bg-white shadow rounded mb-6">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t"
                  onClick={() => handleToggle(code)}
                >
                  <span className="font-medium">{flag} {label}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 transform transition-transform ${
                      expanded[code] ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expanded[code] && (
                  <div className="px-4 py-4 border-t space-y-4 bg-white">
                    {/* Subject */}
                    <div>
                      <label className="block mb-1 font-medium">Assunto</label>
                      <textarea
                        rows={1}
                        className="w-full border rounded p-2"
                        value={subjects[code]}
                        onChange={(e) =>
                          handleSubjectChange(code, e.target.value)
                        }
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block mb-1 font-medium">Mensagem</label>
                      <textarea
                        rows={8}
                        className="w-full border rounded p-2 whitespace-pre-wrap"
                        value={bodies[code]}
                        onChange={(e) =>
                          handleBodyChange(code, e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveMaquete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded shadow"
              >
                Guardar Aprovação de Maquetes
              </button>
            </div>
            {error && <p className="mt-2 text-red-500">{error}</p>}
          </div>
        </div>
      </div>

      {/* Seção de Pedido de Clichê */}
      <div className="bg-white shadow rounded mt-6">
        <div className="p-6">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-medium">Pedido de Clichê</h2>
          </div>
          <div className="p-4">
            {languages.filter(({ code }) => code === 'pt').map(({ code, label, flag }) => (
              <div key={code} className="bg-white shadow rounded mb-6">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t"
                  onClick={() => handleToggleCliche(code)}
                >
                  <span className="font-medium">{flag} {label}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 transform transition-transform ${
                      expandedCliche[code] ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedCliche[code] && (
                  <div className="px-4 py-4 border-t space-y-4 bg-white">
                    {/* Subject */}
                    <div>
                      <label className="block mb-1 font-medium">Assunto</label>
                      <textarea
                        rows={1}
                        className="w-full border rounded p-2"
                        value={clicheSubjects[code]}
                        onChange={(e) =>
                          handleClicheSubjectChange(code, e.target.value)
                        }
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block mb-1 font-medium">Mensagem</label>
                      <textarea
                        rows={8}
                        className="w-full border rounded p-2 whitespace-pre-wrap"
                        value={clicheBodies[code]}
                        onChange={(e) =>
                          handleClicheBodyChange(code, e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveCliche}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow"
              >
                Guardar Pedido de Clichê
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Envio de Arte para Serigrafia */}
      <div className="bg-white shadow rounded mt-6">
        <div className="p-6">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-medium">Envio de Arte para Serigrafia</h2>
          </div>
          <div className="p-4">
            {languages.filter(({ code }) => code === 'pt').map(({ code, label, flag }) => (
              <div key={code} className="bg-white shadow rounded mb-6">
                <button
                  type="button"
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-t"
                  onClick={() => handleToggleSerigrafia(code)}
                >
                  <span className="font-medium">{flag} {label}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`w-5 h-5 transform transition-transform ${
                      expandedSerigrafia[code] ? "rotate-180" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedSerigrafia[code] && (
                  <div className="px-4 py-4 border-t space-y-4 bg-white">
                    {/* Subject */}
                    <div>
                      <label className="block mb-1 font-medium">Assunto</label>
                      <textarea
                        rows={1}
                        className="w-full border rounded p-2"
                        value={serigrafiaSubjects[code]}
                        onChange={(e) =>
                          handleSerigrafiaSubjectChange(code, e.target.value)
                        }
                      />
                    </div>

                    {/* Body */}
                    <div>
                      <label className="block mb-1 font-medium">Mensagem</label>
                      <textarea
                        rows={8}
                        className="w-full border rounded p-2 whitespace-pre-wrap"
                        value={serigrafiaBodies[code]}
                        onChange={(e) =>
                          handleSerigrafiaBodyChange(code, e.target.value)
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSaveSerigrafia}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow"
              >
                Guardar Envio de Arte para Serigrafia
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Email;