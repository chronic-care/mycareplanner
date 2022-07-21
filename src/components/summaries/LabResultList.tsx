import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom"
import { FHIRData, displayDate } from '../../models/fhirResources'
import { PatientSummary, ScreeningSummary, ObservationSummary } from '../../models/cqlSummary'
import { getLabResultSummary } from '../../service/mccCqlService'

interface LabResultListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface LabResultListState {
  labResultSummary?: ObservationSummary[]
}

export const LabResultList: React.FC<LabResultListProps> = (props: LabResultListProps) => {

  const [labResultSummary, setLabResultSummary] = useState<ObservationSummary[] | undefined>([
    { ConceptName: 'init', DisplayName: 'init', ResultText: 'init' }
  ])

  useEffect(() => {
    console.time('getLabResultSummary()')
    setLabResultSummary(getLabResultSummary(props.fhirData))
    console.timeEnd('getLabResultSummary()')
  }, [props.fhirData])

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Lab Results</h4>

        {labResultSummary && labResultSummary.length > 0 && labResultSummary[0]?.ConceptName === 'init' ? <p>Loading...</p> : !labResultSummary || labResultSummary.length < 1 ? <p>No records found.</p> :
          <table><tbody>
            {labResultSummary?.map((obs, idx) => (
              <tr key={idx}>
                <td>
                  <table><tbody>
                    <tr>
                      <td colSpan={3}><b>{obs.DisplayName}</b></td>
                      <td align="right">{obs.LearnMore === undefined || obs.LearnMore === null ? '' :
                        <Link to="route" target="_blank" onClick={(event) => { event.preventDefault(); window.open(obs.LearnMore); }}><i>Learn&nbsp;More</i></Link>}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} align="left">{obs.ResultText}</td>
                      <td colSpan={2} align="right">{displayDate(obs.Date)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3}>{obs.ReferenceRange === null ? '' : 'Range: ' + obs.ReferenceRange}</td>
                      <td align="right"><b>{obs.Interpretation}</b></td>
                    </tr>
                    {/* {obs.Notes?.map((note, idx) => (
                  <tr key={idx}><td colSpan={4}>Note: {note}</td></tr>
                ))} */}
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
