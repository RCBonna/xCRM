import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { NextResponse } from "next/server";

import { getAppUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatProposalNumber,
  proposalCurrencyFormatter,
  proposalDateFormatter,
  proposalStatusLabels,
} from "@/lib/proposals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpportunityVisibilityWhere } from "@/lib/visibility";

type ProposalPdfRouteProps = {
  params: Promise<{
    proposalId: string;
  }>;
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: "#1f2937",
    fontFamily: "Helvetica",
  },
  header: {
    borderBottom: "1px solid #d8dee8",
    paddingBottom: 16,
    marginBottom: 18,
  },
  tenant: {
    color: "#2563eb",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: 700,
  },
  subtitle: {
    marginTop: 4,
    color: "#667085",
    fontSize: 10,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  box: {
    flex: 1,
    border: "1px solid #d8dee8",
    borderRadius: 4,
    padding: 10,
  },
  label: {
    color: "#667085",
    fontSize: 8,
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    fontWeight: 700,
  },
  table: {
    border: "1px solid #d8dee8",
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #d8dee8",
  },
  tableHeader: {
    backgroundColor: "#eef2f7",
  },
  cell: {
    padding: 7,
  },
  itemCell: {
    width: "43%",
  },
  smallCell: {
    width: "11%",
  },
  moneyCell: {
    width: "13%",
    textAlign: "right",
  },
  muted: {
    color: "#667085",
  },
  dangerText: {
    color: "#c2410c",
  },
  totals: {
    marginLeft: "auto",
    width: 220,
    border: "1px solid #d8dee8",
    borderRadius: 4,
    padding: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  grandTotal: {
    borderTop: "1px solid #d8dee8",
    paddingTop: 8,
    marginTop: 4,
    fontSize: 12,
    fontWeight: 700,
  },
});

export async function GET(_request: Request, { params }: ProposalPdfRouteProps) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Nao autenticado.", { status: 401 });
  }

  const appUser = await getAppUser(user);

  if (!appUser) {
    return new NextResponse("Usuario nao configurado.", { status: 403 });
  }

  const { proposalId } = await params;
  const opportunityVisibilityWhere = await getOpportunityVisibilityWhere(appUser);
  const proposal = await prisma.proposal.findFirst({
    where: {
      id: proposalId,
      tenantId: appUser.tenantId,
      opportunity: {
        ...opportunityVisibilityWhere,
      },
    },
    include: {
      account: true,
      contact: true,
      items: {
        orderBy: {
          position: "asc",
        },
      },
      opportunity: true,
      owner: true,
      tenant: true,
    },
  });

  if (!proposal) {
    return new NextResponse("Proposta nao encontrada.", { status: 404 });
  }

  const proposalNumber = formatProposalNumber(proposal.number, proposal.version);
  const pdf = await renderToBuffer(
    <Document title={proposalNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.tenant}>{proposal.tenant.name}</Text>
          <Text style={styles.title}>Proposta {proposalNumber}</Text>
          <Text style={styles.subtitle}>
            {proposal.account.name} - {proposal.opportunity.title}
          </Text>
        </View>

        <View style={[styles.section, styles.grid]}>
          <View style={styles.box}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>
              {proposalStatusLabels[proposal.status]}
            </Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Emissao</Text>
            <Text style={styles.value}>
              {proposalDateFormatter.format(proposal.issuedAt)}
            </Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Validade</Text>
            <Text style={styles.value}>
              {proposal.validUntil
                ? proposalDateFormatter.format(proposal.validUntil)
                : "Nao informada"}
            </Text>
          </View>
        </View>

        <View style={[styles.section, styles.grid]}>
          <View style={styles.box}>
            <Text style={styles.label}>Empresa/Prospect</Text>
            <Text style={styles.value}>{proposal.account.name}</Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Contato</Text>
            <Text style={styles.value}>
              {proposal.contact?.name ?? "Sem contato vinculado"}
            </Text>
          </View>
          <View style={styles.box}>
            <Text style={styles.label}>Responsavel</Text>
            <Text style={styles.value}>
              {proposal.owner?.name ?? "Nao informado"}
            </Text>
          </View>
        </View>

        {proposal.introduction ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Introducao</Text>
            <Text>{proposal.introduction}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.cell, styles.itemCell]}>Item</Text>
              <Text style={[styles.cell, styles.smallCell]}>Un.</Text>
              <Text style={[styles.cell, styles.smallCell]}>Qtde.</Text>
              <Text style={[styles.cell, styles.moneyCell]}>Unitario</Text>
              <Text style={[styles.cell, styles.moneyCell]}>Total</Text>
            </View>
            {proposal.items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <View style={[styles.cell, styles.itemCell]}>
                  <Text>{item.snapshotName}</Text>
                  {item.snapshotDescription ? (
                    <Text style={styles.muted}>{item.snapshotDescription}</Text>
                  ) : null}
                </View>
                <Text style={[styles.cell, styles.smallCell]}>
                  {item.snapshotUnit}
                </Text>
                <Text style={[styles.cell, styles.smallCell]}>
                  {Number(item.quantity).toLocaleString("pt-BR", {
                    maximumFractionDigits: 3,
                  })}
                </Text>
                <Text style={[styles.cell, styles.moneyCell]}>
                  {proposalCurrencyFormatter.format(Number(item.unitPrice))}
                </Text>
                <Text style={[styles.cell, styles.moneyCell]}>
                  {proposalCurrencyFormatter.format(Number(item.lineTotal))}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text>Subtotal</Text>
              <Text>
                {proposalCurrencyFormatter.format(Number(proposal.subtotal))}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Desconto</Text>
                <Text style={styles.dangerText}>
                  {proposalCurrencyFormatter.format(Number(proposal.discount))}
                </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Frete</Text>
              <Text>
                {proposalCurrencyFormatter.format(Number(proposal.freight))}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text>Acrescimos</Text>
              <Text>
                {proposalCurrencyFormatter.format(Number(proposal.additions))}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text>Total</Text>
              <Text>{proposalCurrencyFormatter.format(Number(proposal.total))}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          {proposal.paymentTerms ? (
            <>
              <Text style={styles.sectionTitle}>Condicoes de Pagamento</Text>
              <Text>{proposal.paymentTerms}</Text>
            </>
          ) : null}
          {proposal.commercialTerms ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
                Condicoes Comerciais
              </Text>
              <Text>{proposal.commercialTerms}</Text>
            </>
          ) : null}
          {proposal.notes ? (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
                Observacoes
              </Text>
              <Text>{proposal.notes}</Text>
            </>
          ) : null}
        </View>
      </Page>
    </Document>,
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${proposalNumber}.pdf"`,
    },
  });
}
