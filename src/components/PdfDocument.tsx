import React from "react"
import { Document, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer"

interface PdfProps {
  data: Array<Record<string, any>>
  metadata: { title?: string; subtitle?: string }
  date?: Date
  logo?: string
}

export const MyPdfDocument: React.FC<PdfProps> = ({ data, metadata, date = new Date(), logo }) => {
  const columns = Object.keys((data && data[0]) || {})

  const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 10, fontFamily: "Helvetica" },
    header: { alignItems: "center", marginBottom: 8 },
    logo: { width: 140, height: 40, objectFit: "contain", marginBottom: 6 },
    date: { fontSize: 9, color: "#666" },
    title: { fontSize: 16, textAlign: "center", marginTop: 6, marginBottom: 2 },
    subtitle: { fontSize: 12, textAlign: "center", marginBottom: 6, color: "#666" },
    tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#999", backgroundColor: "#eee" },
    tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
    tableCellHeader: { padding: 6, fontSize: 9, fontWeight: 700 },
    tableCell: { padding: 6, fontSize: 9 },
  })

  const cellWidth = `${100 / Math.max(1, columns.length)}%`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {logo ? <Image src={logo} style={styles.logo} /> : null}
          <Text style={styles.date}>{date.toLocaleDateString()}</Text>
        </View>

        {metadata.title ? <Text style={styles.title}>{metadata.title}</Text> : null}
        {metadata.subtitle ? <Text style={styles.subtitle}>{metadata.subtitle}</Text> : null}

        {/* Table header */}
        <View style={{ marginTop: 8 }}>
          <View style={styles.tableHeader}>
            {columns.map((col) => (
              <View key={col} style={{ width: cellWidth }}>
                <Text style={styles.tableCellHeader}>{col}</Text>
              </View>
            ))}
          </View>

          {/* Table rows */}
          {data.map((row, ri) => (
            <View style={styles.tableRow} key={ri} wrap={false}>
              {columns.map((col) => (
                <View key={col} style={{ width: cellWidth }}>
                  <Text style={styles.tableCell}>{String(row[col] ?? "")}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export async function createPdfBlob(props: PdfProps): Promise<Blob> {
  const doc = <MyPdfDocument {...props} />
  const blob = await pdf(doc).toBlob()
  return blob
}

export default MyPdfDocument
