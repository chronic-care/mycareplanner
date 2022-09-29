import React from 'react'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import { createTheme, ThemeProvider } from '@mui/material'
import { SummaryRow } from './SummaryRow'

export interface SummaryRowItem {
  isHeader: boolean,
  twoColumns: boolean,
  data1: any,
  data2: any,
}

export interface SummaryRowItems extends Array<SummaryRowItem> { }

interface SummaryProps {
  id: number,
  header?: string,
  rows: SummaryRowItems,
}

const summaryTheme = createTheme({
  components: {
    MuiTypography: {
      variants: [
        {
          props: {
            variant: "h6"
          },
          style: {
            fontSize: 18,
            fontWeight: "bold",
          },
        },
        {
          props: {
            variant: "body2"
          },
          style: {
            fontSize: "14px !important",
          },
        }
      ]
    }
  }
})

export const Summary: React.FC<SummaryProps> = (props: SummaryProps) => {
  return (
    <ThemeProvider theme={summaryTheme}>
      <Paper key={props.id} elevation={4} style={{ padding: 8, marginBottom: 13 }}>
        <Grid container spacing={1}>

          {props.rows?.map((row, idx) => (
            <SummaryRow key={idx} isHeader={row.isHeader} twoColumns={row.twoColumns}
              data1={row.data1} data2={row.data2} />
          ))}

        </Grid>
      </Paper>
    </ThemeProvider>
  )
}
