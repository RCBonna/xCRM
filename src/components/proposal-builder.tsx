"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { CurrencyInput } from "@/components/currency-input";

type ProductOption = {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  unit: string;
  basePrice: string;
};

type ProposalRow = {
  key: string;
  productId: string;
  productSearch: string;
  name: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  itemDiscountMode: DiscountMode;
  itemDiscountPercent: string;
  itemDiscount: string;
};

type ProposalBuilderProps = {
  products: ProductOption[];
};

type DiscountMode = "amount" | "percent";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function getProductLabel(product: ProductOption) {
  return `${product.sku ? `${product.sku} - ` : ""}${product.name}`;
}

function parseDecimal(value: string) {
  const text = value.trim().replace(/[^\d,.-]/g, "");

  if (!text) {
    return 0;
  }

  const normalized = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text.split(".").length > 2
      ? text.replace(/\./g, "")
      : text;
  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function sanitizeDecimalInput(value: string) {
  let sanitized = value.replace(/[^\d,.]/g, "");
  const firstSeparatorIndex = sanitized.search(/[,.]/);

  if (firstSeparatorIndex >= 0) {
    const beforeSeparator = sanitized.slice(0, firstSeparatorIndex + 1);
    const afterSeparator = sanitized
      .slice(firstSeparatorIndex + 1)
      .replace(/[,.]/g, "");
    sanitized = beforeSeparator + afterSeparator;
  }

  return sanitized;
}

function formatInputMoney(value: string) {
  const number = Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "";
}

function formatInputPercent(value: number) {
  return Number.isFinite(value) && value > 0
    ? value.toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      })
    : "";
}

function createEmptyRow(index: number): ProposalRow {
  return {
    key: `${Date.now()}-${index}`,
    productId: "",
    productSearch: "",
    name: "",
    description: "",
    unit: "UN",
    quantity: "1",
    unitPrice: "",
    itemDiscountMode: "amount",
    itemDiscountPercent: "",
    itemDiscount: "",
  };
}

export function ProposalBuilder({ products }: ProposalBuilderProps) {
  const [rows, setRows] = useState<ProposalRow[]>([createEmptyRow(0)]);
  const [discount, setDiscount] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("amount");
  const [freight, setFreight] = useState("");
  const [additions, setAdditions] = useState("");

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, row) => {
      const quantity = Math.max(0, parseDecimal(row.quantity));
      const unitPrice = Math.max(0, parseDecimal(row.unitPrice));
      const itemGrossTotal = quantity * unitPrice;
      const itemDiscount =
        row.itemDiscountMode === "percent"
          ? itemGrossTotal *
            (Math.max(0, parseDecimal(row.itemDiscountPercent)) / 100)
          : Math.max(0, parseDecimal(row.itemDiscount));

      return sum + Math.max(0, itemGrossTotal - itemDiscount);
    }, 0);
    const proposalDiscount =
      discountMode === "percent"
        ? subtotal * (Math.max(0, parseDecimal(discountPercent)) / 100)
        : Math.max(0, parseDecimal(discount));
    const freightAmount = Math.max(0, parseDecimal(freight));
    const additionsAmount = Math.max(0, parseDecimal(additions));
    const adjustments = -proposalDiscount + freightAmount + additionsAmount;
    const total = Math.max(0, subtotal + adjustments);

    return {
      adjustments,
      additions: additionsAmount,
      discount: proposalDiscount,
      freight: freightAmount,
      subtotal,
      total,
    };
  }, [additions, discount, discountMode, discountPercent, freight, rows]);

  function updateRow(index: number, patch: Partial<ProposalRow>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);

    if (!product) {
      updateRow(index, { productId });
      return;
    }

    updateRow(index, {
      productId: product.id,
      productSearch: getProductLabel(product),
      name: product.name,
      description: product.description ?? "",
      unit: product.unit,
      unitPrice: formatInputMoney(product.basePrice),
    });
  }

  function updateProductSearch(index: number, value: string) {
    const product = products.find((item) => getProductLabel(item) === value);

    if (product) {
      selectProduct(index, product.id);
      return;
    }

    updateRow(index, {
      productId: "",
      productSearch: value,
      name: value,
    });
  }

  function getItemGrossTotal(row: ProposalRow) {
    return (
      Math.max(0, parseDecimal(row.quantity)) *
      Math.max(0, parseDecimal(row.unitPrice))
    );
  }

  function getItemDiscount(row: ProposalRow) {
    if (row.itemDiscountMode === "percent") {
      return (
        getItemGrossTotal(row) *
        (Math.max(0, parseDecimal(row.itemDiscountPercent)) / 100)
      );
    }

    return Math.max(0, parseDecimal(row.itemDiscount));
  }

  function updateItemDiscountPercent(index: number, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        const percent = Math.max(0, parseDecimal(value));
        const calculatedDiscount = getItemGrossTotal(row) * (percent / 100);

        return {
          ...row,
          itemDiscountMode: "percent",
          itemDiscountPercent: value,
          itemDiscount: value.trim()
            ? formatInputMoney(calculatedDiscount.toFixed(2))
            : "",
        };
      }),
    );
  }

  function updateItemDiscountAmount(index: number, value: string) {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) {
          return row;
        }

        const amount = Math.max(0, parseDecimal(value));
        const grossTotal = getItemGrossTotal(row);
        const percent = grossTotal > 0 ? (amount / grossTotal) * 100 : 0;

        return {
          ...row,
          itemDiscountMode: "amount",
          itemDiscount: value,
          itemDiscountPercent: formatInputPercent(percent),
        };
      }),
    );
  }

  function updateDiscountPercent(value: string) {
    setDiscountMode("percent");
    setDiscountPercent(value);
  }

  function updateDiscountAmount(value: string) {
    setDiscountMode("amount");
    setDiscount(value);

    const amount = Math.max(0, parseDecimal(value));
    const percent = totals.subtotal > 0 ? (amount / totals.subtotal) * 100 : 0;
    setDiscountPercent(formatInputPercent(percent));
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-md border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold">Itens da Proposta</h2>
          <p className="mt-1 text-sm text-muted">
            Selecione do catálogo ou preencha um item avulso.
          </p>
        </div>

        <datalist id="proposal-products-list">
          {products.map((product) => (
            <option key={product.id} value={getProductLabel(product)} />
          ))}
        </datalist>

        <div className="divide-y divide-border">
          {rows.map((row, index) => {
            const lineTotal = Math.max(
              0,
              Math.max(0, parseDecimal(row.quantity)) *
                Math.max(0, parseDecimal(row.unitPrice)) -
                getItemDiscount(row),
            );

            return (
              <div key={row.key} className="grid gap-3 px-4 py-4">
                <div className="grid gap-3">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">
                      Produto do Catálogo ou Item Avulso
                    </span>
                    <span className="relative">
                      <Search
                        size={16}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                        aria-hidden
                      />
                      <input
                        required
                        type="search"
                        list="proposal-products-list"
                        value={row.productSearch || row.name}
                        onChange={(event) =>
                          updateProductSearch(index, event.target.value)
                        }
                        className="h-10 w-full rounded-md border border-border bg-background px-9 text-sm"
                        placeholder="Buscar por SKU ou Produto..."
                      />
                    </span>
                    <input type="hidden" name="productId" value={row.productId} />
                    <input type="hidden" name="itemName" value={row.name} />
                    <input
                      type="hidden"
                      name="itemDiscount"
                      value={
                        row.itemDiscountMode === "percent"
                          ? formatInputMoney(getItemDiscount(row).toFixed(2))
                          : row.itemDiscount
                      }
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-sm">
                  <span className="font-medium">Descrição</span>
                  <textarea
                    name="itemDescription"
                    rows={1}
                    value={row.description}
                    onChange={(event) =>
                      updateRow(index, { description: event.target.value })
                    }
                    className="min-h-10 resize-y rounded-md border border-border bg-background px-3 py-2 text-sm leading-6"
                  />
                </label>

                <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-[5.5rem_5.5rem_minmax(10.5rem,1fr)_minmax(10.5rem,1fr)_8rem_minmax(10.5rem,1fr)] 2xl:items-end">
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Unidade</span>
                    <input
                      name="itemUnit"
                      type="text"
                      value={row.unit}
                      onChange={(event) =>
                        updateRow(index, {
                          unit: event.target.value.toLocaleUpperCase("pt-BR"),
                        })
                      }
                      className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm uppercase"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Qtde.</span>
                    <input
                      required
                      name="quantity"
                      type="text"
                      inputMode="decimal"
                      value={row.quantity}
                      onChange={(event) =>
                        updateRow(index, {
                          quantity: sanitizeDecimalInput(event.target.value),
                        })
                      }
                      className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Valor Unitário</span>
                    <CurrencyInput
                      name="unitPrice"
                      value={row.unitPrice}
                      onChange={(event) =>
                        updateRow(index, { unitPrice: event.target.value })
                      }
                      className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">Desconto do Item</span>
                    <CurrencyInput
                      value={
                        row.itemDiscountMode === "percent"
                          ? formatInputMoney(getItemDiscount(row).toFixed(2))
                          : row.itemDiscount
                      }
                      onChange={(event) =>
                        updateItemDiscountAmount(index, event.target.value)
                      }
                      className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-medium">% Desc. Item</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={row.itemDiscountPercent}
                      onChange={(event) =>
                        updateItemDiscountPercent(index, event.target.value)
                      }
                      onBlur={(event) => {
                        const percent = Math.max(
                          0,
                          parseDecimal(event.currentTarget.value),
                        );
                        updateRow(index, {
                          itemDiscountPercent: formatInputPercent(percent),
                        });
                      }}
                      className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
                      placeholder="0%"
                    />
                  </label>
                  <div className="grid gap-1 text-sm">
                    <span className="font-medium">Total do Item</span>
                    <div className="flex h-10 w-full min-w-0 items-center rounded-md border border-border bg-surface-muted px-3 text-sm font-semibold">
                      {moneyFormatter.format(lineTotal)}
                    </div>
                  </div>
                </div>

                {rows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setRows((current) =>
                        current.filter((_, rowIndex) => rowIndex !== index),
                      )
                    }
                    className="inline-flex h-9 w-fit items-center gap-2 rounded-md border border-danger px-3 text-xs font-medium text-danger transition-colors hover:bg-danger hover:text-danger-foreground"
                  >
                    <Trash2 size={14} aria-hidden />
                    Remover Item
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={() =>
              setRows((current) => [...current, createEmptyRow(current.length)])
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus size={16} aria-hidden />
            Adicionar Item
          </button>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 rounded-md border border-border p-4 md:grid-cols-2 xl:grid-cols-[9rem_minmax(11rem,1fr)_minmax(11rem,1fr)_minmax(11rem,1fr)]">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">% Desconto</span>
          <input
            name="discountPercent"
            type="text"
            inputMode="decimal"
            value={discountPercent}
            onChange={(event) => updateDiscountPercent(event.target.value)}
            onBlur={(event) => {
              const percent = Math.max(0, parseDecimal(event.currentTarget.value));
              setDiscountPercent(formatInputPercent(percent));
            }}
            className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
            placeholder="0%"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Desconto Geral</span>
          <CurrencyInput
            name="discount"
            value={
              discountMode === "percent"
                ? formatInputMoney(totals.discount.toFixed(2))
                : discount
            }
            onChange={(event) => updateDiscountAmount(event.target.value)}
            className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Frete</span>
          <CurrencyInput
            name="freight"
            value={freight}
            onChange={(event) => setFreight(event.target.value)}
            className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Acréscimos</span>
          <CurrencyInput
            name="additions"
            value={additions}
            onChange={(event) => setAdditions(event.target.value)}
            className="h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-3 rounded-md border border-border bg-surface-muted p-4 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted">Subtotal dos Itens</p>
          <p className="mt-1 text-lg font-semibold">
            {moneyFormatter.format(totals.subtotal)}
          </p>
        </div>
        <div className="sm:text-center">
          <p className="text-muted">Descontos/Acréscimos</p>
          <p
            className={[
              "mt-1 text-lg font-semibold",
              totals.adjustments < 0 ? "text-danger" : "text-foreground",
            ].join(" ")}
          >
            {totals.adjustments < 0 ? "-" : totals.adjustments > 0 ? "+" : ""}
            {moneyFormatter.format(Math.abs(totals.adjustments))}
          </p>
          <p className="mt-1 text-xs text-muted">
            Desc. {moneyFormatter.format(totals.discount)} · Frete{" "}
            {moneyFormatter.format(totals.freight)} · Acrésc.{" "}
            {moneyFormatter.format(totals.additions)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-muted">Total da Proposta</p>
          <p className="mt-1 text-lg font-semibold text-primary">
            {moneyFormatter.format(totals.total)}
          </p>
        </div>
      </div>
    </section>
  );
}
