"use client";

import { CircleAlert, CircleCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    title: "CRM multiempresa desde o primeiro acesso",
    body: "Organize empresas, contatos, oportunidades e atividades com dados isolados por tenant.",
  },
  {
    title: "Rotina comercial com menos atrito",
    body: "O vendedor acompanha próximos passos, tarefas e histórico sem perder o contexto do cliente.",
  },
  {
    title: "Visão para gestão e operação",
    body: "O dashboard evoluirá para funil, pendências, distribuição de prospects e leitura da equipe.",
  },
  {
    title: "IA como apoio ao cadastro e follow-up",
    body: "O xCRM será preparado para interpretar cartões de visita, anotações e contatos recebidos.",
  },
];

type LoginInfoPanelProps = {
  error?: string;
  message?: string;
};

export function LoginInfoPanel({ error, message }: LoginInfoPanelProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const activeSlide = slides[slideIndex];
  const hasSystemMessage = Boolean(error || message);

  useEffect(() => {
    if (hasSystemMessage) {
      return;
    }

    const timer = window.setInterval(() => {
      setSlideIndex((current) => (current + 1) % slides.length);
    }, 30000);

    return () => window.clearInterval(timer);
  }, [hasSystemMessage]);

  if (error || message) {
    const Icon = error ? CircleAlert : CircleCheck;

    return (
      <div
        className={[
          "flex min-h-28 items-start gap-3 rounded-md border bg-surface px-4 py-4 text-sm",
          error ? "border-danger text-danger" : "border-border text-muted",
        ].join(" ")}
        role="status"
      >
        <Icon size={18} aria-hidden className="mt-0.5 shrink-0" />
        <p className="leading-6">{error ?? message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-28 rounded-md border border-border bg-surface px-4 py-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-primary">
          <Sparkles size={16} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{activeSlide.title}</p>
          <p className="mt-1 text-sm leading-6 text-muted">
            {activeSlide.body}
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {slides.map((slide, index) => (
          <span
            key={slide.title}
            className={[
              "h-1.5 rounded-full transition-all",
              index === slideIndex ? "w-6 bg-primary" : "w-1.5 bg-border",
            ].join(" ")}
          />
        ))}
      </div>
    </div>
  );
}
