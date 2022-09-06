import '../../Home.css'
import React from 'react'
import { FHIRData, displayDate } from '../../data-services/models/fhirResources'
import { PatientSummary, ScreeningSummary } from '../../data-services/models/cqlSummary'

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

        {immunizations === undefined || immunizations?.length < 1 ? <p>No records found.</p> :
          <table><tbody>
            {immunizations?.map((med, idx) => (
              <tr key={idx}>
                <td>
                  <table><tbody>
                    <tr><td><b>{med.vaccineCode?.text ?? "No text"}</b></td></tr>
                    <tr><td>Administered on: {displayDate(med.occurrenceDateTime)}</td></tr>
                    {(med.location === undefined) ? '' :
                      <tr><td>Location: {med.location?.display}</td></tr>
                    }
                    {med.note?.map((note, idx) => (
                      <tr key={idx}><td>Note: {note.text}</td></tr>
                    ))}
                  </tbody></table>
                </td>
              </tr>
            ))}
          </tbody></table>
        }

      </div>
    </div>
  )

}
