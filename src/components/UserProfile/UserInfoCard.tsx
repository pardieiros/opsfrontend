import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { getProfile, updateProfile } from "../../serviceapi/api";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [user, setUser] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Local state for editable fields
  const [nomeCompleto, setNomeCompleto] = useState<string>("");
  const [estadoCivil, setEstadoCivil] = useState<string>("");
  const [contacto, setContacto] = useState<string>("");
  const [emailField, setEmailField] = useState<string>("");
  const [dataNascimento, setDataNascimento] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Fetch latest profile on mount
  useEffect(() => {
    // Carregar dados do localStorage primeiro
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setNomeCompleto(parsedUser.nome_completo || "");
        setEstadoCivil(parsedUser.estado_civil || "");
        setContacto(parsedUser.contacto || "");
        setEmailField(parsedUser.email || "");
        setDataNascimento(parsedUser.data_nascimento || "");
      } catch (err) {
        console.error("Erro ao parsear usuário do localStorage:", err);
      }
    }

    // Buscar dados atualizados da API
    getProfile()
      .then(data => {
        setUser(data);
        setNomeCompleto(data.nome_completo || "");
        setEstadoCivil(data.estado_civil || "");
        setContacto(data.contacto || "");
        setEmailField(data.email || "");
        setDataNascimento(data.data_nascimento || "");
        
        // Atualizar localStorage com dados mais recentes
        localStorage.setItem("user", JSON.stringify(data));
      })
      .catch(err => console.error("Erro ao obter perfil:", err));
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.warn("📸 handlePhotoChange - arquivo selecionado:", file);
    if (file) {
      console.warn("📸 Arquivo válido - nome:", file.name, "tamanho:", file.size, "tipo:", file.type);
      setPhotoFile(file);
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
        console.warn("📸 Preview criado com sucesso");
      };
      reader.readAsDataURL(file);
    } else {
      console.warn("📸 Nenhum arquivo selecionado");
    }
  };

  const handleSave = async () => {
    alert("🎯 handleSave foi chamada!");
    try {
      alert("🔄 Iniciando salvamento do perfil...");
      alert("📝 Dados a enviar: " + JSON.stringify({ nomeCompleto, estadoCivil, contacto, emailField, dataNascimento }));
      alert("📸 Foto selecionada: " + (photoFile ? photoFile.name : "Nenhuma"));
      
      let payload: any;
      if (photoFile) {
        const form = new FormData();
        form.append("nome_completo", nomeCompleto);
        form.append("estado_civil", estadoCivil);
        form.append("contacto", contacto);
        form.append("email", emailField);
        if (dataNascimento) form.append("data_nascimento", dataNascimento);
        form.append("foto", photoFile);
        payload = form;
        alert("📤 Enviando FormData com foto");
      } else {
        payload = {
          nome_completo: nomeCompleto,
          estado_civil: estadoCivil,
          contacto: contacto,
          email: emailField,
          data_nascimento: dataNascimento || undefined,
        };
        alert("📤 Enviando JSON sem foto");
      }
      
      alert("🚀 Chamando updateProfile...");
      let updatedData;
      try {
        updatedData = await updateProfile(payload);
        alert("✅ Resposta recebida: " + JSON.stringify(updatedData));
      } catch (error: any) {
        alert("❌ Erro no updateProfile: " + error.message);
        throw error;
      }
      
      // Atualizar estado local e localStorage
      setUser(updatedData);
      localStorage.setItem("user", JSON.stringify(updatedData));
      
      // Limpar preview e arquivo
      setPhotoFile(null);
      setPhotoPreview(null);
      
      closeModal();
    } catch (err: any) {
      console.error("❌ Erro ao salvar perfil:", err);
      console.error("❌ Detalhes do erro:", err.message);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {/* Foto do usuário */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              {user?.foto ? (
                <img 
                  src={user.foto} 
                  alt="Foto do usuário" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              Informação Pessoal
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nome Completo
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.nome_completo || ""}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Estado Civil
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.estado_civil || ""}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Contacto
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.contacto || ""}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.email || ""}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Data de Nascimento
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.data_nascimento || ""}
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            openModal();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Avatar
                </h5>
                <div className="grid grid-cols-1 gap-4">
                  {/* Preview da foto atual */}
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Preview da foto" 
                          className="w-full h-full object-cover"
                        />
                      ) : user?.foto ? (
                        <img 
                          src={user.foto} 
                          alt="Foto atual" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Escolher Foto</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input
                      type="text"
                      value={nomeCompleto}
                      onChange={e => setNomeCompleto(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Estado Civil</Label>
                    <Input
                      type="text"
                      value={estadoCivil}
                      onChange={e => setEstadoCivil(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Contacto</Label>
                    <Input
                      type="text"
                      value={contacto}
                      onChange={e => setContacto(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="text"
                      value={emailField}
                      onChange={e => setEmailField(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={dataNascimento}
                      onChange={e => setDataNascimento(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={() => {
                handleSave();
              }}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
