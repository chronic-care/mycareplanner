import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FHIRData, displayDate } from '../../data-services/models/fhirResources'
import { PatientSummary, ScreeningSummary, MedicationSummary } from '../../data-services/models/cqlSummary'
import { getMedicationSummary } from '../../data-services/mccCqlService'
import { Summary, SummaryRowItems } from './Summary'

interface MedicationListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface MedicationListState {
  medicationSummary?: MedicationSummary[]
}

export const MedicationList: React.FC<MedicationListProps> = (props: MedicationListProps) => {

  const [medicationSummary, setMedicationSummary] = useState<MedicationSummary[] | undefined>([{ ConceptName: 'init' }])

  useEffect(() => {
    console.time('getMedicationSummary()')
    setMedicationSummary(getMedicationSummary(props.fhirData))
    console.timeEnd('getMedicationSummary()')
  }, [props.fhirData])

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Medications</h4>

        {medicationSummary && medicationSummary.length > 0 && medicationSummary[0]?.ConceptName === 'init'
          ? <p>Loading...</p>
          : !medicationSummary || medicationSummary.length < 1
            ? <p>No records found.</p>
            :
            <>
              {medicationSummary?.map((med, idx) => (
                <Summary key={idx} id={idx} rows={buildRows(med)} />
              ))}
            </>
        }

      </div>
    </div>
  )

}

const buildRows = (med: MedicationSummary): SummaryRowItems => {
  let rows: SummaryRowItems =
    [
      {
        isHeader: true,
        twoColumns: true,
        data1: med.ConceptName ?? "No text",
        data2: med.LearnMore === undefined || med.LearnMore === null ? '' :
          <Link to="route" target="_blank"
            onClick={
              (event) => { event.preventDefault(); window.open(med.LearnMore); }
            }><i>Learn&nbsp;More</i>
          </Link>,
      },
      {
        isHeader: false,
        twoColumns: true,
        data1: displayDate(med.AuthoredOn),
        data2: 'By: ' + (med.Requester ?? 'Unknown'),
      },
      {
        isHeader: false,
        twoColumns: false,
        data1: med.DosageInstruction,
        data2: '',
      },
    ]

  const notes: SummaryRowItems | undefined = med.Notes?.map((note) => (
    {
      isHeader: false,
      twoColumns: false,
      data1: 'Note: ' + note,
      data2: '',
    }
  ))
  if (notes?.length) {
    rows = rows.concat(notes)
  }

  return rows
}
