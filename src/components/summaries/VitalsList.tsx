import '../../Home.css'
import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom"
import { FHIRData, displayDate, displayValue } from '../../models/fhirResources'
import { PatientSummary, ScreeningSummary, ObservationSummary } from '../../models/cqlSummary'
import { getVitalSignSummary } from '../../service/mccCqlService'

interface VitalsListProps {
  fhirData?: FHIRData,
  patientSummary?: PatientSummary,
  screenings?: [ScreeningSummary]
}

interface VitalsListState {
  vitalSignSummary?: ObservationSummary[]
}

export const VitalsList: React.FC<VitalsListProps> = (props: VitalsListProps) => {

  const [vitalSignSummary, setVitalSignSummary] =
    useState<[ObservationSummary] | undefined>(getVitalSignSummary(props.fhirData))

  useEffect(() => {
    console.time('getVitalSignSummary()')
    setVitalSignSummary(getVitalSignSummary(props.fhirData))
    console.timeEnd('getVitalSignSummary()')
  }, [props.fhirData])

  return (
    <div className="home-view">
      <div className="welcome">

        <h4 className="title">Vitals</h4>

        {vitalSignSummary === undefined || vitalSignSummary?.length < 1 ? <p>No records found.</p> :
          <table><tbody>
            {vitalSignSummary?.map((obs, idx) => (
              <tr key={idx}>
                <td>
                  <table><tbody>
                    <tr>
                      <td colSpan={2}><b>{obs.DisplayName}</b></td>
                    </tr>
                    <tr>
                      <td colSpan={1} align="left">{obs.ResultText}</td>
                      <td colSpan={1} align="right">{displayDate(obs.Date)}</td>
                    </tr>
                    <tr><td colSpan={2}>Performed by: {obs.Performer ?? 'Unknown'}</td></tr>
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
