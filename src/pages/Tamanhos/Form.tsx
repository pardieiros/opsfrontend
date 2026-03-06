import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Alert from "../../components/ui/alert/Alert";
// @ts-ignore
import { getTipoSacos, getCores, createTamanho, getTamanho, updateTamanho } from "../../serviceapi/api";

interface TipoSaco {
  id: number;
  nome: string;
}

interface Cor {
  id: number;
  nome: string;
}

interface GramagemInput {
  cor: string;
  gramagem: string;
  peso: string;
}

export default function TamanhosForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [tipoSacos, setTipoSacos] = useState<TipoSaco[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tipo_saco: "",
    grupo: "vertical",
    largura: "",
    fole: "",
    altura: "",
    usa_badana: false,
  });
  const [gramagens, setGramagens] = useState<GramagemInput[]>([
    { cor: "", gramagem: "", peso: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    variant: "success"|"error";
    title: string;
    message: string;
  }|null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const token = localStorage.getItem("accessToken") || "";
        const [ts, cs] = await Promise.all([
          getTipoSacos(token),
          getCores(token),
        ]);
        setTipoSacos(ts);
        setCores(cs);
        
        // Se estiver editando, carregar dados do tamanho
        if (isEditing && id) {
          const tamanhoData = await getTamanho(id, token);
          setForm({
            tipo_saco: tamanhoData.tipo_saco.toString(),
            grupo: tamanhoData.grupo,
            largura: tamanhoData.largura?.toString() || "",
            fole: tamanhoData.fole?.toString() || "",
            altura: tamanhoData.altura?.toString() || "",
            usa_badana: tamanhoData.usa_badana,
          });
          
          // Carregar gramagens
          if (tamanhoData.gramagens && tamanhoData.gramagens.length > 0) {
            setGramagens(
              tamanhoData.gramagens.map((g: any) => ({
                cor: g.cor.toString(),
                gramagem: g.gramagem?.toString() || "",
                peso: g.peso?.toString() || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error(err);
        setAlertConfig({
          variant: "error",
          title: "Erro",
          message: "Falha ao carregar dados."
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isEditing, id]);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    // Cast to HTMLInputElement to safely access checked
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    let fieldValue: string | boolean = value;
    if (type === "checkbox") {
      fieldValue = target.checked;
    }
    setForm((prev) => ({
      ...prev,
      [name]: fieldValue,
    }));
  }

  function handleGramagemChange(
    index: number,
    field: keyof GramagemInput,
    value: string
  ) {
    const newList = [...gramagens];
    newList[index][field] = value;
    setGramagens(newList);
  }

  function addGramagem() {
    setGramagens((prev) => [...prev, { cor: "", gramagem: "", peso: "" }]);
  }

  function removeGramagem(index: number) {
    setGramagens((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertConfig(null);
    try {
      const token = localStorage.getItem("accessToken") || "";
      
      // Debug: log dos dados a serem enviados
      console.log("🔄 Dados a enviar:", { ...form, gramagens });
      console.log("🔄 Gramagens:", gramagens);
      
      if (isEditing && id) {
        await updateTamanho(id, { ...form, gramagens }, token);
        setAlertConfig({
          variant: "success",
          title: "Sucesso",
          message: "Tamanho atualizado com sucesso!"
        });
        // Redirecionar após 2 segundos
        setTimeout(() => {
          navigate("/tamanhos/consultar");
        }, 2000);
      } else {
        await createTamanho({ ...form, gramagens }, token);
        setAlertConfig({
          variant: "success",
          title: "Sucesso",
          message: "Tamanho criado com sucesso!"
        });
        // Reset form after creation
        setForm({
          tipo_saco: "",
          grupo: "vertical",
          largura: "",
          fole: "",
          altura: "",
          usa_badana: false,
        });
        setGramagens([{ cor: "", gramagem: "", peso: "" }]);
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({
        variant: "error",
        title: "Erro",
        message: isEditing ? "Falha ao atualizar tamanho." : "Falha ao criar tamanho."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-4">Carregando dados…</div>;
  }

  return (
    <>
      <PageMeta
        title={isEditing ? "Editar Tamanho" : "Criar Tamanho"}
        description={isEditing ? "Formulário para editar um tamanho de saco" : "Formulário para criar um novo tamanho de saco"}
      />
      <PageBreadcrumb pageTitle={isEditing ? "Editar Tamanho" : "Criar Tamanho"} />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="space-y-6 relative">
          {alertConfig && (
            <Alert
              variant={alertConfig.variant}
              title={alertConfig.title}
              message={alertConfig.message}
            />
          )}
      <form onSubmit={handleSubmit} className="space-y-6 p-4">
        <div>
          <label>Tipo de Saco:</label>
          <select
            name="tipo_saco"
            value={form.tipo_saco}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
            required
          >
            <option value="">Selecione</option>
            {tipoSacos.map((ts) => (
              <option key={ts.id} value={ts.id}>
                {ts.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Grupo:</label>
          <select
            name="grupo"
            value={form.grupo}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
            required
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
            <option value="take_away">Take Away</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>Largura (cm):</label>
            <input
              name="largura"
              type="number"
              step="0.01"
              value={form.largura}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label>Fole (cm):</label>
            <input
              name="fole"
              type="number"
              step="0.01"
              value={form.fole}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div>
            <label>Altura (cm):</label>
            <input
              name="altura"
              type="number"
              step="0.01"
              value={form.altura}
              onChange={handleChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>
        <div>
          <label>
            <input
              name="usa_badana"
              type="checkbox"
              checked={form.usa_badana}
              onChange={handleChange}
              className="mr-2"
            />
            Usa Badana
          </label>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Gramagem por Cor</h4>
          {gramagens.map((g, idx) => (
            <div key={idx} className="flex items-center space-x-2 mb-2">
              <select
                value={g.cor}
                onChange={(e) =>
                  handleGramagemChange(idx, "cor", e.target.value)
                }
                className="border rounded px-2 py-1 flex-1"
                required
              >
                <option value="">Cor...</option>
                {cores.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="g/m²"
                value={g.gramagem}
                onChange={(e) =>
                  handleGramagemChange(idx, "gramagem", e.target.value)
                }
                className="border rounded px-2 py-1 w-24"
                required
              />
              <input
                type="number"
                step="0.001"
                placeholder="g"
                value={g.peso}
                onChange={(e) =>
                  handleGramagemChange(idx, "peso", e.target.value)
                }
                className="border rounded px-2 py-1 w-24"
              />
              <button
                type="button"
                onClick={() => removeGramagem(idx)}
                className="text-red-500"
              >
                Remover
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addGramagem}
            className="text-blue-500"
          >
            + Add Cor
          </button>
        </div>
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 text-white px-4 py-2 rounded ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isSubmitting ? "A processar..." : (isEditing ? "Atualizar Tamanho" : "Criar Tamanho")}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => navigate("/tamanhos/consultar")}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
        </div>
      </div>
    </>
  );
}