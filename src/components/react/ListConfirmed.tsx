import type { BrotherConfirmated } from "@/types/brothers";
import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import { EditIcon, PrintIcon, SaveIcon, TrashIcon } from "@/icons/iconsReact";
import { warningMessage } from "@/scripts/warning-message";
import { showNotification } from "@/scripts/notification";

const headTable = [
  "Nombres",
  "Estado Civil",
  "Observaciones",
  "Hospedaje",
  "Acciones",
]

interface GroupedData {
  parroquia: string;
  comunidades: {
    numero: number;
    confirmados: BrotherConfirmated[];
  }[];
}

export const ListConfirmed = ({ retreatId }: { retreatId: number }) => {
  const [listConfirmed, setListConfirmed] = useState<GroupedData[]>([]);
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListConfirmed = async () => {
      try {
        const { data, error } = await actions.getRetreatConfirmedAttendees({ retreat_id: retreatId });
        if (!data?.success || error) {
          setError("Error fetching confirmed attendees");
          return;
        }
        setListConfirmed(data?.data);
        setLoading(false);
      } catch (error) {
        setError("Error fetching confirmed attendees");
        setLoading(false);
      }
    };

    fetchListConfirmed();

    const handleAttendanceUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ retreat_id?: number }>;
      const eventRetreatId = customEvent.detail?.retreat_id;
      if (eventRetreatId && eventRetreatId !== retreatId) return;
      fetchListConfirmed();
    };

    window.addEventListener("retreat:attendance-updated", handleAttendanceUpdated);

    return () => {
      window.removeEventListener(
        "retreat:attendance-updated",
        handleAttendanceUpdated,
      );
    };
  }, [retreatId]);

  const handleEdit = (brother: BrotherConfirmated) => {
    (window as any).openModalObservation?.(
      retreatId,
      brother.person_ids,
      {
        observation: brother.observaciones_combinadas ?? "",
        retreat_house_id: brother.retreat_house_id ?? null,
        isEdit: true,
      },
    );
  }

  const handleDelete = async (brother: BrotherConfirmated) => {
    const isMarriage = Boolean(brother.marriage_id);

    const confirmed = await warningMessage(
      "Eliminar confirmación",
      isMarriage
        ? "¿Estás seguro de eliminar la confirmación de este matrimonio? Se eliminarán ambas personas."
        : "¿Estás seguro de eliminar la confirmación de este hermano?",
    );

    if (!confirmed) return;

    try {
      const { data, error } = await actions.deleteRetreatAttendanceGroup({
        retreat_id: retreatId,
        person_ids: brother.person_ids,
      });

      if (!data?.success || error) {
        showNotification(
          data?.message || error?.message || "Error al eliminar confirmación",
          "error",
        );
        return;
      }

      showNotification(data.message, "success");
      window.dispatchEvent(
        new CustomEvent("retreat:attendance-updated", {
          detail: { retreat_id: retreatId },
        }),
      );
    } catch (err) {
      console.error("Error eliminando confirmación:", err);
      showNotification("Error al eliminar confirmación", "error");
    }
  };


  return (
    <div className="ss">
      {loading && <p className="message-card loading">Cargando confirmados...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && listConfirmed.length === 0 && (<p className="message-card">No hay Hermanos confirmados para esta convivencia.</p>)}
      {!loading && !error && listConfirmed.length > 0 && (
        <div className="flex flex-col gap-9">
          {listConfirmed.map((parish) => (
            <div key={parish.parroquia} className="">
              <header>
                <h3 className="font-semibold text-3xl p-1 border-b-2 border-neutral-500">{parish.parroquia}</h3>
              </header>
              <div className="main space-y-8">
                {parish.comunidades.map((comm) => (
                  <div key={comm.numero}>
                    <div className="" key={comm.numero}>
                      <h4 className="font-semibold text-lg mt-4 mb-1 text-neutral-500">Comunidad N° {comm.numero}</h4>
                    </div>
                    <div className="container-table">
                      <table>
                        <thead>
                          <tr>
                            {headTable.map((item) => (
                              <th key={item}>{item}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {comm.confirmados.map((bro) => (
                            <tr key={bro.group_key}>
                              <td>{bro.nombres_confirmados}</td>
                              <td>{bro.marriage_id ? "Matrimonio" : "Soltero"}</td>
                              <td>{bro.observaciones_combinadas}</td>
                              <td>{bro.retreat_house_name}</td>
                              <td className="min">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    className="atn-btn"
                                    title="Editar observación y hospedaje"
                                    onClick={() => handleEdit(bro)}
                                  >
                                    <EditIcon className="size-5 block" />
                                  </button>
                                  <button
                                    className="atn-btn"
                                    title="Eliminar confirmación"
                                    type="button"
                                    onClick={() => handleDelete(bro)}
                                  >
                                    <TrashIcon className="size-5 block" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="content-btns flex items-center gap-4">
            <a href={`/print-confirmated/${retreatId}`} className="btn btn-secondary w-full flex items-center justify-center gap-2" target="_blank">
              <PrintIcon className="size-5 block" />
              <span>Imprimir</span>
            </a>
            <button className="flex items-center justify-center gap-2 btn btn-primary w-full">
              <SaveIcon className="size-5 block" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}