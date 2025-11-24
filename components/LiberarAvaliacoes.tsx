"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

export default function LiberarAvaliacoes() {
  const [loadingOp, setLoadingOp] = useState(false);
  const [loadingGestao, setLoadingGestao] = useState(false);

  async function liberar(tipo: "operacional" | "gestao") {
    const setLoading = tipo === "operacional" ? setLoadingOp : setLoadingGestao;
    setLoading(true);

    try {
      const res = await fetch("/api/avaliacao/liberar-massa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, forcarNova: true }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Avaliações liberadas com sucesso!\nNovas criadas: ${data.criadas}\nTotal: ${data.total} funcionário(s)`, {
          duration: 8000,
          style: { whiteSpace: "pre-line" }
        });
      } else {
        toast.error(data.error || "Erro ao liberar");
      }
    } catch (err) {
      toast.error("Erro de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3 mt-6">
      <button onClick={() => liberar("operacional")} disabled={loadingOp || loadingGestao}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-70">
        {loadingOp ? "Liberando..." : "Liberar para OPERACIONAIS"}
      </button>
      <button onClick={() => liberar("gestao")} disabled={loadingOp || loadingGestao}
        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-70">
        {loadingGestao ? "Liberando..." : "Liberar para GESTÃO"}
      </button>
    </div>
  );
}
