import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const storedUser = localStorage.getItem("user");
  let user: any = null;
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error("UserMetaCard: invalid user JSON", e);
  }
  // Helper to get initials (first letter of first and last names)
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0).toUpperCase() || '';
    const last = parts[parts.length - 1]?.charAt(0).toUpperCase() || '';
    return first + last;
  };
  const initials = user?.nome_completo ? getInitials(user.nome_completo) : '';

  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 flex items-center justify-center bg-gray-200 text-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800">
              {user?.foto ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}${user.foto}`}
                  alt="user"
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-xl font-semibold">
                  {initials}
                </span>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {user?.nome_completo || "Musharof Chowdhury"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.seccao || "Team Manager"}
                </p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.numero_empregado || ""}
                </p>
              </div>
            </div>
          </div>
        </div>
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
                  <Label>Escolher Foto</Label>
                  <Input type="file" accept="image/*" />
                </div>
              </div>
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input type="text" value={user?.nome_completo || ""} />
                  </div>
                  <div>
                    <Label>Estado Civil</Label>
                    <Input type="text" value={user?.estado_civil || ""} />
                  </div>
                  <div>
                    <Label>Contacto</Label>
                    <Input type="text" value={user?.contacto || ""} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="text" value={user?.email || ""} />
                  </div>
                  <div>
                    <Label>Data de Nascimento</Label>
                    <Input type="date" value={user?.data_nascimento || ""} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
