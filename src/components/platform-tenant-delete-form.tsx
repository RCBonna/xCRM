"use client";

import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { deleteTenantAction } from "@/app/platform/actions";

type PlatformTenantDeleteFormProps = {
  tenantId: string;
  tenantName: string;
};

const processingSteps = [
  "Eliminando Ações...",
  "Eliminando Histórico...",
  "Eliminando Oportunidades...",
  "Eliminando Contatos...",
  "Eliminando Empresas/Prospects...",
  "Eliminando Importações...",
  "Eliminando Equipes...",
  "Eliminando Usuários...",
  "Finalizando Exclusão da Organização...",
];

export function PlatformTenantDeleteForm({
  tenantId,
  tenantName,
}: PlatformTenantDeleteFormProps) {
  const formId = `delete-tenant-${tenantId}`;
  const expectedConfirmation = `EXCLUIR ${tenantName}`;
  const [confirmation, setConfirmation] = useState("");
  const [firstModalOpen, setFirstModalOpen] = useState(false);
  const [secondModalOpen, setSecondModalOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (!isProcessing) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveStepIndex((current) =>
        Math.min(current + 1, processingSteps.length - 1),
      );
    }, 900);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isProcessing]);

  function openFirstModal() {
    if (confirmation.trim() !== expectedConfirmation) {
      setValidationMessage(
        `Digite exatamente "${expectedConfirmation}" antes de continuar.`,
      );
      return;
    }

    setValidationMessage("");
    setFirstModalOpen(true);
  }

  function openSecondModal() {
    setFirstModalOpen(false);
    setSecondModalOpen(true);
  }

  function handleSubmit() {
    setSecondModalOpen(false);
    setIsProcessing(true);
    setActiveStepIndex(0);
  }

  return (
    <>
      <form
        id={formId}
        action={deleteTenantAction}
        onSubmit={handleSubmit}
        className="grid gap-3 rounded-md border border-danger/30 bg-background p-3"
      >
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="grid gap-1 text-xs font-medium text-muted">
          Confirmação da Exclusão
          <input
            name="confirmation"
            required
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
              setValidationMessage("");
            }}
            placeholder={expectedConfirmation}
            disabled={isProcessing}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm text-foreground"
          />
        </label>
        {validationMessage ? (
          <p className="text-xs leading-5 text-danger">{validationMessage}</p>
        ) : null}
        <button
          type="button"
          disabled={isProcessing}
          onClick={openFirstModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-danger px-3 text-sm font-medium text-danger transition-colors hover:bg-danger hover:text-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 size={15} aria-hidden />
          Excluir Organização
        </button>
      </form>

      {isProcessing ? (
        <div className="rounded-md border border-danger/40 bg-surface p-3 text-sm">
          <div className="flex items-center gap-2 font-medium text-danger">
            <LoaderCircle size={16} className="animate-spin" aria-hidden />
            Processando Exclusão
          </div>
          <div className="mt-3 grid gap-2">
            {processingSteps.map((step, index) => (
              <p
                key={step}
                className={[
                  "text-xs leading-5",
                  index <= activeStepIndex ? "text-foreground" : "text-muted",
                ].join(" ")}
              >
                {index === activeStepIndex ? "> " : ""}
                {step}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      {firstModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-md border border-border bg-surface p-5 shadow-xl shadow-black/30">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle size={18} className="text-danger" aria-hidden />
              Confirmar Organização
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Você marcou {tenantName} para exclusão. Confira se esta é a
              organização correta antes de continuar.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setFirstModalOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={openSecondModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-danger px-4 text-sm font-medium text-danger"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {secondModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-md border border-danger bg-surface p-5 shadow-xl shadow-black/30">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-danger">
              <AlertTriangle size={18} aria-hidden />
              Exclusão Permanente
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Esta é uma exclusão completa e permanente. O app removerá
              usuários, clientes/prospects, contatos, ações, histórico,
              importações, equipes e demais dados vinculados a {tenantName}.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSecondModalOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form={formId}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-danger px-4 text-sm font-medium text-background"
              >
                <Trash2 size={15} aria-hidden />
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
