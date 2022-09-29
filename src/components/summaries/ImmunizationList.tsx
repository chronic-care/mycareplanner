import '../../Home.css'
import React from 'react'
import { FHIRData, displayDate } from '../../data-services/models/fhirResources'
import { PatientSummary, ScreeningSummary } from '../../data-services/models/cqlSummary'
import { Summary, SummaryRowItem, SummaryRowItems } from './Summary'
import { Immunization } from '../../data-services/fhir-types/fhir-r4'
import { BusySpinner } from '../busy-spinner/BusySpinner'

interface ImmunizationListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface ImmunizationListState {
}

export const ImmunizationList: React.FC<ImmunizationListProps> = (props: ImmunizationListProps) => {

  let immunizations = props.fhirData?.immunizations
  // Sort by descending occurrence date
  immunizations?.sort((r1, r2) => {
    let r1DateString = r1.occurrenceDateTime ?? r1.recorded
    let r2DateString = r2.occurrenceDateTime ?? r2.recorded
    let r1Date = r1DateString !== undefined ? new Date(r1DateString!) : undefined
    let r2Date = r2DateString !== undefined ? new Date(r2DateString!) : undefined

    if (r1Date === undefined && r2Date !== undefined) {
      return 1
    }
    if (r1Date !== undefined && r2Date === undefined) {
      return -1
    }
    if (r1Date! < r2Date!) {
      return 1;
    }
    if (r1Date! > r2Date!) {
      return -1;
    }
    return 0;
  })

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Immunizations</h4>

        {props.fhirData === undefined
          && <> <p>Reading your clinical records...</p>
            <BusySpinner busy={props.fhirData === undefined} />
          </>
        }

        {(immunizations === undefined || immunizations?.length < 1) && props.fhirData !== undefined
          ? <p>No records found.</p>
          :
          <>
            {immunizations?.map((med, idx) => (
              <Summary key={idx} id={idx} rows={buildRows(med)} />
            ))}
          </>
        }

      </div>
    </div>
  )

}

const buildRows = (med: Immunization): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: false,
        data1: med.vaccineCode?.text ?? "No text",
        data2: '',
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: 'Administered on: ' + (med.occurrenceDateTime ? displayDate(med.occurrenceDateTime) : 'Unknown'),
        data2: '',
      },
    ]

  if (med.location) {
    const location: SummaryRowItem = {
      isHeader: false,
      twoColumns: false,
      data1: 'Location: ' + med.location?.display,
      data2: undefined
    }
    rows.push(location)
  }

  const notes: SummaryRowItems | undefined = med.note?.map((note) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: note.text ? 'Note: ' + note.text : '',
      data2: '',
    }
  ))
  if (notes?.length) {
    rows = rows.concat(notes)
  }

  return rows
}
