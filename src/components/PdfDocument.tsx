import React from "react"
import { Document, Page, View, Text, Image, StyleSheet, pdf } from "@react-pdf/renderer"
import logoPng from "../assets/logo.png"

// For specific bolding, we'll use fontWeight 'bold' or numeric values.

interface PdfProps {
  data: Array<Record<string, any>> // rows
  metadata: Record<string, any>
  date?: Date
  logo?: string 
}

// Colors from requirements
const COLORS = {
  headerBg: "#d5d5d5",      // Table headers, total duration label
  darkBar: "#5e5e5e",       // Heavy bars, total duration value box
  textMain: "#000000",
  textWhite: "#ffffff",
  textMeta: "#000000",
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: "Helvetica",
    fontSize: 9, 
    color: COLORS.textMain
  },
  // Top Header (Logo + Mastering Engineer)
  topHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    borderBottomWidth: 0, 
  },
  logo: {
    width: "190px", 
    height: "auto",
    objectFit: "contain"
  },
  masteringInfo: {
    fontSize: 8,
    textAlign: "right",
    marginBottom: 5
  },
  masteringLink: {
    textDecoration: "underline"
  },
  // Heavy Bar
  heavyBar: {
    height: 8,
    backgroundColor: COLORS.darkBar,
    marginBottom: 10,
    marginTop: 5,
  },
  // Metadata Section
  metaContainer: {
    marginBottom: 0,
  },
  metaSeparator: {
    borderBottomWidth: 1, 
    borderBottomColor: '#d5d5d5', 
    marginVertical: 4
  },
  metaSeparatorBold: {
    borderBottomWidth: 1, 
    borderBottomColor: '#5e5e5e', 
    marginVertical: 4
  },
  metaTitle: {
    fontSize: 14, // Larger for Artist/Album
    fontWeight: "bold", // 700
    marginBottom: 2,
  },
  metaSubtitle: {
    fontSize: 12, // Slightly smaller
    marginBottom: 8, 
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaLabel: {
    fontWeight: "bold", 
    color: "#444" 
  },
  metaValue: {
    flex: 1,
  },
  // Vinyl Specific
  vinylSection: {
    marginBottom: 10,
  },
  vinylHeader: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
  },
  vinylText: {
    fontSize: 9,
    marginBottom: 1,
  },

  // Table
  tableContainer: {
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.headerBg,
    alignItems: "center",
    height: 18,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    height: 18,
    alignItems: "center",
  },
  cellText: {
    fontSize: 8,
    paddingLeft: 4,
  },
  cellHeader: {
    fontSize: 8,
    fontWeight: "bold", // Bold headers
    paddingLeft: 4,
  },
  // Columns
  colTrack: { width: "8%", textAlign: "right", paddingRight: 8 },
  colTitle: { width: "42%" },
  colStart: { width: "15%", textAlign: "right", paddingRight: 4 }, // Start
  colDur: { width: "15%", textAlign: "right", paddingRight: 4 },   // Duration
  colIsrc: { width: "20%" },

  // Total Duration
  totalRow: {
    flexDirection: "row",
    height: 18,
    marginTop: 0,
  },
  totalLabelBox: {
    flex: 1, // Takes up remaining space? Or aligns with duration col?
    // Based on image: "Total Duration:" spans from start to Start col check?
    // Actually, image shows "Total Duration:" box aligns with Start column? No, spans a few cols.
    // Let's just span the left side.
    backgroundColor: COLORS.headerBg,
    justifyContent: "center",
    paddingRight: 4,
    alignItems: "flex-end",
    // Width needs to match logic. 
    // Left side (Track + Title + Start) approx 65%
    width: "65%" 
  },
  totalValueBox: {
    width: "15%", // Matches Duration col
    backgroundColor: COLORS.darkBar,
    justifyContent: "center",
    paddingLeft: 4,
  },
  totalLabelText: {
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.textMain,
  },
  totalValueText: {
    paddingRight: 2,
    fontSize: 8,
    fontWeight: "bold",
    color: COLORS.textWhite,
  },
  
  // Footer
  footer: {
    marginTop: 10,
    height: 15,
    backgroundColor: COLORS.darkBar,
    justifyContent: 'center',
    paddingLeft: 5
  },
  footerText: {
    color: COLORS.textWhite,
    fontSize: 7,
  }
})

// Columns config
const Cols = {
  Track: styles.colTrack,
  Title: styles.colTitle,
  Start: styles.colStart,
  Dur: styles.colDur,
  ISRC: styles.colIsrc
}

// Utility to parse duration "m:ss" to seconds
const parseDur = (str: string) => {
  if(!str) return 0;
  const p = str.split(":").map(Number);
  if(p.length === 2) return p[0]*60 + p[1];
  if(p.length === 3) return p[0]*3600 + p[1]*60 + p[2];
  return 0;
}

const formatDur = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

export const MyPdfDocument: React.FC<PdfProps> = ({ data, metadata }) => {
  // Determine if Vinyl Mode
  const isVinyl = !!metadata.vinylSide;

  // Adjust column widths based on Vinyl mode (no ISRC = more space for Title)
  const dynamicTitleWidth = isVinyl ? "62%" : "42%"

  const dynamicCols = {
      ...Cols,
      Title: { ...Cols.Title, width: dynamicTitleWidth }
  }

  // Calculate Total Duration
  const totalSeconds = data.reduce((acc, row) => {
    // try row.Length or row.Duration
    const val = row.Length || row.Duration || "0:00";
    return acc + parseDur(String(val));
  }, 0);
  const totalDurationStr = formatDur(totalSeconds);

  // Pagination Logic: first page 25 rows for vinyl, 30 for non-vinyl; subsequent pages 50 rows
  const FIRST_PAGE_ITEMS = isVinyl ? 25 : 30;
  const SUBSEQUENT_ITEMS = 40;
  const pages = [];
  if (data.length === 0) {
    pages.push([]);
  } else {
    // first page
    pages.push(data.slice(0, FIRST_PAGE_ITEMS));
    // subsequent pages
    for (let i = FIRST_PAGE_ITEMS; i < data.length; i += SUBSEQUENT_ITEMS) {
      pages.push(data.slice(i, i + SUBSEQUENT_ITEMS));
    }
  }

  return (
    <Document>
      {pages.map((pageData, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          
          {/* Apply Header only on first page? 
              User said: "extend only the rest of the table to another page" 
              This commonly implies the main header is on PG1 only. 
          */}
          {pageIndex === 0 && (
            <>
              {/* TOP HEADER */}
                <View style={styles.topHeaderContainer}>
                <View>
                  {/* Logo - Force logo.jpg as requested */}
                  <Image src={logoPng} style={styles.logo} />

                  {/* Mastering Engineer Info under the logo */}
                  <Text style={[styles.masteringInfo, { textAlign: "left", marginTop: 5 }]}>
                  <Text style={{ fontWeight: "bold" }}>Mastering Engineer: </Text>
                  {metadata.masteringEngineerName || metadata.masteringEngineer || "Taylor Deupree"} / {metadata.masteringEngineerEmail || "taylor@12kmastering.com"}
                  </Text>
                </View>
                </View>

              {/* HEAVY BAR */}
              <View style={styles.heavyBar} />

              {/* METADATA SECTION */}
              <View style={styles.metaContainer}>
                <Text style={styles.metaTitle}>{metadata.artist || "Artist Name"}</Text>
                
                <View style={styles.metaSeparator} />
                
                <Text style={{...styles.metaTitle, fontWeight:'normal', marginTop: 2}}>{metadata.albumTitle || "Album Title"}</Text>
                
                <View style={styles.metaSeparatorBold} />

                <View style={{marginTop: 5}}>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Client: </Text>
                        <Text style={styles.metaValue}>{metadata.client}</Text>
                    </View>
                    
                    <View style={styles.metaSeparator} />

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Catalog # / Label: </Text>
                        <Text style={styles.metaValue}>{metadata.catalog}</Text>
                    </View>
                    
                    <View style={styles.metaSeparator} />

                    <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Date: </Text>
                        <Text style={styles.metaValue}>{metadata.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                    </View>
                </View>
              </View>

              {/* HEAVY BAR SEPARATOR */}
              <View style={styles.heavyBar} />

              {/* VINYL SPECIFIC METADATA (Conditional) */}
              {isVinyl && (
                <View style={styles.vinylSection}>
                  <Text style={styles.vinylHeader}>Vinyl Side {metadata.vinylSide}</Text>
                  <Text style={styles.vinylText}>
                      {[metadata.bits, metadata.sampleRate].filter(Boolean).join(" / ") || "24 bit / 48khz WAV"}
                  </Text>
                  <Text style={styles.vinylText}>
                      {metadata.perSideNote || "single file per vinyl side"}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* TABLE HEADER - Repeat on every page? Usually yes. */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.cellHeader, dynamicCols.Track]}>Track</Text>
            <Text style={[styles.cellHeader, dynamicCols.Title]}>Title</Text>
            {/* Some styles might vary between Left/Right images? 
                Left has "Start | Duration | ISRC". Right has "Start | Duration" (no ISCR visible in snippet, but assuming standard columns unless specified).
                The snippet for Vinyl shows "Track | Title | Start | Duration". No ISRC col. 
                Wait, looking at image "Vinyl Side A": Columns are Track, Title, Start, Duration.
                Left image: Track, Title, Start, Duration, ISRC.
                
                So if Vinyl, hide ISRC? 
                "vinyl.xml would use the one on the right" -> Right image has no ISRC in the header.
                "cd digital.xml" -> Left image has ISRC.
                
                Let's hide ISRC if isVinyl.
             */}
            <Text style={[styles.cellHeader, dynamicCols.Start]}>Start</Text>
            <Text style={[styles.cellHeader, dynamicCols.Dur]}>Duration</Text>
            {!isVinyl && <Text style={[styles.cellHeader, dynamicCols.ISRC]}>ISRC</Text>}
          </View>

          {/* TABLE ROWS */}
          {pageData.map((row, idx) => (
            <View style={styles.tableRow} key={idx}>
              {/* Index: page 0 start=0; page n start = FIRST_PAGE_ITEMS + (n-1)*SUBSEQUENT_ITEMS */}
              <Text style={[styles.cellText, dynamicCols.Track]}>{((pageIndex === 0 ? 0 : FIRST_PAGE_ITEMS + (pageIndex - 1) * SUBSEQUENT_ITEMS) + idx + 1)}</Text>
              <Text style={[styles.cellText, dynamicCols.Title]}>{row.Title || ""}</Text>
              <Text style={[styles.cellText, dynamicCols.Start]}>{row.StartM || ""}</Text>
              <Text style={[styles.cellText, dynamicCols.Dur]}>{row.Length || row.Duration || ""}</Text>
              {!isVinyl && <Text style={[styles.cellText, dynamicCols.ISRC]}>{row.ISRC || ""}</Text>}
            </View>
          ))}
            
          {/* TOTAL DURATION - Only on Last Page or after table ends? 
              Image shows it at the bottom of the table. 
              If we have multiple pages, it should be at the end of the data. 
          */}
          {pageIndex === pages.length - 1 && (
            <>
              <View style={styles.totalRow}>
                  {/* Label takes remaining space in the row before the Duration column */}
                  <View style={{ width: isVinyl ? "85%" : "65%", backgroundColor: COLORS.headerBg, justifyContent: 'center', paddingRight: 6, alignItems: 'flex-end' }}>
                    <Text style={styles.totalLabelText}>Total Duration:</Text>
                  </View>

                  <View style={{ width: "15%", backgroundColor: COLORS.darkBar, justifyContent: 'center', paddingRight: 6, alignItems: 'flex-end' }}>
                    <Text style={{...styles.totalValueText, textAlign: 'right'}}>{totalDurationStr}</Text>
                  </View>

                  {/* If ISRC column exists, fill the remaining space with matching header color */}
                  {!isVinyl && <View style={{ width: "20%", backgroundColor: COLORS.headerBg }} />}
              </View>

              {/* FOOTER - Website URL */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>www.12kmastering.com</Text> 
              </View>
            </>
          )}

        </Page>
      ))}
    </Document>
  )
}

export async function createPdfBlob(props: PdfProps): Promise<Blob> {
  const doc = <MyPdfDocument {...props} />
  const blob = await pdf(doc).toBlob()
  return blob
}

export default MyPdfDocument
