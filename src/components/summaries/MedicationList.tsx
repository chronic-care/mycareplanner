import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FHIRData, displayDate } from '../../models/fhirResources'
import { PatientSummary, ScreeningSummary, MedicationSummary } from '../../models/cqlSummary'
import { getMedicationSummary } from '../../service/mccCqlService'

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

        {medicationSummary && medicationSummary.length > 0 && medicationSummary[0]?.ConceptName === 'init' ? <p>Loading...</p> : !medicationSummary || medicationSummary.length < 1 ? <p>No records found.</p> :
          <table><tbody>
            {medicationSummary?.map((med, idx) => (
              <tr key={idx}>
                <td>
                  <table><tbody>
                    <tr>
                      <td colSpan={3}><b>{med.ConceptName ?? "No text"}</b></td>
                      <td align="right">{med.LearnMore === undefined || med.LearnMore === null ? '' :
                        <Link to="route" target="_blank" onClick={(event) => { event.preventDefault(); window.open(med.LearnMore); }}><i>Learn&nbsp;More</i></Link>}</td>
                    </tr>
                    <tr><td colSpan={2}>{displayDate(med.AuthoredOn)}</td><td colSpan={2}>By: {med.Requester ?? 'Unknown'}</td></tr>
                    <tr><td colSpan={4}>{med.DosageInstruction}</td></tr>
                    {med.Notes?.map((note, idx) => (
                      <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
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
